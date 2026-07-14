from urllib.parse import quote


def create_google_maps_export(start, pickups):

    locations = []

    # Add starting location via coords 
    locations.append(
        str(start["lat"]) + "," + str(start["lng"])
    )

    # Add pickups in order
    for pickup in pickups:
        locations.append(
            str(pickup.latitude) + "," + str(pickup.longitude)
        )

    route = "/".join(locations)

    return (
        "https://www.google.com/maps/dir/"
        + quote(route)
    )


def create_apple_maps_export(start, pickups):

    locations = []

    # Add starting location
    locations.append(
        str(start["lat"]) + "," + str(start["lng"])
    )

    # Add pickups in order
    for pickup in pickups:
        locations.append(
            str(pickup.latitude) + "," + str(pickup.longitude)
        )

    destination = locations[-1]

    return (
        "https://maps.apple.com/"
        + "?daddr="
        + destination
        + "&dirflg=d"
    )