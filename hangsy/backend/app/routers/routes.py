from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.route import Route
from app.models.pickup import Pickup
from app.models.driver import Driver
from app.models.hangout import Hangout
from app.models.user import User
from app.schemas.route import RouteCreate, RouteResponse
from app.services.driver_assignments import split_pickups_by_driver
from app.services.route_optimizer import solve_routes
from app.services.export import create_google_maps_export, create_apple_maps_export
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


def _available_drivers(hangout: Hangout, db: Session) -> list[Driver]:
    """The vehicle pool for a hangout's route solve: the creator's saved
    vehicle, plus a saved vehicle from anyone else genuinely IN this hangout
    (hangout_ids contains it).

    Honest limitation worth knowing: there's currently no "join a hangout"
    flow — nothing ever adds a hangout_id to anyone's hangout_ids except the
    creator's own, at creation (see routers/hangouts.py's create_hangout).
    So in practice, today, this almost always resolves to exactly one
    driver: the creator's. That's still a real, useful problem for OR-Tools
    to solve (best stop order for one vehicle is a Traveling Salesman
    Problem, which is what a 1-vehicle CVRP reduces to) — it just isn't
    exercising the *multi*-driver dimension until a join/invite feature
    exists to make hangout_ids reflect more than the creator. This function
    is written to already do the right thing once that's built, rather than
    hardcoding "just the creator" — nothing here needs to change later.
    """
    member_ids = {hangout.creator_id}
    members = db.query(User).filter(User.hangout_ids.any(hangout.hangout_id)).all()
    member_ids.update(u.user_id for u in members)

    return db.query(Driver).filter(Driver.user_id.in_(member_ids)).all()


def _solve_assignments(hangout: Hangout, pickups: list[Pickup], drivers: list[Driver]) -> dict[int, list[int]]:
    """Tries the real OR-Tools + OSRM solve; falls back to the plain
    round-robin split (services/driver_assignments.py) on ANY failure —
    missing coordinates, no feasible solution, OSRM down, an unexpected
    OR-Tools error — so assigning routes never just breaks. The fallback is
    a worse ROUTE, never a missing one.
    """
    try:
        coordinates = [(hangout.hangout_location_lat, hangout.hangout_location_lng)] + [
            (p.location_lat, p.location_lng) for p in pickups
        ]
        # Every coordinate has to be real for the solver to mean anything —
        # a (0, 0) or missing lat/lng would silently route through the
        # Atlantic Ocean rather than fail loudly.
        if not all(lat and lng for lat, lng in coordinates):
            raise ValueError("missing coordinates")

        capacities = [driver.capacity or 1 for driver in drivers]

        solved = solve_routes(coordinates, capacities)
        if solved is None:
            raise ValueError("no feasible solution")

        return {
            drivers[vehicle_index].driver_id: [pickups[node - 1].pickup_id for node in stops]
            for vehicle_index, stops in enumerate(solved)
            if stops
        }
    except Exception as e:
        print(f"Route solve failed, falling back to round-robin split: {e}")
        return split_pickups_by_driver(pickups, drivers)


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


# Solve (or re-solve) a hangout's routes from scratch: which of its
# available drivers takes which pickups, in what order.
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
        raise HTTPException(status_code=400, detail="Hangout has no pickups to assign — add a store first")

    drivers = _available_drivers(hangout, db)
    if not drivers:
        raise HTTPException(
            status_code=400,
            detail="No one in this hangout has a saved vehicle yet — add one in Settings"
        )

    assignments = _solve_assignments(hangout, pickups, drivers)

    # "Assign" means "recompute from scratch" — without clearing old routes
    # first, re-running this after adding a store would just pile up a
    # second, conflicting set of Route rows alongside the first.
    db.query(Route).filter(Route.hangout_id == hangout_id).delete()

    # Every pickup starts this solve unassigned; only ones the solver
    # actually placed on a route get a driver_id below. This clears out
    # whatever an earlier solve left behind, so a pickup dropped this time
    # (e.g. total capacity shrank) doesn't keep showing a stale driver.
    for pickup in pickups:
        pickup.driver_id = None

    new_routes = []
    for driver_id, pickup_ids in assignments.items():
        if not pickup_ids:
            continue

        for pickup_id in pickup_ids:
            next(p for p in pickups if p.pickup_id == pickup_id).driver_id = driver_id

        first_pickup = next(p for p in pickups if p.pickup_id == pickup_ids[0])
        new_route = Route(
            hangout_id=hangout_id,
            pickup_ids=pickup_ids,
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


# Every route for a hangout, across all its drivers — what the route map
# renders. (The older /hangout/{hangout_id}/{driver_id} below needs a
# specific driver up front, which the map doesn't necessarily know yet.)
@router.get("/by-hangout/{hangout_id}", response_model=list[RouteResponse])
def get_routes_for_hangout(
    hangout_id: int,
    db: Session = Depends(get_db)
):
    return db.query(Route).filter(Route.hangout_id == hangout_id).all()


# Links that open ONE driver's route in Google Maps / Apple Maps — the
# hand-off from "Hangsy decided the stop order" to "the phone does the
# turn-by-turn". Stops come out in the order stored in route.pickup_ids
# (array position = stop order), then the hangout is the final destination.
@router.get("/{route_id}/export")
def export_route(
    route_id: int,
    db: Session = Depends(get_db)
):
    route = db.query(Route).filter(Route.route_id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route stop not found")

    hangout = db.query(Hangout).filter(Hangout.hangout_id == route.hangout_id).first()
    if not hangout:
        raise HTTPException(status_code=404, detail="Hangout not found")

    pickups_by_id = {
        p.pickup_id: p
        for p in db.query(Pickup).filter(Pickup.pickup_id.in_(route.pickup_ids)).all()
    }
    # Rebuild in stored order; an id whose pickup was since deleted (see
    # delete_store) just drops out, same as RouteMapPage.jsx does.
    stops = [pickups_by_id[pid] for pid in route.pickup_ids if pid in pickups_by_id]
    if not stops:
        raise HTTPException(status_code=400, detail="This route has no stops left to export")

    destination = {
        "lat": hangout.hangout_location_lat,
        "lng": hangout.hangout_location_lng,
    }

    return {
        "google_maps_url": create_google_maps_export(destination, stops),
        "apple_maps_url": create_apple_maps_export(destination, stops),
    }


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
