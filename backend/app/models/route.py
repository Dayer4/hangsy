from sqlalchemy import Column, Integer, String, Float, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.database import Base


class Route(Base):
    __tablename__ = "routes"

    route_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    hangout_id = Column(
        Integer,
        ForeignKey("hangouts.hangout_id")
    )

    starting_lat = Column(
        Float
    )

    starting_lng = Column(
        Float
    )

    # each index represents a pickup and the first is the first pick up 2nd is second pick up etc.
    pickup_ids = Column(
        ARRAY(Integer),
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