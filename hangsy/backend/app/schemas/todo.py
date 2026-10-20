from typing import Optional
from pydantic import BaseModel


class TodoBase(BaseModel):
    text: str


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    text: Optional[str] = None
    done: Optional[bool] = None


class TodoResponse(TodoBase):
    todo_id: int
    done: bool
    hangout_id: Optional[int] = None
    auto_generated: bool = False

    class Config:
        from_attributes = True
