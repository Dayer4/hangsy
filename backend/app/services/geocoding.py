from geopy.geocoders import Nominatim
#geo coding is just translating addresses to coords or vice versa (reverse geo coding is coords to address)

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


def reverse_geocode(latitude: float, longitude: float):
    location = geolocator.reverse(
        (latitude, longitude)
    )

    if location is None:
        return None

    return {
        "address": location.address
    }