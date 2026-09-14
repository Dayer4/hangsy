def _make_hangout(client):
    user = client.post("/users/", json={
        "username": "testuser_routes",
        "email": "routes@test.com",
        "full_name": "Test User",
        "password": "password123",
    }).json()

    hangout = client.post("/hangouts/", json={
        "hangout_name": "Route Test Hangout",
        "hangout_location_lat": 34.0,
        "hangout_location_lng": -118.0,
        "hangout_date": 20260101,
        "creation_date": 20260101,
        "attendees": "Alice",
        "creator_id": user["user_id"],
    }).json()

    return hangout["hangout_id"]


def _make_pickup(client, hangout_id, name="Alice's place"):
    response = client.post("/pickups/", json={
        "hangout_id": hangout_id,
        "pickup_name": name,
        "location_lat": 34.05,
        "location_lng": -118.05,
    })
    assert response.status_code == 200
    return response.json()["pickup_id"]


def test_create_route_success(client):
    hangout_id = _make_hangout(client)
    pickup_id = _make_pickup(client, hangout_id)

    response = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    })

    assert response.status_code == 200
    body = response.json()
    assert body["pickup_ids"] == [pickup_id]
    assert "route_id" in body


def test_create_route_rejects_unknown_pickup_id(client):
    hangout_id = _make_hangout(client)

    response = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [999999],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    })

    assert response.status_code == 400
    assert "999999" in response.json()["detail"]


def test_get_route_and_404(client):
    hangout_id = _make_hangout(client)
    pickup_id = _make_pickup(client, hangout_id)

    created = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }).json()

    ok = client.get(f"/routes/{created['route_id']}")
    assert ok.status_code == 200

    missing = client.get("/routes/999999")
    assert missing.status_code == 404


def test_update_route_rejects_unknown_pickup_id(client):
    hangout_id = _make_hangout(client)
    pickup_id = _make_pickup(client, hangout_id)

    created = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }).json()

    response = client.patch(f"/routes/{created['route_id']}", json={
        "hangout_id": hangout_id,
        "pickup_ids": [999999],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    })

    assert response.status_code == 400


def test_delete_route(client):
    hangout_id = _make_hangout(client)
    pickup_id = _make_pickup(client, hangout_id)

    created = client.post("/routes/", json={
        "hangout_id": hangout_id,
        "pickup_ids": [pickup_id],
        "pickup_order": 0,
        "location_lat": 34.05,
        "location_lng": -118.05,
    }).json()

    delete_response = client.delete(f"/routes/{created['route_id']}")
    assert delete_response.status_code == 200

    follow_up = client.get(f"/routes/{created['route_id']}")
    assert follow_up.status_code == 404


def test_assign_routes_splits_pickups_across_drivers(client, db_session):
    from app.models.driver import Driver

    hangout_id = _make_hangout(client)

    driver_a = Driver(driver_name="Driver A", capacity=4)
    driver_b = Driver(driver_name="Driver B", capacity=4)
    db_session.add_all([driver_a, driver_b])
    db_session.commit()
    db_session.refresh(driver_a)
    db_session.refresh(driver_b)

    pickup_ids = []
    for i in range(4):
        response = client.post("/pickups/", json={
            "hangout_id": hangout_id,
            "pickup_name": f"Stop {i}",
            "location_lat": 34.0 + i * 0.01,
            "location_lng": -118.0 - i * 0.01,
            "driver_id": driver_a.driver_id if i % 2 == 0 else driver_b.driver_id,
        })
        assert response.status_code == 200
        pickup_ids.append(response.json()["pickup_id"])

    response = client.post(f"/routes/assign/{hangout_id}")
    assert response.status_code == 200
    routes = response.json()

    assert len(routes) == 2
    all_assigned_pickups = sorted(sum((r["pickup_ids"] for r in routes), []))
    assert all_assigned_pickups == sorted(pickup_ids)
