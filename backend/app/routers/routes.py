from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.route import Route
from app.schemas.route import RouteCreate, RouteResponse


router = APIRouter(
    prefix="/routes",
    tags=["Routes"]
)


# Create a route stop
@router.post("/", response_model=RouteResponse)
def create_route(
    route: RouteCreate,
    db: Session = Depends(get_db)
):
    new_route = Route(
        **route.model_dump()
    )

    db.add(new_route)
    db.commit()
    db.refresh(new_route)

    return new_route


# Get all route stops
@router.get("/", response_model=list[RouteResponse])
def get_routes(
    db: Session = Depends(get_db)
):
    return db.query(Route).all()


# Get a specific route stop
@router.get("/{route_id}", response_model=RouteResponse)
def get_route(
    route_id: int,
    db: Session = Depends(get_db)
):
    route = db.query(Route).filter(
        Route.route_id == route_id
    ).first()

    if not route:
        raise HTTPException(
            status_code=404,
            detail="Route stop not found"
        )

    return route


# Get all route stops for a specific hangout
@router.get("/hangout/{hangout_id}", response_model=list[RouteResponse])
def get_hangout_routes(
    hangout_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Route).filter(
        Route.hangout_id == hangout_id
    ).order_by(
        Route.stop_order
    ).all()


# Update a route stop
@router.patch("/{route_id}", response_model=RouteResponse)
def update_route(
    route_id: int,
    route_update: RouteCreate,
    db: Session = Depends(get_db)
):
    route = db.query(Route).filter(
        Route.route_id == route_id
    ).first()

    if not route:
        raise HTTPException(
            status_code=404,
            detail="Route stop not found"
        )

    for key, value in route_update.model_dump().items():
        setattr(route, key, value)

    db.commit()
    db.refresh(route)

    return route


# Delete a route stop
@router.delete("/{route_id}")
def delete_route(
    route_id: int,
    db: Session = Depends(get_db)
):
    route = db.query(Route).filter(
        Route.route_id == route_id
    ).first()

    if not route:
        raise HTTPException(
            status_code=404,
            detail="Route stop not found"
        )

    db.delete(route)
    db.commit()

    return {
        "message": "Route stop deleted"
    }