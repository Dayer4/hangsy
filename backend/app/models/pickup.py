from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db.database import Base


class Pickup(Base):
    __tablename__ = "pickups"

    pickup_id = Column(Integer, primary_key=True, index=True)

    hangout_id = Column(
        Integer,
        ForeignKey("hangouts.hangout_id")
    )

    location_lat = Column(Float)

    location_lng = Column(Float)

    driver_id = Column(Integer, ForeignKey("drivers.driver_id"), nullable=True)