import os
import re
import secrets
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.db.connection import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.schemas.auth import (
    LoginRequest,
    Token,
    GoogleLoginRequest,
    UsernameChangeRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ConfirmPasswordChangeRequest,
)
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.utils.email import send_email


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,20}$")
USERNAME_CHANGE_COOLDOWN = timedelta(minutes=1)

# Signup links are low-stakes (worst case: someone re-clicks an old one and
# it's expired) so they get a generous window. Password-reset links
# authorize something much more sensitive with no other check standing
# behind them, so they get a short one — this is the standard split most
# auth systems make, not a Hangsy-specific number.
SIGNUP_TOKEN_TTL = timedelta(hours=24)
PASSWORD_RESET_TOKEN_TTL = timedelta(minutes=30)

RESEND_COOLDOWN = timedelta(seconds=60)

MIN_PASSWORD_LENGTH = 8

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def _check_resend_cooldown(user: User) -> None:
    if user.verification_sent_at:
        elapsed = datetime.now(timezone.utc) - user.verification_sent_at
        if elapsed < RESEND_COOLDOWN:
            wait_seconds = int((RESEND_COOLDOWN - elapsed).total_seconds()) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait_seconds}s before requesting another email",
            )


def _issue_verification_token(db: Session, user: User, purpose: str) -> None:
    """Generates a fresh token for either flow, stores it (overwriting
    whatever was pending before — see the model's comment on why that's
    fine), and emails the right link for that purpose. Shared by register,
    resend-verification, the email-change path in update_me, and both
    password-change entry points, so there's exactly one place that knows
    how these tokens are minted and sent.
    """
    token = secrets.token_urlsafe(32)
    ttl = SIGNUP_TOKEN_TTL if purpose == "signup" else PASSWORD_RESET_TOKEN_TTL

    user.verification_token = token
    user.verification_token_purpose = purpose
    user.verification_token_expires_at = datetime.now(timezone.utc) + ttl
    user.verification_sent_at = datetime.now(timezone.utc)
    db.commit()

    if purpose == "signup":
        link = f"{FRONTEND_URL}/verify?token={token}"
        send_email(
            to=user.email,
            subject="Verify your Hangsy account",
            html=(
                f"<p>Welcome to Hangsy! Click below to verify your email:</p>"
                f"<p><a href=\"{link}\">{link}</a></p>"
                f"<p>This link expires in 24 hours.</p>"
            ),
        )
    else:  # password_reset
        link = f"{FRONTEND_URL}/reset-password?token={token}"
        send_email(
            to=user.email,
            subject="Reset your Hangsy password",
            html=(
                f"<p>Click below to set a new password:</p>"
                f"<p><a href=\"{link}\">{link}</a></p>"
                f"<p>This link expires in 30 minutes. If you didn't request this, "
                f"you can safely ignore this email — your password won't change.</p>"
            ),
        )


@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    new_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password=get_password_hash(user.password),
        hangout_ids=user.hangout_ids,
        is_verified=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    _issue_verification_token(db, new_user, "signup")

    return new_user


@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()

    if not user or user.verification_token_purpose != "signup":
        raise HTTPException(status_code=400, detail="Invalid or already-used verification link")

    if user.verification_token_expires_at and datetime.now(timezone.utc) > user.verification_token_expires_at:
        raise HTTPException(
            status_code=400,
            detail="This verification link has expired — request a new one from the login page",
        )

    user.is_verified = True
    user.verification_token = None
    user.verification_token_purpose = None
    user.verification_token_expires_at = None
    db.commit()

    return {"message": "Email verified — you can log in now"}


