#decided to go with dividing up the work instead of route optimization because google / apple maps does that already when i export

import math
import copy

from ortools.init.python import init
from ortools.linear_solver import pywraplp

from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

