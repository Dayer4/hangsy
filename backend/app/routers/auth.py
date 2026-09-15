import os

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.db.connection import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import LoginRequest, Token, GoogleLoginRequest
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
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
        hangout_ids=user.hangout_ids
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not user.password or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token(user.user_id)
    return Token(access_token=token)


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
    via /auth/login, only via this endpoint.
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
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.user_id)
    return Token(access_token=token)


def get_current_user(
    authorization: str = Header(default=None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency for protecting routes: Depends(get_current_user).

    Expects `Authorization: Bearer <token>`. Not wired into any routes yet —
    add it as a dependency wherever a route needs to require login.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.removeprefix("Bearer ").strip()
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")

    return user
