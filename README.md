# hangsy
the overal idea is to create an application that helps plan out hangouts / trips


file structure desc
backend (every computation the scenes + the stuff stored)

db is the connection between the API (FAST API) and acc database (postresql)

models represent how its stored and what is stored

routers r how backend and frontend communicates (via API end points [URLS] and HTTP requests: get, post, patch, delete) w/ services and controllers

schemas is what is sent / recieved 

controllers is how to respond to API requests and usually directly interacts w/ db

services is the "business logic" or complex operations that isnt just get or recieve data

utils is general helper and reusable functions

main = The starting point of your FastAPI application --> Creates the FastAPI app, connects routers, and starts the server.

init = tells python specifically that this folder is a package that can be imported

pycache = automatically generated folder that helps load stuff faster  *shouldnt be edited and should be ignored by git*

venv (virtual environment) = where stuff runs (seperate from computer)

.env = private info (passwords, api keys, secret keys, etc.)

requirements.txt = List of Python packages required to run the backend.
                   Allows someone else or a deployment server to install dependencies.

database models = The actual PostgreSQL table definitions created through SQLAlchemy.

PostgreSQL = The actual database management system where your data is permanently stored.

SQLAlchemy = A Python library that lets Python communicate with SQL databases.
             Converts Python objects into SQL commands.

FastAPI = The Python web framework that creates your backend API.

Pydantic = A data validation library used by FastAPI.
           Checks that incoming and outgoing data matches your schemas.

Uvicorn = The server that runs your FastAPI application.

API endpoint = A specific URL that performs an action.
               Example:
               GET /hangouts
               POST /items

Session = A temporary connection between your application and the database.
          Used to query, add, update, and delete data.

Engine = SQLAlchemy's connection manager to PostgreSQL.
         Knows how to connect to your database.

Migration = A controlled way to update your database structure over time.
            Example: adding a new column to the items table.

CRUD = The four basic database operations:
       Create = add data
       Read = retrieve data
       Update = modify data
       Delete = remove data

       