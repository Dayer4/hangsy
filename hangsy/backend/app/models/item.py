from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from app.db.connection import Base


class Item(Base):
    __tablename__ = "items"

    item_id = Column(Integer, primary_key=True, index=True)

    hangout_id = Column(Integer, ForeignKey("hangouts.hangout_id"))
    store_id = Column(Integer, ForeignKey("stores.store_id"))

    buyer_name = Column(String)

    quantity = Column(Integer)

    item_name = Column(String)

    # Float, not Integer — matches schemas/item.py so prices like $4.99
    # don't get silently truncated. See Obsidian: Bugs and Issues.md.
    cost_per_unit = Column(Float)

    total_item_cost = Column(Float)

    link = Column(String)

    notes = Column(String)

    bought = Column(Boolean, default=False)