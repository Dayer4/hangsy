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

@router.get("/hangouts/")
def get_hangouts(db: Session = Depends(get_db)):
    hangouts = db.query(Hangout).all()
    return hangouts
@router.delete("/hangouts/{hangout_id}")
def delete_hangout(hangout_id: int, db: Session = Depends(get_db)):
    hangout = db.query(Hangout).filter(Hangout.hangout_id == hangout_id).first()

    if hangout is None:
        raise HTTPException(
            status_code=404,
            detail="Hangout not found"
        )

    db.delete(hangout)
    db.commit()

    return {"message": "Hangout deleted successfully"}
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