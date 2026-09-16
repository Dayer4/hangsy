def test_get_my_driver_404_when_none_saved(client, auth_headers):
    response = client.get("/drivers/me", headers=auth_headers)
    assert response.status_code == 404


def test_save_and_fetch_my_driver(client, auth_headers):
    save_response = client.put("/drivers/me", json={
        "driver_name": "Mom's Honda CR-V",
        "capacity": 4,
        "license_plate": "ABC123",
        "notes": "No trunk space for coolers",
    }, headers=auth_headers)
    assert save_response.status_code == 200
    assert save_response.json()["driver_name"] == "Mom's Honda CR-V"

    get_response = client.get("/drivers/me", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["capacity"] == 4


def test_saving_again_updates_rather_than_duplicates(client, auth_headers):
    client.put("/drivers/me", json={
        "driver_name": "First Car",
        "capacity": 4,
    }, headers=auth_headers)

    client.put("/drivers/me", json={
        "driver_name": "Second Car",
        "capacity": 5,
    }, headers=auth_headers)

    response = client.get("/drivers/me", headers=auth_headers)
    assert response.json()["driver_name"] == "Second Car"

    all_drivers = client.get("/drivers/").json()
    matching = [d for d in all_drivers if d["driver_name"] == "Second Car"]
    assert len(matching) == 1


def test_my_driver_requires_auth(client):
    response = client.get("/drivers/me")
    assert response.status_code == 401
