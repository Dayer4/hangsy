from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.database import Base


class Item(Base):
    __tablename__ = "items"

    item_id = Column(Integer, primary_key=True, index=True)

    hangout_id = Column(Integer, ForeignKey("hangouts.hangout_id"))
    store_id = Column(Integer, ForeignKey("stores.store_id"))

    buyer_name = Column(String)

    quantity = Column(Integer)

    item_name = Column(String)

    cost_per_unit = Column(Integer)

    total_item_cost = Column(Integer)

    link = Column(String)

    notes = Column(String)

    bought = Column(Boolean, default=False)