from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.connection import Base


class Todo(Base):
    """A personal to-do item on the logged-in user's home page. Not tied to
    any hangout — general planning notes ("book the cabin", "buy ice") live
    here, separate from a hangout's own Item/shopping-list rows."""

    __tablename__ = "todos"

    todo_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    text = Column(String, nullable=False)

    done = Column(Boolean, default=False)
