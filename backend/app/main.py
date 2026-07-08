from fastapi import FastAPI

from app.db.database import engine
from app.db.database import Base

from app.models import hangout, item, route, driver, store

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Hangsy API running"}