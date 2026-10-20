def test_create_hangout(client, auth_headers):
    response = client.post("/hangouts/", json={
        "hangout_name": "Lake House Weekend",
        "hangout_location_lat": 34.0,
        "hangout_location_lng": -118.0,
        "hangout_date": 20260101,
        "creation_date": 20260101,
        "hangout_description": "A weekend at the lake",
        "attendees": "Alice, Bob",
        "creator_id": 0,  # ignored server-side — creator is taken from the auth token
    }, headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["hangout_name"] == "Lake House Weekend"
    assert "hangout_id" in body
    # `stores` was a dead column and should not appear in the response at all
    assert "stores" not in body


def test_create_hangout_requires_auth(client):
    response = client.post("/hangouts/", json={
        "hangout_name": "No Auth Hangout",
        "hangout_location_lat": 34.0,
        "hangout_location_lng": -118.0,
        "hangout_date": 20260101,
        "creation_date": 20260101,
        "attendees": "Alice",
        "creator_id": 0,
    })
    assert response.status_code == 401


def test_get_hangout_by_id_and_404(client, auth_headers):
    created = client.post("/hangouts/", json={
        "hangout_name": "Game Night",
        "hangout_location_lat": 34.1,
        "hangout_location_lng": -118.1,
        "hangout_date": 20260102,
        "creation_date": 20260101,
        "attendees": "Carol",
        "creator_id": 0,
    }, headers=auth_headers).json()

    ok = client.get(f"/hangouts/{created['hangout_id']}")
    assert ok.status_code == 200
    assert ok.json()["hangout_id"] == created["hangout_id"]

    missing = client.get("/hangouts/999999")
    assert missing.status_code == 404


def test_list_hangouts(client, auth_headers):
    client.post("/hangouts/", json={
        "hangout_name": "Beach Cleanup",
        "hangout_location_lat": 34.2,
        "hangout_location_lng": -118.2,
        "hangout_date": 20260103,
        "creation_date": 20260101,
        "attendees": "Dave",
        "creator_id": 0,
    }, headers=auth_headers)

    response = client.get("/hangouts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1


def test_hangout_appears_in_mine(client, auth_headers):
    created = client.post("/hangouts/", json={
        "hangout_name": "Mine Check",
        "hangout_location_lat": 34.2,
        "hangout_location_lng": -118.2,
        "hangout_date": 20260103,
        "creation_date": 20260101,
        "attendees": "Dave",
        "creator_id": 0,
    }, headers=auth_headers).json()

    mine = client.get("/hangouts/mine", headers=auth_headers)
    assert mine.status_code == 200
    assert any(h["hangout_id"] == created["hangout_id"] for h in mine.json())


def test_delete_hangout(client, auth_headers):
    created = client.post("/hangouts/", json={
        "hangout_name": "To Delete",
        "hangout_location_lat": 34.3,
        "hangout_location_lng": -118.3,
        "hangout_date": 20260104,
        "creation_date": 20260101,
        "attendees": "Eve",
        "creator_id": 0,
    }, headers=auth_headers).json()

    delete_response = client.delete(f"/hangouts/{created['hangout_id']}", headers=auth_headers)
    assert delete_response.status_code == 200

    follow_up = client.get(f"/hangouts/{created['hangout_id']}")
    assert follow_up.status_code == 404
