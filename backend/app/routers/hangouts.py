# app/routers/hangouts.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.hangout import Hangout
from app.models.item import Item
from app.models.store import Store
from app.models.route import Route
from app.models.pickup import Pickup
from app.models.todo import Todo
from app.models.user import User
from app.schemas.hangout import HangoutCreate, HangoutResponse
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/hangouts",
    tags=["Hangouts"]
)


@router.get("/", response_model=list[HangoutResponse])
def get_hangouts(db: Session = Depends(get_db)):
    return db.query(Hangout).all()


# Hangouts the logged-in user actually belongs to (via User.hangout_ids),
# rather than every hangout in the database. This is what the dashboard uses.
@router.get("/mine", response_model=list[HangoutResponse])
def get_my_hangouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.hangout_ids:
        return []

    return db.query(Hangout).filter(
        Hangout.hangout_id.in_(current_user.hangout_ids)
    ).all()


@router.get("/{hangout_id}", response_model=HangoutResponse)
def get_hangout(hangout_id: int, db: Session = Depends(get_db)):
    hangout = db.query(Hangout).filter(
        Hangout.hangout_id == hangout_id
    ).first()

    if not hangout:
        raise HTTPException(
            status_code=404,
            detail="Hangout not found"
        )

    return hangout


@router.delete("/{hangout_id}")
def delete_hangout(
    hangout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hangout = db.query(Hangout).filter(Hangout.hangout_id == hangout_id).first()

    if hangout is None:
        raise HTTPException(
            status_code=404,
            detail="Hangout not found"
        )

    # Manual cascade: none of these foreign keys have ON DELETE CASCADE at
    # the DB level (same lesson as reset.py's missing-Todo-import bug — see
    # Obsidian: Bugs and Issues.md), so child rows across several tables
    # have to be cleaned up by hand, in FK-safe order, before the hangout
    # itself can go. This was already a latent bug before today (deleting
    # any hangout with a store would already have crashed); adding Todo's
    # hangout_id link made it strictly worse, so it's fixed now rather than
    # left for later.
    db.query(Item).filter(Item.hangout_id == hangout_id).delete()
    db.query(Route).filter(Route.hangout_id == hangout_id).delete()
    db.query(Pickup).filter(Pickup.hangout_id == hangout_id).delete()
    db.query(Store).filter(Store.hangout_id == hangout_id).delete()

    # Personal todos outlive the hangout that spawned them (see
    # routers/stores.py's _ensure_shopping_todo) — unlink, don't delete
    # someone's task list just because the plan fell through.
    db.query(Todo).filter(Todo.hangout_id == hangout_id).update({Todo.hangout_id: None})

    # Every user who had this hangout in their hangout_ids array needs it
    # scrubbed out, or GET /hangouts/mine would break trying to look up a
    # hangout_id that no longer exists.
    members = db.query(User).filter(User.hangout_ids.any(hangout_id)).all()
    for member in members:
        member.hangout_ids = [h for h in member.hangout_ids if h != hangout_id]

    db.delete(hangout)
    db.commit()

    return {"message": "Hangout deleted successfully"}


@router.post("/", response_model=HangoutResponse)
def create_hangout(
    hangout: HangoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = hangout.model_dump()
    # Trust the token, not whatever creator_id the client sent — otherwise
    # anyone could create a hangout "as" another user.
    data["creator_id"] = current_user.user_id

    new_hangout = Hangout(**data)

    db.add(new_hangout)
    db.commit()
    db.refresh(new_hangout)

    current_user.hangout_ids = [*(current_user.hangout_ids or []), new_hangout.hangout_id]
    db.commit()

    return new_hangout
