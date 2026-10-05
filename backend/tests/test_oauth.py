from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api import auth as auth_api
from backend.app.database import get_db
from backend.app.models.user import Base, User
from backend.app.services.auth import authenticate_user, hash_password


def make_client(monkeypatch, identity_response):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    def override_get_db():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    class FakeResponse:
        status_code = identity_response["status_code"]

        def json(self):
            return identity_response.get("body", {})

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def get(self, url, headers):
            assert url == "https://example.supabase.co/auth/v1/user"
            assert headers["apikey"] == "test-anon-key"
            assert headers["Authorization"] == "Bearer supabase-access-token"
            return FakeResponse()

    monkeypatch.setattr(auth_api.settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(auth_api.settings, "SUPABASE_ANON_KEY", "test-anon-key")
    monkeypatch.setattr(auth_api.httpx, "AsyncClient", lambda timeout: FakeClient())
    app = FastAPI()
    app.include_router(auth_api.router, prefix="/api/v1")
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app), Session, engine


def test_oauth_exchange_creates_local_user_and_returns_enthesis_token(monkeypatch):
    client, Session, engine = make_client(
        monkeypatch,
        {
            "status_code": 200,
            "body": {
                "email": "researcher@example.com",
                "email_confirmed_at": "2025-01-01T00:00:00Z",
                "user_metadata": {"full_name": "Researcher Example"},
            },
        },
    )
    try:
        response = client.post(
            "/api/v1/auth/oauth/exchange",
            json={"access_token": "supabase-access-token"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["token_type"] == "bearer"
        assert payload["user"]["email"] == "researcher@example.com"
        assert payload["user"]["full_name"] == "Researcher Example"
        assert payload["access_token"]

        session = Session()
        try:
            user = session.query(User).filter_by(email="researcher@example.com").one()
            assert payload["user"]["username"] == user.username
            assert user.hashed_password
        finally:
            session.close()
    finally:
        client.close()
        engine.dispose()


def test_oauth_exchange_reuses_existing_password_account(monkeypatch):
    client, Session, engine = make_client(
        monkeypatch,
        {
            "status_code": 200,
            "body": {
                "email": "alex@example.com",
                "email_confirmed_at": "2025-01-01T00:00:00Z",
            },
        },
    )
    session = Session()
    existing_user = User(
        email="alex@example.com",
        username="alex",
        hashed_password=hash_password("correct-password"),
    )
    session.add(existing_user)
    session.commit()
    existing_id = existing_user.id
    session.close()
    try:
        response = client.post(
            "/api/v1/auth/oauth/exchange",
            json={"access_token": "supabase-access-token"},
        )
        assert response.status_code == 200
        assert response.json()["user"]["id"] == existing_id

        session = Session()
        try:
            assert authenticate_user(session, "alex", "correct-password").id == existing_id
        finally:
            session.close()
    finally:
        client.close()
        engine.dispose()


def test_oauth_exchange_rejects_unverified_email(monkeypatch):
    client, _, engine = make_client(
        monkeypatch,
        {
            "status_code": 200,
            "body": {"email": "researcher@example.com"},
        },
    )
    try:
        response = client.post(
            "/api/v1/auth/oauth/exchange",
            json={"access_token": "supabase-access-token"},
        )
        assert response.status_code == 403
        assert "Verify your email" in response.json()["detail"]
    finally:
        client.close()
        engine.dispose()


def test_oauth_exchange_rejects_invalid_supabase_session(monkeypatch):
    client, _, engine = make_client(monkeypatch, {"status_code": 401, "body": {}})
    try:
        response = client.post(
            "/api/v1/auth/oauth/exchange",
            json={"access_token": "supabase-access-token"},
        )
        assert response.status_code == 401
        assert "Supabase rejected" in response.json()["detail"]
    finally:
        client.close()
        engine.dispose()


def test_oauth_exchange_reports_missing_supabase_configuration(monkeypatch):
    monkeypatch.setattr(auth_api.settings, "SUPABASE_URL", "")
    monkeypatch.setattr(auth_api.settings, "SUPABASE_ANON_KEY", "")

    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)

    def override_get_db():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    app = FastAPI()
    app.include_router(auth_api.router, prefix="/api/v1")
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    try:
        response = client.post(
            "/api/v1/auth/oauth/exchange",
            json={"access_token": "supabase-access-token"},
        )
        assert response.status_code == 503
        assert "OAuth sign-in is not configured" in response.json()["detail"]
    finally:
        client.close()
        engine.dispose()


def test_oauth_exchange_reports_malformed_supabase_url(monkeypatch):
    client, _, engine = make_client(
        monkeypatch,
        {"status_code": 200, "body": {}},
    )
    monkeypatch.setattr(auth_api.settings, "SUPABASE_URL", "project-ref.supabase.co")
    try:
        response = client.post(
            "/api/v1/auth/oauth/exchange",
            json={"access_token": "supabase-access-token"},
        )
        assert response.status_code == 503
        assert "complete HTTP or HTTPS URL" in response.json()["detail"]
    finally:
        client.close()
        engine.dispose()
