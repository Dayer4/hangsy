from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleLoginRequest(BaseModel):
    credential: str  # the ID token Google's Identity Services button hands back


class UsernameChangeRequest(BaseModel):
    username: str


class ResendVerificationRequest(BaseModel):
    # Whichever the caller has on hand: Settings has the email, the login
    # page (for a "resend" link off an unverified-login error) only has
    # the username the person typed. At least one is required.
    email: Optional[str] = None
    username: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    username: str


class ConfirmPasswordChangeRequest(BaseModel):
    token: str
    new_password: str
