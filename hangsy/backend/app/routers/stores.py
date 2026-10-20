from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.store import Store
from app.models.item import Item
from app.models.pickup import Pickup
from app.models.hangout import Hangout
from app.models.todo import Todo
from app.models.user import User
from app.schemas.store import StoreCreate, StoreResponse
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/stores",
    tags=["Stores"]
)


def _ensure_shopping_todo(db: Session, hangout_id: int) -> None:
    """Auto-creates a "Buy items for <Hangout>" todo the first time a
    hangout gets a store. Guarded by auto_generated so it only ever happens
    once per hangout, however many times stores get added/removed/reloaded
    afterward — the check runs on every create_store call, so it has to be
    idempotent.

    Decisions worth remembering (see also [[Bugs and Issues]] in Obsidian):
    - Goes to the hangout's CREATOR, not whoever happened to add the store.
    - Removing all of a hangout's stores/items does NOT delete or complete
      this todo — it tracks "did I handle the shopping", not item count.
    - If the hangout itself is deleted, this todo is unlinked (hangout_id
      set to null), not deleted — see routers/hangouts.py.
    """
    already_exists = (
        db.query(Todo)
        .filter(Todo.hangout_id == hangout_id, Todo.auto_generated.is_(True))
        .first()
    )
    if already_exists:
        return

    hangout = db.query(Hangout).filter(Hangout.hangout_id == hangout_id).first()
    if not hangout:
        return

    db.add(Todo(
        user_id=hangout.creator_id,
        text=f"Buy items for {hangout.hangout_name}",
        hangout_id=hangout_id,
        auto_generated=True,
    ))
    db.commit()


def _ensure_pickup(db: Session, store: Store) -> None:
    """Every store IS a routing stop — someone has to physically go there to
    buy the items on the shopping list. Rather than make people re-enter
    the same name/address in a separate "add a stop" form for route
    optimization, a matching Pickup is auto-created here, linked back via
    store_id. See routers/routes.py for how these feed the OR-Tools solve.
    """
    db.add(Pickup(
        pickup_name=store.store_name,
        hangout_id=store.hangout_id,
        location_lat=store.location_lat,
        location_lng=store.location_lng,
        store_id=store.store_id,
    ))
    db.commit()


@router.post("/", response_model=StoreResponse)
def create_store(
    store: StoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_store = Store(
        **store.model_dump()
    )

    db.add(new_store)
    db.commit()
    db.refresh(new_store)

    _ensure_shopping_todo(db, store.hangout_id)
    _ensure_pickup(db, new_store)

    return new_store


@router.get("/", response_model=list[StoreResponse])
def get_stores(
    hangout_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Store)
    if hangout_id is not None:
        query = query.filter(Store.hangout_id == hangout_id)
    return query.all()


@router.delete("/{store_id}")
def delete_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    store = db.query(Store).filter(Store.store_id == store_id).first()

    if store is None:
        raise HTTPException(
            status_code=404,
            detail="Store not found"
        )

    # Items FK to stores with no ON DELETE CASCADE at the DB level, so this
    # store's items have to go first or Postgres rejects the delete — same
    # failure mode as the reset.py/Todo lesson from earlier. This only
    # removes THIS hangout's store + its items; there's no shared/global
    # store catalog in Hangsy for other hangouts to be affected by.
    db.query(Item).filter(Item.store_id == store_id).delete()

    # Same reasoning for its auto-created Pickup (see _ensure_pickup above)
    # — any Route referencing that pickup_id is now stale too, but a Route
    # references pickups via a plain ARRAY(Integer), not a real FK, so
    # there's nothing at the DB level to clean up there; a stale id just
    # won't resolve to anything if looked up later. Not ideal, but no worse
    # than the pre-existing pickup_ids-isn't-a-real-FK situation documented
    # in routers/routes.py's _validate_pickup_ids.
    db.query(Pickup).filter(Pickup.store_id == store_id).delete()

    db.delete(store)
    db.commit()

    return {"message": "Store deleted successfully"}


@router.get("/{store_id}", response_model=StoreResponse)
def get_store(
    store_id: int,
    db: Session = Depends(get_db)
):
    store = db.query(Store).filter(Store.store_id == store_id).first()

    if store is None:
        raise HTTPException(status_code=404, detail="Store not found")

    return store
