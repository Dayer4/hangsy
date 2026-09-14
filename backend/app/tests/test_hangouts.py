def _make_user(client):
    response = client.post("/users/", json={
        "username": "testuser_hangouts",
        "email": "hangouts@test.com",
        "full_name": "Test User",
        "password": "password123",
    })
    assert response.status_code == 200
    return response.json()["user_id"]


def test_create_hangout(client):
    creator_id = _make_user(client)

    response = client.post("/hangouts/", json={
        "hangout_name": "Lake House Weekend",
        "hangout_location_lat": 34.0,
        "hangout_location_lng": -118.0,
        "hangout_date": 20260101,
        "creation_date": 20260101,
        "hangout_description": "A weekend at the lake",
        "attendees": "Alice, Bob",
        "creator_id": creator_id,
    })

    assert response.status_code == 200
    body = response.json()
    assert body["hangout_name"] == "Lake House Weekend"
    assert "hangout_id" in body
    # `stores` was a dead column and should not appear in the response at all
    assert "stores" not in body


def test_get_hangout_by_id_and_404(client):
    creator_id = _make_user(client)

    created = client.post("/hangouts/", json={
        "hangout_name": "Game Night",
        "hangout_location_lat": 34.1,
        "hangout_location_lng": -118.1,
        "hangout_date": 20260102,
        "creation_date": 20260101,
        "attendees": "Carol",
        "creator_id": creator_id,
    }).json()

    ok = client.get(f"/hangouts/{created['hangout_id']}")
    assert ok.status_code == 200
    assert ok.json()["hangout_id"] == created["hangout_id"]

    missing = client.get("/hangouts/999999")
    assert missing.status_code == 404


def test_list_hangouts(client):
    creator_id = _make_user(client)
    client.post("/hangouts/", json={
        "hangout_name": "Beach Cleanup",
        "hangout_location_lat": 34.2,
        "hangout_location_lng": -118.2,
        "hangout_date": 20260103,
        "creation_date": 20260101,
        "attendees": "Dave",
        "creator_id": creator_id,
    })

    response = client.get("/hangouts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1


def test_delete_hangout(client):
    creator_id = _make_user(client)
    created = client.post("/hangouts/", json={
        "hangout_name": "To Delete",
        "hangout_location_lat": 34.3,
        "hangout_location_lng": -118.3,
        "hangout_date": 20260104,
        "creation_date": 20260101,
        "attendees": "Eve",
        "creator_id": creator_id,
    }).json()

    delete_response = client.delete(f"/hangouts/{created['hangout_id']}")
    assert delete_response.status_code == 200

    follow_up = client.get(f"/hangouts/{created['hangout_id']}")
    assert follow_up.status_code == 404
