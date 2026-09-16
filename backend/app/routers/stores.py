from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.store import Store
from app.models.user import User
from app.schemas.store import StoreCreate, StoreResponse
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/stores",
    tags=["Stores"]
)


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
