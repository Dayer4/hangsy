from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.connection import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True)

    email = Column(String, unique=True, index=True)

    full_name = Column(String)

    password = Column(String)

    # False until they click the link in their verification email (or sign in
    # via Google, which auto-verifies since Google already confirmed the
    # email). Login is blocked for unverified password accounts — see
    # routers/auth.py. This is the anti-bot-signup measure.
    is_verified = Column(Boolean, default=False)

    verification_token = Column(String, nullable=True)

    # Refresh token from the separate Calendar OAuth consent flow (different
    # from the Sign-In flow above — that one never gives us calendar access).
    # Null until the user clicks "Connect Google Calendar." Never exposed in
    # UserResponse.
    google_calendar_refresh_token = Column(String, nullable=True)

    hangout_ids = Column(
        ARRAY(Integer),
        default=list
    )