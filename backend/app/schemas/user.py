from pydantic import BaseModel, Field
from typing import List, Optional


class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    hangout_ids: List[int] = Field(default_factory=list)


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    """For PATCH /auth/me — every field optional, only what's sent gets
    changed. username/password changes aren't offered here; that's a
    bigger surface (uniqueness checks, re-auth) not asked for yet."""
    email: Optional[str] = None
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None


class UserResponse(UserBase):
    user_id: int
    is_verified: bool = False
    profile_picture_url: Optional[str] = None

    # password and verification_token are intentionally NOT included

    class Config:
        from_attributes = True