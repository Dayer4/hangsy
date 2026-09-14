"""
Shared pytest fixtures.

Why not SQLite: several models use `sqlalchemy.dialects.postgresql.ARRAY`
(User.hangout_ids, Route.pickup_ids, Store.assigned_person_names/items_to_buy),
which SQLite can't represent. So tests run against a real Postgres database —
by default the same one from `.env`, but each test runs inside a transaction
that's rolled back at the end, so nothing is actually persisted.

To keep this fully off your dev data, set TEST_DATABASE_URL in `.env` to a
separate database (e.g. postgresql://user:password@localhost:5432/hangsy_test)
before running pytest.
"""
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.connection import Base, get_db

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
