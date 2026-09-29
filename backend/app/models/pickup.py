from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db.connection import Base


class Pickup(Base):
    __tablename__ = "pickups"

    pickup_id = Column(Integer, primary_key=True, index=True)

    pickup_name = Column(String, nullable=False)

    hangout_id = Column(
        Integer,
        ForeignKey("hangouts.hangout_id")
    )

    # Nullable: a pickup doesn't have to come from a store (could be "pick
    # up Alice from her place" someday), but most do today — see
    # routers/stores.py's create_store, which auto-creates one of these for
    # every store so the shopping list and the route map stay in sync
    # without a second, redundant "add a stop" form.
    store_id = Column(Integer, ForeignKey("stores.store_id"), nullable=True)

    location_lat = Column(Float)

    location_lng = Column(Float)

    driver_id = Column(Integer, ForeignKey("drivers.driver_id"), nullable=True)