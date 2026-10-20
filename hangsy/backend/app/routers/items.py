import os
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.item import Item
from app.models.user import User
from app.schemas.item import ItemCreate, ItemResponse, ItemUpdate
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/items",
    tags=["Items"]
)


@router.post("/", response_model=ItemResponse)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_item = Item(
        **item.model_dump(),
        total_item_cost=item.quantity * item.cost_per_unit
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.get("/", response_model=list[ItemResponse])
def get_items(
    hangout_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Item)
    if hangout_id is not None:
        query = query.filter(Item.hangout_id == hangout_id)
    return query.all()


@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    item_update: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Item).filter(Item.item_id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    updates = item_update.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(item, key, value)

    # Keep the derived total in sync whenever either input to it changes.
    if "quantity" in updates or "cost_per_unit" in updates:
        item.total_item_cost = item.quantity * item.cost_per_unit

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(Item).filter(Item.item_id == item_id).first()

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    db.delete(item)
    db.commit()

    return {"message": "Item deleted"}


# ---------- Kroger autosuggest (item name -> real product matches) ----------

KROGER_CLIENT_ID = os.getenv("KROGER_CLIENT_ID")
KROGER_CLIENT_SECRET = os.getenv("KROGER_CLIENT_SECRET")


def _get_kroger_token() -> str:
    """Client-credentials grant — fetched fresh per request rather than
    cached, since this is a low-volume prototype endpoint. Cache this
    (it's valid ~30 min) if autosuggest usage grows."""
    response = httpx.post(
        "https://api.kroger.com/v1/connect/oauth2/token",
        data={"grant_type": "client_credentials", "scope": "product.compact"},
        auth=(KROGER_CLIENT_ID, KROGER_CLIENT_SECRET),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10.0,
    )
    response.raise_for_status()
    return response.json()["access_token"]


@router.get("/suggest")
def suggest_items(q: str):
    """Autosuggest real products/prices from Kroger for a partial item name.
    Requires KROGER_CLIENT_ID/KROGER_CLIENT_SECRET (kroger.com/developer) —
    without them this 501s with a clear message instead of pretending to work.
    """
    if not KROGER_CLIENT_ID or not KROGER_CLIENT_SECRET:
        raise HTTPException(
            status_code=501,
            detail="Kroger autosuggest isn't configured (set KROGER_CLIENT_ID / "
                   "KROGER_CLIENT_SECRET in .env — see kroger.com/developer)"
        )

    token = _get_kroger_token()
    response = httpx.get(
        "https://api.kroger.com/v1/products",
        params={"filter.term": q, "filter.limit": 5},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10.0,
    )
    response.raise_for_status()
    data = response.json().get("data", [])

    return [
        {
            "name": product.get("description"),
            "price": (
                product.get("items", [{}])[0]
                .get("price", {})
                .get("regular")
            ),
        }
        for product in data
    ]
