from geopy.distance import geodesic
from ortools.constraint_solver import routing_enums_pb2, pywrapcp

from app.services.osrm import get_distance_matrix


# How long the solver is allowed to search before returning its best answer
# so far. Hangout-sized problems (a handful of pickups) solve well within
# this; it's a ceiling, not a target.
DEFAULT_TIME_LIMIT_SECONDS = 5


def _haversine_matrix(coordinates: list[tuple[float, float]]):
    """Straight-line distance fallback for when OSRM can't be reached.
    Real road distance is always >= this, so routes solved on it are a
    reasonable approximation — just blind to actual roads, one-ways, and
    traffic, unlike the OSRM-backed matrix."""
    n = len(coordinates)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i][j] = int(geodesic(coordinates[i], coordinates[j]).meters)
    return matrix


def solve_routes(
    coordinates: list[tuple[float, float]],
    capacities: list[int],
    depot: int = 0,
    time_limit_seconds: int = DEFAULT_TIME_LIMIT_SECONDS,
):
    """Solves a Capacitated Vehicle Routing Problem: which pickups should
    each driver take, and in what order, to minimize total driving
    distance without exceeding any driver's capacity.

    coordinates: (lat, lng) pairs. Index `depot` is the shared start/end
    point for every vehicle — currently always the hangout's own location,
    since there's no per-driver home address yet (see Obsidian: Route
    Optimization.md for why, and what changes once one exists). Every other
    index is a pickup stop.

    capacities: one int per vehicle/driver — e.g. [4, 4] for two 4-seat
    cars. Matches Driver.capacity's existing meaning throughout the app:
    how many pickups that vehicle can take, not literal passenger weight.

    Returns a list (one entry per vehicle, same order as `capacities`) of
    coordinate indices in visiting order, with the depot excluded — or None
    if OR-Tools couldn't find any feasible solution at all (e.g. total
    pickups exceed total capacity across every driver).
    """
    osrm_result = get_distance_matrix(coordinates)
    if osrm_result:
        distance_matrix = [[int(round(v)) for v in row] for row in osrm_result["distances"]]
    else:
        distance_matrix = _haversine_matrix(coordinates)

    num_vehicles = len(capacities)
    num_locations = len(coordinates)

    # Depot carries no demand; every pickup counts as 1 "seat" — see the
    # capacities docstring above for why that's the right unit here.
    demands = [0] + [1] * (num_locations - 1)

    manager = pywrapcp.RoutingIndexManager(num_locations, num_vehicles, depot)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        return distance_matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def demand_callback(from_index):
        return demands[manager.IndexToNode(from_index)]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # no slack
        capacities,
        True,  # start cumul at 0 for every vehicle
        "Capacity",
    )

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.FromSeconds(time_limit_seconds)

    solution = routing.SolveWithParameters(search_parameters)
    if solution is None:
        return None

    routes = []
    for vehicle_id in range(num_vehicles):
        index = routing.Start(vehicle_id)
        stops = []
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node != depot:
                stops.append(node)
            index = solution.Value(routing.NextVar(index))
        routes.append(stops)

    return routes
