from pydantic import BaseModel


class DriverBase(BaseModel):
    driver_name: str
    capacity: int


class DriverCreate(DriverBase):
    pass


class DriverResponse(DriverBase):
    driver_id: int

    class Config:
        from_attributes = True