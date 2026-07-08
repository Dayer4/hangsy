from pydantic import BaseModel
from typing import Optional


class HangoutBase(BaseModel):
    hangout_name: str
    hangout_location_lat: float
    hangout_location_lng: float
    hangout_date: int
    creation_date: int
    hangout_description: Optional[str] = None
    stores: int
    attendees: str


class HangoutCreate(HangoutBase):
    pass


class HangoutResponse(HangoutBase):
    hangout_id: int

    class Config:
        from_attributes = True