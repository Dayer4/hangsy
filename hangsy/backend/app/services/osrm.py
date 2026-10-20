import os
import httpx

# The public demo server is explicitly for light testing, not production
# traffic — no SLA, rate-limited, can go down without notice (see the OSRM
# project's own usage policy: https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy).
# It's free and needs zero setup, so it's the default; self-host for
# anything real (see the setup notes in Obsidian: Tech Stack.md).
OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")


def get_distance_matrix(coordinates: list[tuple[float, float]]):
    """coordinates: list of (lat, lng) — index order is preserved in the
    result. Returns {"distances": [[meters,...],...], "durations": [[seconds,...],...]}
    (both NxN), or None if OSRM couldn't be reached/didn't return a usable
    result. Callers should treat None as "fall back to something simpler"
    (see services/route_optimizer.py's Haversine fallback), not as an error
    to surface — OSRM being unreachable shouldn't block assigning routes.
    """
    if len(coordinates) < 2:
        return None

    # OSRM wants "lon,lat" pairs, semicolon-separated — the REVERSE of how
    # this codebase stores/reads coordinates everywhere else (lat, lng, see
    # every model in app/models/). Getting this backwards doesn't error; it
    # silently produces nonsense distances for coordinates that happen to
    # land somewhere else on Earth, which is a much worse bug to chase down
    # than a crash — hence this comment.
    coord_str = ";".join(f"{lng},{lat}" for lat, lng in coordinates)
    url = f"{OSRM_BASE_URL}/table/v1/driving/{coord_str}"

    try:
        response = httpx.get(url, params={"annotations": "distance,duration"}, timeout=10)
        response.raise_for_status()
        data = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    if data.get("code") != "Ok" or not data.get("distances") or not data.get("durations"):
        return None

    return {
        "distances": data["distances"],
        "durations": data["durations"],
    }
