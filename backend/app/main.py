from fastapi import FastAPI

from app.db.database import engine, Base

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
    locations,
    auth,
    pickup
)


app = FastAPI()


# Create database tables
Base.metadata.create_all(bind=engine)


# Register API routes
app.include_router(hangouts.router)
app.include_router(items.router)
app.include_router(stores.router)
app.include_router(routes.router)
app.include_router(drivers.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "Hangsy API running"}