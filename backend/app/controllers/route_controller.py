# controllers/route_controller.py

from app.models.route import Route
from app.models.pickup import Pickup


def create_route(db, route_data, hangout_id): 
# the purpose of db as a parameter is creating a temporary connection (similar to how u make a temp objects)
# 
    pickup_order = route_data.pickup_ids

    # user is expected to add pickups then route stuff
    # this is to verify pickup ids
    pickups = (
        db.query(Pickup)
        .filter(Pickup.pickup_id.in_(pickup_order))
        .all()
    )

    if len(pickups) != len(pickup_order):
        raise Exception("One or more pickup IDs do not exist")


    route = Route(**route_data.dict(), hangout_id=hangout_id)

    db.add(route)
    db.commit()
    db.refresh(route)

    return route



def get_routes(
    db,
    hangout_id
):

    return (
        db.query(Route)
        .filter(Route.hangout_id == hangout_id)
        .all()
    )



def update_route(
    db,
    route_id,
    data
):

    route = (
        db.query(Route)
        .filter(Route.route_id == route_id)
        .first()
    )

    if not route:
        raise Exception("Route not found")


    # If pickup order changes, validate again
    if data.pickup_ids:

        pickups = (
            db.query(Pickup)
            .filter(Pickup.pickup_id.in_(data.pickup_ids))
            .all()
        )

        if len(pickups) != len(data.pickup_ids):
            raise Exception("Invalid pickup ID")


    for key, value in data.dict().items():
        setattr(
            route,
            key,
            value
        )


    db.commit()
    db.refresh(route)

    return route



def delete_route(
    db,
    route_id
):

    route = (
        db.query(Route)
        .filter(Route.route_id == route_id)
        .first()
    )

    if not route:
        raise Exception("Route not found")


    db.delete(route)
    db.commit()

    return route