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
    # NOTE: password is intentionally NOT included here — this used to inherit
    # it from UserBase and leak the hashed password in every API response.
    # this auto increments because of the model primary key: "user_id = Column(Integer, primary_key=True, index=True)"

    class Config:
        from_attributes = True
