def _make_hangout(client, auth_headers):
    hangout = client.post("/hangouts/", json={
        "hangout_name": "Route Test Hangout",
        "hangout_location_lat": 34.0,
        "hangout_location_lng": -118.0,
        "hangout_date": 20260101,
        "creation_date": 20260101,
        "attendees": "Alice",
        "creator_id": 0,  # ignored server-side — creator is taken from the auth token
    }, headers=auth_headers).json()

    return hangout["hangout_id"]


def _make_pickup(client, hangout_id, auth_headers, name="Alice's place", lat=34.05, lng=-118.05):
    response = client.post("/pickups/", json={
        "hangout_id": hangout_id,
        "pickup_name": name,
        "location_lat": lat,
        "location_lng": lng,
    }, headers=auth_headers)
    assert response.status_code == 200
    return response.json()["pickup_id"]


def test_create_route_success(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    pickup_id = _make_pickup(client, hangout_id, auth_headers)

    response = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }, headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["pickup_ids"] == [pickup_id]
    assert "route_id" in body


def test_create_route_requires_auth(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    pickup_id = _make_pickup(client, hangout_id, auth_headers)

    response = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    })
    assert response.status_code == 401


def test_create_route_rejects_unknown_pickup_id(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)

    response = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [999999],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }, headers=auth_headers)

    assert response.status_code == 400
    assert "999999" in response.json()["detail"]


def test_get_route_and_404(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    pickup_id = _make_pickup(client, hangout_id, auth_headers)

    created = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }, headers=auth_headers).json()

    ok = client.get(f"/routes/{created['route_id']}")
    assert ok.status_code == 200

    missing = client.get("/routes/999999")
    assert missing.status_code == 404


def test_update_route_rejects_unknown_pickup_id(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    pickup_id = _make_pickup(client, hangout_id, auth_headers)

    created = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }, headers=auth_headers).json()

    response = client.patch(f"/routes/{created['route_id']}", json={
        "hangout_id": hangout_id,
        "pickup_ids": [999999],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }, headers=auth_headers)

    assert response.status_code == 400


def test_delete_route(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)
    pickup_id = _make_pickup(client, hangout_id, auth_headers)

    created = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }, headers=auth_headers).json()

    delete_response = client.delete(f"/routes/{created['route_id']}", headers=auth_headers)
    assert delete_response.status_code == 200

    follow_up = client.get(f"/routes/{created['route_id']}")
    assert follow_up.status_code == 404


def test_assign_routes_splits_pickups_across_drivers(client, db_session, auth_headers, monkeypatch):
    from app.models.driver import Driver
    from app.models.user import User
    from app.utils.security import get_password_hash

    # Skip the live OSRM call: returning None makes solve_routes use its
    # straight-line (Haversine) fallback, so this test needs no network.
    monkeypatch.setattr("app.services.route_optimizer.get_distance_matrix", lambda coords: None)

    hangout_id = _make_hangout(client, auth_headers)

    # _available_drivers() only counts saved vehicles belonging to people
    # IN the hangout: the creator (the auth user) plus anyone whose
    # hangout_ids contains it. So each driver needs a user.
    creator = db_session.query(User).filter(User.username == "testuser_auth").first()
    second_user = User(
        username="testuser_second",
        email="second@test.com",
        full_name="Second Driver",
        password=get_password_hash("password123"),
        is_verified=True,
        hangout_ids=[hangout_id],
    )
    db_session.add(second_user)
    db_session.commit()
    db_session.refresh(second_user)

    # Capacity 2 + 2 for 4 stops forces the solver to use BOTH vehicles
    # (with bigger cars it could legitimately put everything in one).
    db_session.add_all([
        Driver(driver_name="Driver A", capacity=2, user_id=creator.user_id),
        Driver(driver_name="Driver B", capacity=2, user_id=second_user.user_id),
    ])
    db_session.commit()

    pickup_ids = [
        _make_pickup(client, hangout_id, auth_headers, name=f"Stop {i}",
                     lat=34.0 + i * 0.01, lng=-118.0 - i * 0.01)
        for i in range(4)
    ]

    response = client.post(f"/routes/assign/{hangout_id}", headers=auth_headers)
    assert response.status_code == 200
    routes = response.json()

    assert len(routes) == 2
    assert all(len(r["pickup_ids"]) <= 2 for r in routes)
    all_assigned_pickups = sorted(sum((r["pickup_ids"] for r in routes), []))
    assert all_assigned_pickups == sorted(pickup_ids)


def test_export_route_returns_ordered_map_links(client, auth_headers):
    hangout_id = _make_hangout(client, auth_headers)  # hangout is at 34.0, -118.0
    first = _make_pickup(client, hangout_id, auth_headers, name="First", lat=34.1, lng=-118.1)
    second = _make_pickup(client, hangout_id, auth_headers, name="Second", lat=34.2, lng=-118.2)

    # Stored order is [second, first] — the export must follow THAT order,
    # not pickup id order.
    route = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [second, first],
        "pickup_order": 0,
        "location_lat": 34.2,
        "location_lng": -118.2,
    }, headers=auth_headers).json()

    response = client.get(f"/routes/{route['route_id']}/export")
    assert response.status_code == 200
    body = response.json()

    google = body["google_maps_url"]
    assert google.startswith("https://www.google.com/maps/dir/?")
    assert "destination=34.0%2C-118.0" in google
    assert google.index("34.2%2C-118.2") < google.index("34.1%2C-118.1")

    apple = body["apple_maps_url"]
    assert apple.startswith("https://maps.apple.com/?")
    assert apple.index("34.2%2C-118.2") < apple.index("34.1%2C-118.1")
    assert apple.endswith("daddr=34.0%2C-118.0")  # hangout is the final stop


def test_export_route_404(client):
    response = client.get("/routes/999999/export")
    assert response.status_code == 404
