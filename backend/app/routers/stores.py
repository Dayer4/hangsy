from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.store import Store
from app.schemas.store import StoreCreate, StoreResponse


router = APIRouter(
    prefix="/stores",
    tags=["Stores"]
)


@router.post("/", response_model=StoreResponse)
def create_store(
    store: StoreCreate,
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
):
    return db.query(Store).all()
@router.delete("/stores/{store_id}")
def delete_store(store_id: int, db: Session = Depends(get_db)):
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
    return db.query(Store).filter(
        Store.store_id == store_id
    ).first()