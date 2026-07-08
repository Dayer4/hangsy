from pydantic import BaseModel
from typing import Optional


class RouteBase(BaseModel):
    hangout_id: int
    stop_order: int
    stop_type: str
    location_lat: float
    location_lng: float
    driver_id: Optional[int] = None
    pin_file_path: Optional[str] = None


class RouteCreate(RouteBase):
    pass


class RouteResponse(RouteBase):
    route_id: int

    class Config:
        from_attributes = True