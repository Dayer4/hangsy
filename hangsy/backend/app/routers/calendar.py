import os
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.utils.security import create_access_token, decode_access_token


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
REDIRECT_URI = f"{BACKEND_URL}/calendar/callback"

router = APIRouter(
    prefix="/calendar",
    tags=["Calendar"]
)


@router.get("/status")
def calendar_status(current_user: User = Depends(get_current_user)):
    return {"connected": current_user.google_calendar_refresh_token is not None}


@router.get("/connect")
def calendar_connect(current_user: User = Depends(get_current_user)):
    """Returns the Google consent URL to redirect the browser to \u2014 doesn't
    redirect itself, since this call carries our Authorization header and a
    real browser navigation can't. The frontend fetches this, then does
    `window.location.href = url` as a second, separate step.

    `state` carries a short-lived token identifying the user, since by the
    time Google redirects back to /calendar/callback, there's no Authorization
    header to read anymore \u2014 the browser just followed a link.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google Calendar isn't configured (set GOOGLE_CLIENT_SECRET in .env "
                   "\u2014 GOOGLE_CLIENT_ID is likely already set from Sign-In)"
        )

    state = create_access_token(current_user.user_id)

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar.readonly",
        "access_type": "offline",   # required to get a refresh_token back
        "prompt": "consent",        # forces a refresh_token even on repeat connects
        "state": state,
    }
    query = urlencode(params)
    return {"url": f"https://accounts.google.com/o/oauth2/v2/auth?{query}"}


@router.get("/callback")
def calendar_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Google redirects here after the user approves (or denies) access.
    Not auth-guarded via the normal dependency \u2014 there's no Authorization
    header on a browser redirect \u2014 `state` is how we know who this is for.
    """
    user_id = decode_access_token(state)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired state")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token_response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=10.0,
    )
    token_response.raise_for_status()
    tokens = token_response.json()

    refresh_token = tokens.get("refresh_token")
    if refresh_token:
        # Google only sends a refresh_token the *first* time a user consents
        # (or when prompt=consent forces it, as above) — don't overwrite a
        # previously-stored one with nothing if this call somehow lacks it.
        user.google_calendar_refresh_token = refresh_token
        db.commit()

    return RedirectResponse(f"{FRONTEND_URL}/calendar?connected=1")


def _get_access_token(refresh_token: str) -> str:
    response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "refresh_token": refresh_token,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "grant_type": "refresh_token",
        },
        timeout=10.0,
    )
    response.raise_for_status()
    return response.json()["access_token"]


@router.get("/events")
def get_calendar_events(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
):
    """Read-only events from the user's primary Google Calendar for the given
    month, so CalendarPage can show them alongside hangsy's own hangouts."""
    if not current_user.google_calendar_refresh_token:
        raise HTTPException(status_code=404, detail="Google Calendar not connected")

    access_token = _get_access_token(current_user.google_calendar_refresh_token)

    time_min = datetime(year, month, 1, tzinfo=timezone.utc)
    next_month = month + 1 if month < 12 else 1
    next_year = year if month < 12 else year + 1
    time_max = datetime(next_year, next_month, 1, tzinfo=timezone.utc)

    response = httpx.get(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        headers={"Authorization": f"Bearer {access_token}"},
        params={
            "timeMin": time_min.isoformat(),
            "timeMax": time_max.isoformat(),
            "singleEvents": "true",
            "orderBy": "startTime",
        },
        timeout=10.0,
    )
    response.raise_for_status()
    items = response.json().get("items", [])

    return [
        {
            "summary": e.get("summary", "(no title)"),
            # All-day events use "date"; timed events use "dateTime".
            "start": e.get("start", {}).get("date") or e.get("start", {}).get("dateTime"),
        }
        for e in items
    ]


@router.post("/disconnect")
def disconnect_calendar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.google_calendar_refresh_token = None
    db.commit()
    return {"message": "Google Calendar disconnected"}
