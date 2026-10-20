from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.connection import Base


class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    driver_name = Column(String)

    capacity = Column(Integer)

    license_plate = Column(String, nullable=True)

    notes = Column(String, nullable=True)

    # Links this vehicle to the user who saved it in Settings. Nullable and
    # unique — a driver profile belongs to at most one user, and a user has
    # at most one saved vehicle (their "default vehicle" in Settings).
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, unique=True)
