from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.driver import Driver
from app.schemas.driver import DriverCreate, DriverResponse


router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


@router.post("/", response_model=DriverResponse)
def create_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db)
):
    new_driver = Driver(
        **driver.model_dump()
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return new_driver


@router.get("/", response_model=list[DriverResponse])
def get_drivers(
    db: Session = Depends(get_db)
):
    return db.query(Driver).all()