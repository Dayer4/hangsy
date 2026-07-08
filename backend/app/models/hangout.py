from sqlalchemy import Column, Integer, String, Float
from app.db.database import Base


class Hangout(Base):
    __tablename__ = "hangouts"

    hangout_id = Column(Integer, primary_key=True, index=True)

    hangout_name = Column(String)

    hangout_location_lat = Column(Float)

    hangout_location_lng = Column(Float)

    hangout_date = Column(Integer)

    creation_date = Column(Integer)

    hangout_description = Column(String)

    stores = Column(Float)

    attendees = Column(String)