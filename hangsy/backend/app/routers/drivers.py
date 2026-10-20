from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.driver import Driver
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverResponse
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


@router.post("/", response_model=DriverResponse)
def create_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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


# The logged-in user's own saved vehicle — this is what Settings' "Default
# vehicle" form reads from and saves to. Registered before "/{driver_id}"
# would be (there isn't one yet, but if one's added later, keep "/me" first
# so "me" is never parsed as a driver_id).
@router.get("/me", response_model=DriverResponse)
def get_my_driver(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="No vehicle saved yet")
    return driver


@router.put("/me", response_model=DriverResponse)
def save_my_driver(
    driver_update: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create-or-update: the Settings form always calls this same endpoint,
    whether it's the user's first time saving a vehicle or their tenth."""
    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()

    if driver:
        driver.driver_name = driver_update.driver_name
        driver.capacity = driver_update.capacity
        driver.license_plate = driver_update.license_plate
        driver.notes = driver_update.notes
    else:
        driver = Driver(
            **driver_update.model_dump(),
            user_id=current_user.user_id,
        )
        db.add(driver)

    db.commit()
    db.refresh(driver)
    return driver
