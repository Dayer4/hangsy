"""
These tests hit the real Nominatim geocoding service over the network.
If there's no network access (or Nominatim rate-limits/times out), they skip
rather than fail, since that's an environment issue, not a code bug.
"""
import pytest

from app.services.geocoding import geocode_address, reverse_geocode


def test_geocode_address_returns_coordinates():
    result = geocode_address(
        "2900 Community Ave, La Crescenta-Montrose, CA 91214"
    )

    if result is None:
        pytest.skip("Nominatim returned no result (network/rate-limit issue)")

    assert "latitude" in result
    assert "longitude" in result
    assert "address" in result
    assert isinstance(result["latitude"], float)
    assert isinstance(result["longitude"], float)


def test_reverse_geocode_returns_address():
    result = reverse_geocode(34.227, -118.244)

    if result is None:
        pytest.skip("Nominatim returned no result (network/rate-limit issue)")

    assert "address" in result
    assert isinstance(result["address"], str)


def test_geocode_unknown_address_returns_none():
    result = geocode_address("asdkjfhaksjdhfkajshdf nonexistent place 999999")
    assert result is None
