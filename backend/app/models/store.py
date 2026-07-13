from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from app.db.database import Base


class Store(Base):
    __tablename__ = "stores"

    store_id = Column(Integer, primary_key=True, index=True)

    hangout_id = Column(
        Integer,
        ForeignKey("hangouts.hangout_id")
    )

    store_name = Column(String)

    location_lat = Column(Float)

    location_lng = Column(Float)

    assigned_person_names = Column(ARRAY(String))

    items_to_buy = Column(ARRAY(String))