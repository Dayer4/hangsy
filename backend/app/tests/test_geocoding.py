from app.services.geocoding import geocode_address, reverse_geocode


# Test address -> coordinates
geocode_address(
    "2900 Community Ave, La Crescenta-Montrose, CA 91214"
)

print(result)


# Test coordinates -> address
reverse_result = reverse_geocode(
    34.227,
    -118.244
)

print(reverse_result)