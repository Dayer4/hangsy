# app/routers/hangouts.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.hangout import Hangout
from app.models.user import User
from app.schemas.hangout import HangoutCreate, HangoutResponse
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/hangouts",
    tags=["Hangouts"]
)


@router.get("/", response_model=list[HangoutResponse])
def get_hangouts(db: Session = Depends(get_db)):
    return db.query(Hangout).all()


# Hangouts the logged-in user actually belongs to (via User.hangout_ids),
# rather than every hangout in the database. This is what the dashboard uses.
@router.get("/mine", response_model=list[HangoutResponse])
def get_my_hangouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.hangout_ids:
        return []

    return db.query(Hangout).filter(
        Hangout.hangout_id.in_(current_user.hangout_ids)
    ).all()


@router.get("/{hangout_id}", response_model=HangoutResponse)
def get_hangout(hangout_id: int, db: Session = Depends(get_db)):
    hangout = db.query(Hangout).filter(
        Hangout.hangout_id == hangout_id
    ).first()

    if not hangout:
        raise HTTPException(
            status_code=404,
            detail="Hangout not found"
        )

    return hangout


@router.delete("/{hangout_id}")
def delete_hangout(
    hangout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = hangout.model_dump()
    # Trust the token, not whatever creator_id the client sent — otherwise
    # anyone could create a hangout "as" another user.
    data["creator_id"] = current_user.user_id

    new_hangout = Hangout(**data)

    db.add(new_hangout)
    db.commit()
    db.refresh(new_hangout)

    current_user.hangout_ids = [*(current_user.hangout_ids or []), new_hangout.hangout_id]
    db.commit()

    return new_hangout
