from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    hangout_id: Optional[int] = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    user_id: int

    class Config:
        from_attributes = True