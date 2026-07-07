from sqlalchemy import Column, Integer, String
from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(Integer, primary_key=True, index=True)

    driver_name = Column(String)

    capacity = Column(Integer)