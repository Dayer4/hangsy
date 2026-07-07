from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base


class Route(Base):
    __tablename__ = "routes"

    route_id = Column(Integer, primary_key=True, index=True)

    hangout_id = Column(
        Integer,
        ForeignKey("hangouts.hangout_id")
    )

    stop_order = Column(Integer)

    stop_type = Column(String)

    location_lat = Column(Float)

    location_lng = Column(Float)

    driver_id = Column(Integer, ForeignKey("drivers.driver_id"), nullable=True)

    pin_file_path = Column(String)