from fastapi import APIRouter, Depends
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