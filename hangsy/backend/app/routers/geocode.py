from fastapi import APIRouter

from app.services.geocoding import geocode_suggestions


router = APIRouter(
    prefix="/geocode",
    tags=["Geocoding"]
)


# Public (no auth) and read-only — same trust level as any other search box.
# Free, no API key: Nominatim (OpenStreetMap) via geopy, same as
# services/geocoding.py's single-result geocode_address().
@router.get("/suggest")
def suggest_address(q: str):
    return geocode_suggestions(q)
