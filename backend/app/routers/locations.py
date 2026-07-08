from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.route import Route
from app.schemas.route import RouteCreate, RouteResponse


router = APIRouter(
    prefix="/locations",
    tags=["Locations"]
)


@router.post("/", response_model=RouteResponse)
def create_location(
    location: RouteCreate,
    db: Session = Depends(get_db)
):
    new_location = Route(
        **location.model_dump()
    )

    db.add(new_location)
    db.commit()
    db.refresh(new_location)

    return new_location


@router.get("/", response_model=list[RouteResponse])
def get_locations(
    db: Session = Depends(get_db)
):
    return db.query(Route).all()


@router.get("/{route_id}", response_model=RouteResponse)
def get_location(
    route_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Route).filter(
        Route.route_id == route_id
    ).first()