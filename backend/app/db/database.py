import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# Load variables from .env
load_dotenv()


# Get PostgreSQL connection URL
DATABASE_URL = os.getenv("DATABASE_URL")


# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL
)


# Create database session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Base class for SQLAlchemy models
Base = declarative_base()


# Gives database sessions to FastAPI routes
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()