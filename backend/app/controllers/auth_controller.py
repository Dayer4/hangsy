# controllers/auth_controller.py

from sqlalchemy.orm import Session
from models.user import User
from schemas.auth import UserCreate
from passlib.context import CryptContext


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def register_user(
    db: Session,
    user: UserCreate
):

    hashed_password = pwd_context.hash(
        user.password
    )

    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user



def login_user(
    db: Session,
    email: str,
    password: str
):

    user = db.query(User)\
        .filter(User.email == email)\
        .first()

    if not user:
        return None

    if not pwd_context.verify(
        password,
        user.password
    ):
        return None

    return user