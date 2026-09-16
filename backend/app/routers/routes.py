from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.route import Route
from app.models.pickup import Pickup
from app.models.driver import Driver
from app.models.hangout import Hangout
from app.schemas.route import RouteCreate, RouteResponse
from app.services.driver_assignments import split_pickups_by_driver
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/routes",
    tags=["Routes"]
)


def _validate_pickup_ids(pickup_ids: list[int], db: Session):
    """Raise 400 if any id in pickup_ids doesn't exist in the pickups table.

    pickup_ids is a plain ARRAY(Integer), not a real FK (a single FK column
    can't reference an ordered list of rows), so nothing at the DB level
    stops a bad id from being saved. This is the app-level check for that.
    See Obsidian: Bugs and Issues.md / To-Do.md item 4.
    """
    found_ids = {
        row.pickup_id for row in db.query(Pickup.pickup_id).filter(
            Pickup.pickup_id.in_(pickup_ids)
        ).all()
    }
    missing = set(pickup_ids) - found_ids
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"pickup_ids contains unknown pickup id(s): {sorted(missing)}"
        )


# Create a route stop
@router.post("/", response_model=RouteResponse)
def create_route(
    route: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_pickup_ids(route.pickup_ids, db)

    new_route = Route(
        **route.model_dump()
    )

    db.add(new_route)
    db.commit()
    db.refresh(new_route)

    return new_route


# Split a hangout's pickups evenly across its drivers and create one Route per driver
@router.post("/assign/{hangout_id}", response_model=list[RouteResponse])
def assign_routes(
    hangout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hangout = db.query(Hangout).filter(Hangout.hangout_id == hangout_id).first()
    if not hangout:
        raise HTTPException(status_code=404, detail="Hangout not found")

    pickups = db.query(Pickup).filter(Pickup.hangout_id == hangout_id).all()
    if not pickups:
        raise HTTPException(status_code=400, detail="Hangout has no pickups to assign")

    driver_ids = {p.driver_id for p in pickups if p.driver_id is not None}
    drivers = db.query(Driver).filter(Driver.driver_id.in_(driver_ids)).all()
    if not drivers:
        raise HTTPException(
            status_code=400,
            detail="No drivers assigned to this hangout's pickups yet"
        )

    assignments = split_pickups_by_driver(pickups, drivers)

    new_routes = []
    for driver_id, ids in assignments.items():
        if not ids:
            continue
        first_pickup = next(p for p in pickups if p.pickup_id == ids[0])
        new_route = Route(
            hangout_id=hangout_id,
            pickup_ids=ids,
            pickup_order=0,
            location_lat=first_pickup.location_lat,
            location_lng=first_pickup.location_lng,
            driver_id=driver_id
        )
        db.add(new_route)
        new_routes.append(new_route)

    db.commit()
    for r in new_routes:
        db.refresh(r)

    return new_routes

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


# Get all route stops for a specific hangout and specific driver
@router.get("/hangout/{hangout_id}/{driver_id}", response_model=list[RouteResponse])
def get_hangout_routes(
    hangout_id: int,
    driver_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Route).filter(
        Route.hangout_id == hangout_id,
        Route.driver_id == driver_id
    ).all()


# Update a route stop
@router.patch("/{route_id}", response_model=RouteResponse)
def update_route(
    route_id: int,
    route_update: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    route = db.query(Route).filter(
        Route.route_id == route_id
    ).first()

    if not route:
        raise HTTPException(
            status_code=404,
            detail="Route stop not found"
        )

    _validate_pickup_ids(route_update.pickup_ids, db)

    for key, value in route_update.model_dump().items():
        setattr(route, key, value)

    db.commit()
    db.refresh(route)

    return route


# Delete a route stop
@router.delete("/{route_id}")
def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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