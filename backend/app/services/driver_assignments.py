# Decision (see Obsidian: Route Optimization.md / Versions.md): no custom route
# optimization. Drivers just get an even split of pickups; Google/Apple Maps
# handles turn-by-turn navigation on export (see services/export.py).


def split_pickups_by_driver(pickups, drivers):
    """
    Evenly divide pickups across drivers, round-robin style.

    pickups: list of Pickup rows (or anything with a .pickup_id)
    drivers: list of Driver rows (or anything with a .driver_id)

    Returns: dict of {driver_id: [pickup_id, ...]}, preserving pickup order
    within each driver's list (order becomes that driver's Route.pickup_ids).
    """
    if not drivers:
        return {}

    assignments = {driver.driver_id: [] for driver in drivers}
    driver_ids = list(assignments.keys())

    for index, pickup in enumerate(pickups):
        driver_id = driver_ids[index % len(driver_ids)]
        assignments[driver_id].append(pickup.pickup_id)

    return assignments
