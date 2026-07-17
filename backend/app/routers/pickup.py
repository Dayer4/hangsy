from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.route import Route
from app.schemas.route import RouteCreate, RouteResponse


router = APIRouter(
    prefix="/pickups",
    tags=["pickups"]
)


@router.post("/", response_model=RouteResponse)
def create_pickup(
    pickup: RouteCreate,
    db: Session = Depends(get_db)
):
    new_pickup = Route(
        **pickup.model_dump()
    )

    db.add(new_pickup)
    db.commit()
    db.refresh(new_pickup)

    return new_pickup


@router.get("/", response_model=list[RouteResponse])
def get_pickups(
    db: Session = Depends(get_db)
):
    return db.query(Route).all()


@router.get("/{route_id}", response_model=RouteResponse)
def get_pickup(
    route_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Route).filter(
        Route.route_id == route_id
    ).first()