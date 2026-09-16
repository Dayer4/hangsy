from pydantic import BaseModel
from typing import Optional


class DriverBase(BaseModel):
    driver_name: str
    capacity: int
    license_plate: Optional[str] = None
    notes: Optional[str] = None


class DriverCreate(DriverBase):
    pass


class DriverResponse(DriverBase):
    driver_id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True
