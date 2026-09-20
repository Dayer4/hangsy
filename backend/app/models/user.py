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

    # Set via drag-and-drop upload in Settings (uploads to Cloudinary, same
    # free-tier path as hangout cover images) or left null for the navbar's
    # initial-letter avatar fallback.
    profile_picture_url = Column(String, nullable=True)

    is_verified = Column(Boolean, default=False)

    verification_token = Column(String, nullable=True)

    google_calendar_refresh_token = Column(String, nullable=True)

    hangout_ids = Column(
        ARRAY(Integer),
        default=list
    )