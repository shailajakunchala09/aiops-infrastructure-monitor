"""
Shared pytest fixtures: an isolated in-memory-ish SQLite test database and
a FastAPI TestClient wired to it, so the test suite never touches a real
Postgres instance.

NOTE: the models use PostgreSQL-native UUID/Enum types for production
correctness. For full-fidelity integration testing, CI runs this suite
against a real (throwaway) Postgres service container - see
.github/workflows/ci.yml. The SQLite fixtures here are kept for fast local
unit tests of business logic that doesn't depend on Postgres-only types.
"""
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.session import Base, get_db
from app.main import app
from app.models.user import User, UserRole

SQLALCHEMY_TEST_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    user = User(
        id=uuid.uuid4(),
        full_name="Test Admin",
        email="admin@test.local",
        hashed_password=hash_password("Password123!"),
        role=UserRole.ADMIN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.local", "password": "Password123!"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
