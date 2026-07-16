from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemResponse


router = APIRouter(
    prefix="/items",
    tags=["Items"]
)

@router.post("/", response_model=ItemResponse)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db)
):
    new_item = Item(
        **item.model_dump(),
        total_item_cost=item.quantity * item.cost_per_unit
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item

@router.get("/")
def get_items(db: Session = Depends(get_db)):
    items = db.query(Item).all()
    return items

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.item_id == item_id).first()

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    db.delete(item)
    db.commit()

    return {"message": "Item deleted"}