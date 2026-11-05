"""
Pytest Test Configuration and Fixtures.
Sets up an isolated test database and FastAPI TestClient.
"""

import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.base import Base
from database.session import get_db
from database.seed_data import seed_default_data
from main import app

# Isolated SQLite in-memory / file database for test suite
TEST_DATABASE_URL = "sqlite:///./test_krishi.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initializes schema and seeds baseline data for test session."""
    import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_default_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Yields a database session per test with automatic rollback."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Provides a TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
