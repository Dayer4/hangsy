from pydantic import BaseModel
from typing import Optional


class StoreBase(BaseModel):
    hangout_id: int
    store_name: str
    location_lat: float
    location_lng: float
    pin_file_path: Optional[str] = None
    assigned_person_name: Optional[str] = None
    items_to_buy: str


class StoreCreate(StoreBase):
    pass


class StoreResponse(StoreBase):
    store_id: int

    class Config:
        from_attributes = True