from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.db.connection import Base


class Hangout(Base):
    __tablename__ = "hangouts"

    hangout_id = Column(Integer, primary_key=True, index=True)

    hangout_name = Column(String)

    hangout_location_lat = Column(Float)

    hangout_location_lng = Column(Float)

    hangout_date = Column(Integer)

    creation_date = Column(Integer)

    hangout_description = Column(String)

    # Shown as the hangout's icon on cards/calendar. A curated emoji picker on
    # the frontend, not free text — keeps it simple, no image upload pipeline
    # needed for the common case.
    emoji = Column(String, nullable=True)

    # Optional cover image, stored as a plain URL (e.g. pasted or hotlinked).
    # There's no file-upload/object-storage backend yet, so this can't accept
    # an uploaded file directly — see Obsidian: Bugs and Issues.md.
    image_url = Column(String, nullable=True)

    # `stores` column removed — Store already FKs to Hangout via hangout_id,
    # this was a stray unused Float that nothing read or wrote. See Obsidian:
    # Bugs and Issues.md.

    attendees = Column(String)

    creator_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )