# Fallback only — the primary path is now a real OR-Tools + OSRM solve
# (see services/route_optimizer.py, wired in from routers/routes.py). This
# plain round-robin split kicks in only if that solve fails for any reason
# (missing coordinates, OSRM unreachable, no feasible solution), so routes
# never just break. See Obsidian: Route Optimization.md for the full
# decision history — this WAS the primary strategy before OR-Tools/OSRM
# were reintroduced.


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
