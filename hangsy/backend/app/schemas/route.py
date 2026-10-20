from pydantic import BaseModel
from typing import List, Optional


class RouteBase(BaseModel):
    hangout_id: int
    pickup_ids: List[int]
    pickup_order: int
    location_lat: float
    location_lng: float
    driver_id: Optional[int] = None


class RouteCreate(RouteBase):
    pass


class RouteResponse(RouteBase):
    route_id: int

    class Config:
        from_attributes = True
