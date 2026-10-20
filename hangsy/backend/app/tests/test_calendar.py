import os

import pytest


def test_status_when_not_connected(client, auth_headers):
    response = client.get("/calendar/status", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"connected": False}


def test_status_requires_auth(client):
    response = client.get("/calendar/status")
    assert response.status_code == 401


def test_events_404_when_not_connected(client, auth_headers):
    response = client.get("/calendar/events?year=2026&month=1", headers=auth_headers)
    assert response.status_code == 404


def test_connect_without_credentials_returns_500(client, auth_headers):
    if os.getenv("GOOGLE_CLIENT_SECRET"):
        pytest.skip("GOOGLE_CLIENT_SECRET is configured in this environment")

    response = client.get("/calendar/connect", headers=auth_headers)
    assert response.status_code == 500
