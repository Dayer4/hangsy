from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.pickup import Pickup
from app.schemas.pickup import PickupCreate, PickupResponse


router = APIRouter(
    prefix="/pickups",
    tags=["pickups"]
)


@router.post("/", response_model=PickupResponse)
def create_pickup(
    pickup: PickupCreate,
    db: Session = Depends(get_db)
):
    new_pickup = Pickup(
        **pickup.model_dump()
    )

    db.add(new_pickup)
    db.commit()
    db.refresh(new_pickup)

    return new_pickup


@router.get("/", response_model=list[PickupResponse])
def get_pickups(
    db: Session = Depends(get_db)
):
    return db.query(Pickup).all()


@router.get("/{pickup_id}", response_model=PickupResponse)
def get_pickup(
    pickup_id: int,
    db: Session = Depends(get_db)
):
    pickup = db.query(Pickup).filter(
        Pickup.pickup_id == pickup_id
    ).first()

    if not pickup:
        raise HTTPException(
            status_code=404,
            detail="Pickup not found"
        )

    return pickup


@router.delete("/{pickup_id}")
def delete_pickup(
    pickup_id: int,
    db: Session = Depends(get_db)
):
    pickup = db.query(Pickup).filter(
        Pickup.pickup_id == pickup_id
    ).first()

    if not pickup:
        raise HTTPException(
            status_code=404,
            detail="Pickup not found"
        )

    db.delete(pickup)
    db.commit()

    return {
        "message": "Pickup deleted"
    }
