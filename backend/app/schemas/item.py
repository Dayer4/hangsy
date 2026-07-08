from pydantic import BaseModel
from typing import Optional


class ItemBase(BaseModel):
    hangout_id: int
    store_id: int
    buyer_name: str
    quantity: int
    item_name: str
    cost_per_unit: float
    link: Optional[str] = None
    notes: Optional[str] = None
    bought: bool = False


class ItemCreate(ItemBase):
    pass


class ItemResponse(ItemBase):
    item_id: int
    total_item_cost: float

    class Config:
        from_attributes = True