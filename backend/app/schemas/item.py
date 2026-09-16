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


class ItemUpdate(BaseModel):
    buyer_name: Optional[str] = None
    quantity: Optional[int] = None
    item_name: Optional[str] = None
    cost_per_unit: Optional[float] = None
    link: Optional[str] = None
    notes: Optional[str] = None
    bought: Optional[bool] = None


class ItemResponse(ItemBase):
    item_id: int
    total_item_cost: float

    class Config:
        from_attributes = True