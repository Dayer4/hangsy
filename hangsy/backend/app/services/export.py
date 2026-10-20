from urllib.parse import urlencode

# Hangsy decides WHICH stops a driver visits and in WHAT ORDER (see
# services/route_optimizer.py). These helpers hand that finished plan to
# Google/Apple Maps, which do the actual turn-by-turn navigation.
#
# Shape of every export: the driver starts wherever they currently are (we
# deliberately send NO origin, so the Maps app uses their live location —
# there's no per-driver home address in Hangsy yet), visits `stops` in the
# order given, and ends at `destination` (the hangout itself).
#
# `destination` is a dict {"lat": ..., "lng": ...}; `stops` is an ordered
# list of anything with .location_lat / .location_lng (Pickup rows).


def _coord(lat, lng) -> str:
    return f"{lat},{lng}"


def create_google_maps_export(destination, stops):
    """Google Maps "Maps URLs" format (api=1). Intermediate stops go in
    `waypoints`, separated by "|". Google caps how many waypoints one link
    may hold (roughly nine at last check — see their Maps URLs docs); a
    hangout's handful of stores sits well under that."""
    params = {
        "api": 1,
        "destination": _coord(destination["lat"], destination["lng"]),
        "travelmode": "driving",
    }
    if stops:
        params["waypoints"] = "|".join(_coord(s.location_lat, s.location_lng) for s in stops)

    return "https://www.google.com/maps/dir/?" + urlencode(params)


def create_apple_maps_export(destination, stops):
    """Apple Maps multi-stop link: one repeated `daddr` per stop, in visiting
    order, with the final `daddr` being the real destination.

    Caveat worth knowing: Apple's published Map Links docs only describe a
    single daddr. Repeating daddr for multi-stop routes is how developers
    report it working on iOS 16+, but it's undocumented, so test the link on
    an actual iPhone before relying on it. Google's format above IS official.
    """
    params = [("dirflg", "d")]
    for s in stops:
        params.append(("daddr", _coord(s.location_lat, s.location_lng)))
    params.append(("daddr", _coord(destination["lat"], destination["lng"])))

    return "https://maps.apple.com/?" + urlencode(params)
