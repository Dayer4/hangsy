from pydantic import BaseModel
from typing import List, Optional


class StoreBase(BaseModel):
    hangout_id: int
    store_name: str
    location_lat: float
    location_lng: float
    assigned_person_names: Optional[List[str]] = None
    items_to_buy: List[str]


class StoreCreate(StoreBase):
    pass


class StoreResponse(StoreBase):
    store_id: int

    class Config:
        from_attributes = True
