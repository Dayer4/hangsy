# app/routers/hangouts.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.hangout import Hangout
from app.schemas.hangout import HangoutCreate, HangoutResponse


router = APIRouter(
    prefix="/hangouts",
    tags=["Hangouts"]
)


@router.post("/", response_model=HangoutResponse)
def create_hangout(
    hangout: HangoutCreate,
    db: Session = Depends(get_db)
):
    new_hangout = Hangout(
        **hangout.model_dump()
    )

    db.add(new_hangout)
    db.commit()
    db.refresh(new_hangout)

    return new_hangout