from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.db.connection import engine, Base

# Import models so SQLAlchemy registers tables
from app.models import (
    hangout,
    item,
    route,
    driver,
    store,
    user,
    pickup
)

# Import routers
from app.routers import (
    hangouts,
    items,
    stores,
    routes,
    drivers,
    users,
    auth,
    pickup,
    calendar
)


app = FastAPI()

# Lets the frontend call this API from the browser. Comma-separated list in
# CORS_ORIGINS for real deployments; defaults to the Vite dev server.
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Register API routes
app.include_router(hangouts.router)
app.include_router(items.router)
app.include_router(stores.router)
app.include_router(routes.router)
app.include_router(drivers.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(pickup.router)
app.include_router(calendar.router)

@app.get("/")
def root():
    return {"message": "Hangsy API running"}