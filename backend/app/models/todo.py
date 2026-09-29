from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.connection import Base


class Todo(Base):
    """A to-do item on the logged-in user's home page. Most are personal
    (hangout_id is null) — general planning notes ("book the cabin") that
    don't belong to any one hangout. Some are auto-generated: the first time
    a store is added to a hangout, a "Buy items for <Hangout>" todo gets
    created for that hangout's creator (see routers/stores.py), linked back
    via hangout_id and flagged auto_generated so the UI can badge it."""

    __tablename__ = "todos"

    todo_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    text = Column(String, nullable=False)

    done = Column(Boolean, default=False)

    # Nullable — most todos aren't tied to a hangout at all. When a hangout
    # is deleted, this gets set to null rather than the todo being deleted
    # too (see routers/hangouts.py): a personal task list is yours to keep
    # even if the plan it came from falls through.
    hangout_id = Column(Integer, ForeignKey("hangouts.hangout_id"), nullable=True)

    auto_generated = Column(Boolean, default=False)