@router.post("/resend-verification")
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Public and deliberately vague in its response — it should be
    unusable for checking whether an email/username exists or is already
    verified. (One honest gap: a real requester still gets a 429 on a
    repeat within the cooldown while a nonexistent one always gets 200, so
    this isn't airtight against enumeration via timing — acceptable for a
    project this size, worth knowing about if that ever matters more.)
    """
    generic_response = {"message": "If that account needs verifying, we've sent a new link."}

    if not payload.email and not payload.username:
        raise HTTPException(status_code=400, detail="Provide an email or username")

    query = db.query(User)
    user = (
        query.filter(User.email == payload.email).first()
        if payload.email
        else query.filter(User.username == payload.username).first()
    )

    if not user or user.is_verified:
        return generic_response

    _check_resend_cooldown(user)
    _issue_verification_token(db, user, "signup")
    return generic_response


@router.post("/login", response_model=Token)
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not user.password or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in — check your inbox for the link"
        )

    token = create_access_token(user.user_id, user.token_version)
    return Token(access_token=token)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """The login page's "Forgot password?" link — identifies by username
    (that's all the login form has), issues a password_reset token exactly
    like request_password_change below does, just without requiring a JWT
    first. Same generic response either way, for the same reason as
    resend_verification above.
    """
    generic_response = {
        "message": "If that account exists, we've sent a password reset link to its email."
    }

    user = db.query(User).filter(User.username == payload.username).first()
    if not user:
        return generic_response

    _check_resend_cooldown(user)
    _issue_verification_token(db, user, "password_reset")
    return generic_response


@router.post("/confirm-password-change")
def confirm_password_change(payload: ConfirmPasswordChangeRequest, db: Session = Depends(get_db)):
    """No JWT required — the token IS the credential here, same as clicking
    a signup verification link while logged out. Serves both "change my
    password" (requested from Settings) and "forgot my password" (requested
    from the login page); by design there's no way to tell which got you
    here, because it doesn't matter — proving you own the token is enough.
    """
    user = db.query(User).filter(User.verification_token == payload.token).first()

    if not user or user.verification_token_purpose != "password_reset":
        raise HTTPException(status_code=400, detail="Invalid or already-used link")

    if user.verification_token_expires_at and datetime.now(timezone.utc) > user.verification_token_expires_at:
        raise HTTPException(status_code=400, detail="This link has expired — request a new one")

    if len(payload.new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters")

    user.password = get_password_hash(payload.new_password)
    user.verification_token = None
    user.verification_token_purpose = None
    user.verification_token_expires_at = None

    # Every existing session dies here, including whichever browser is
    # submitting this request — see get_current_user's version check below
    # for why bumping this is enough on its own.
    user.token_version = (user.token_version or 1) + 1

    db.commit()

    return {"message": "Password changed — please log in again"}


def _unique_username_from_email(email: str, db: Session) -> str:
    """users.username is unique, but Google only gives us an email — derive
    a username from it (alice@x.com -> alice), disambiguating collisions."""
    base = email.split("@")[0]
    username = base
    suffix = 1
    while db.query(User).filter(User.username == username).first():
        suffix += 1
        username = f"{base}{suffix}"
    return username


@router.post("/google", response_model=Token)
def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """Called by the frontend's Google Identity Services button with the ID
    token it received directly from Google. We verify that token ourselves
    (never trust it un-verified) and then find-or-create a matching User by
    email. Google-created users get password=None — they can never log in
    via /auth/login, only via this endpoint. They're also auto-verified,
    since Google already confirmed the email for us.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google sign-in isn't configured (set GOOGLE_CLIENT_ID in .env)"
        )

    try:
        claims = google_id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google credential")

    email = claims.get("email")
    if not email or not claims.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google account has no verified email")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            username=_unique_username_from_email(email, db),
            email=email,
            full_name=claims.get("name") or email.split("@")[0],
            password=None,
            hangout_ids=[],
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.user_id, user.token_version)
    return Token(access_token=token)


def get_current_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency for protecting routes: Depends(get_current_user).

    Expects `Authorization: Bearer <token>`. Beyond the token's own
    signature/expiry, this also checks its embedded token_version against
    the user's current one — see User.token_version's comment for why.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.removeprefix("Bearer ").strip()
    decoded = decode_access_token(token)
    if decoded is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id, token_version = decoded

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")

    if user.token_version != token_version:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Settings' "Account" section — change email/name/profile picture.

    Changing your email now DOES reset is_verified and sends a fresh
    verification link to the new address (this was previously left as
    simple/unverified on purpose, back when resend was still a UI
    placeholder — now that real verification infrastructure exists, leaving
    an email change unverified would be a real gap: nothing would confirm
    the new address is actually yours). The current session stays logged in
    either way; only a future /auth/login attempt is blocked until the new
    address is verified.
    """
    updates = update.model_dump(exclude_unset=True)
    email_changed = "email" in updates and updates["email"] != current_user.email

    for key, value in updates.items():
        setattr(current_user, key, value)

    if email_changed:
        current_user.is_verified = False

    db.commit()
    db.refresh(current_user)

    if email_changed:
        _issue_verification_token(db, current_user, "signup")
        db.refresh(current_user)

    return current_user


@router.patch("/username", response_model=UserResponse)
def change_username(
    payload: UsernameChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Per spec: no email/password verification needed here, just a format
    check, a uniqueness check, and a 1-minute cooldown against rapid-fire
    changes. Nothing else needs updating when this changes — Friendship
    (and everything else) links people by user_id, never username.
    """
    new_username = payload.username.strip()

    if not USERNAME_PATTERN.match(new_username):
        raise HTTPException(
            status_code=400,
            detail="Usernames must be 3-20 characters: letters, numbers, and underscores only",
        )

    if current_user.username_changed_at:
        elapsed = datetime.now(timezone.utc) - current_user.username_changed_at
        if elapsed < USERNAME_CHANGE_COOLDOWN:
            wait_seconds = int((USERNAME_CHANGE_COOLDOWN - elapsed).total_seconds()) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Wait {wait_seconds}s before changing your username again",
            )

    if new_username == current_user.username:
        return current_user

    current_user.username = new_username
    current_user.username_changed_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except IntegrityError:
        # The uniqueness check that matters is this one, at the DB level
        # (users.username has unique=True) — it's what actually prevents two
        # people claiming the same name in a race. No separate pre-check
        # query is needed; it would just leave the same race open.
        db.rollback()
        raise HTTPException(status_code=409, detail="That username is already taken")

    db.refresh(current_user)
    return current_user


@router.post("/request-password-change", response_model=None)
def request_password_change(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Settings' "Change password" button — spec requires the account's
    email already be verified before this is allowed at all."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before changing your password",
        )

    _check_resend_cooldown(current_user)
    _issue_verification_token(db, current_user, "password_reset")

    return {"message": f"Check {current_user.email} for a link to finish changing your password."}
