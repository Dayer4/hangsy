from sqlalchemy import Column, Integer, String, Float, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.connection import Base


class Route(Base):
    __tablename__ = "routes"

    route_id = Column(
        Integer,
        primary_key=True,
        index=True,
        nullable=False
    )

    # each index represents a pickup and the first is the starting point up 2nd is second pick up last is the stopping point.

    pickup_ids = Column(
        ARRAY(Integer),
        nullable=False
    )
    
    pickup_order = Column(
        Integer,
        index=True,
        nullable=False
    )

    hangout_id = Column(
        Integer,
        ForeignKey("hangouts.hangout_id"),
        nullable=False
    )

    location_lat = Column(
        Float,
        nullable=False
    )
    location_lng = Column(
        Float,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "array_length(pickup_ids, 1) >= 1",
            name="at_least_one_pickup"
        ),
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.driver_id"),
        nullable=True
    )