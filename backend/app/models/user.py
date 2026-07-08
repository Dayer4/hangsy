from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, index=True)

    email = Column(String, unique=True, index=True)

    full_name = Column(String)

    hangout_id = Column(
        Integer,
        ForeignKey("hangouts.hangout_id")
    )