from geopy.geocoders import Nominatim
#geo coding is just translating addresses to coords or vice versa (reverse geo coding is coords to address)
# coords are useful for calculating routes / optimization
geolocator = Nominatim(
    user_agent="hangsy"
)


def geocode_address(address: str):
    location = geolocator.geocode(address)

    if location is None:
        return None

    return {
        "latitude": location.latitude,
        "longitude": location.longitude,
        "address": location.address
    }


def geocode_suggestions(query: str, limit: int = 5):
    """Multiple candidate matches for a partial/ambiguous address, for an
    autocomplete dropdown — geocode_address() above only ever returns
    Nominatim's single best guess, which isn't enough to let someone pick
    the right one out of several similarly-named places."""
    if not query or len(query.strip()) < 3:
        return []

    locations = geolocator.geocode(
        query,
        exactly_one=False,
        limit=limit,
    )

    if not locations:
        return []

    return [
        {
            "label": location.address,
            "latitude": location.latitude,
            "longitude": location.longitude,
        }
        for location in locations
    ]


def reverse_geocode(latitude: float, longitude: float):
    location = geolocator.reverse(
        (latitude, longitude)
    )

    if location is None:
        return None

    return {
        "address": location.address
    }