from pydantic import BaseModel
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    hangout_ids: List[int] = []


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    user_id: int
    is_verified: bool = False
    # NOTE: password and verification_token are intentionally NOT included
    # here — UserResponse used to inherit password from UserBase and leak
    # the hashed password in every API response.

    class Config:
        from_attributes = True
