from pydantic import BaseModel
from typing import Optional


class PickupBase(BaseModel):
    hangout_id: int
    pickup_name: str
    location_lat: float
    location_lng: float
    driver_id: Optional[int] = None


class PickupCreate(PickupBase):
    pass


class PickupResponse(PickupBase):
    pickup_id: int

    class Config:
        from_attributes = True
