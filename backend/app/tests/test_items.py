import os

import pytest


def _make_hangout(client, auth_headers):
    store_owner_hangout = client.post("/hangouts/", json={
        "hangout_name": "Items Test Hangout",
        "hangout_location_lat": 34.0,
        "hangout_location_lng": -118.0,
        "hangout_date": 20260101,
        "creation_date": 20260101,
        "attendees": "Alice",
        "creator_id": 0,  # ignored server-side — creator is taken from the auth token
    }, headers=auth_headers).json()

    return store_owner_hangout["hangout_id"]


def _make_store(client, hangout_id, auth_headers):
    response = client.post("/stores/", json={
        "hangout_id": hangout_id,
        "store_name": "Trader Joe's",
        "location_lat": 34.01,
        "location_lng": -118.01,
        "assigned_person_names": ["Alice"],
        "items_to_buy": ["chips"],
    }, headers=auth_headers)
    assert response.status_code == 200
    return response.json()["store_id"]


def test_create_item_computes_total_cost(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    store_id = _make_store(client, hangout_id, auth_headers)

    response = client.post("/items/", json={
        "hangout_id": hangout_id,
        "store_id": store_id,
        "buyer_name": "Alice",
        "quantity": 3,
        "item_name": "Chips",
        "cost_per_unit": 2.5,
    }, headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_item_cost"] == 7.5


def test_create_item_requires_auth(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    store_id = _make_store(client, hangout_id, auth_headers)

    response = client.post("/items/", json={
        "hangout_id": hangout_id,
        "store_id": store_id,
        "buyer_name": "Alice",
        "quantity": 1,
        "item_name": "Chips",
        "cost_per_unit": 2.5,
    })

    assert response.status_code == 401


def test_get_items_filters_by_hangout(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    other_hangout_id = _make_hangout(client, auth_headers)
    store_id = _make_store(client, hangout_id, auth_headers)

    client.post("/items/", json={
        "hangout_id": hangout_id,
        "store_id": store_id,
        "buyer_name": "Alice",
        "quantity": 1,
        "item_name": "Chips",
        "cost_per_unit": 2.5,
    }, headers=auth_headers)

    same_hangout = client.get(f"/items/?hangout_id={hangout_id}")
    assert same_hangout.status_code == 200
    assert len(same_hangout.json()) == 1

    other = client.get(f"/items/?hangout_id={other_hangout_id}")
    assert other.status_code == 200
    assert len(other.json()) == 0


def test_update_item_recomputes_total_cost(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    store_id = _make_store(client, hangout_id, auth_headers)

    created = client.post("/items/", json={
        "hangout_id": hangout_id,
        "store_id": store_id,
        "buyer_name": "Alice",
        "quantity": 2,
        "item_name": "Chips",
        "cost_per_unit": 2.0,
    }, headers=auth_headers).json()

    response = client.patch(f"/items/{created['item_id']}", json={
        "quantity": 4,
        "bought": True,
    }, headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["quantity"] == 4
    assert body["bought"] is True
    assert body["total_item_cost"] == 8.0  # 4 * cost_per_unit (2.0), recomputed


def test_suggest_without_kroger_credentials_returns_501(client):
    if os.getenv("KROGER_CLIENT_ID"):
        pytest.skip("Kroger credentials are configured in this environment — this test only applies without them")

    response = client.get("/items/suggest?q=milk")
    assert response.status_code == 501
