import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.database import SessionLocal
from app.main import app
from app.models import PendingAdminSignup, UserAccount
from app.security import create_token


def test_local_hmac_token_accepted_in_local_mode():
    """A. Local HMAC token with MIMS_AUTH_BACKEND=local -> ACCEPTED"""
    get_settings.cache_clear()
    settings = get_settings()
    assert not settings.use_supabase_auth

    with SessionLocal() as db:
        admin = db.query(UserAccount).filter(UserAccount.email == settings.main_admin_email).first()
        assert admin is not None
        admin_id = admin.id
        admin_role = admin.role

    token = create_token({"sub": admin_id, "role": admin_role})
    headers = {"Authorization": f"Bearer {token}"}

    client = TestClient(app)
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == settings.main_admin_email


def test_local_hmac_token_rejected_in_supabase_mode(monkeypatch):
    """B. Local HMAC token with MIMS_AUTH_BACKEND=supabase -> REJECTED (401 Unauthorized)"""
    get_settings.cache_clear()
    settings = get_settings()
    monkeypatch.setattr(settings, "auth_backend", "supabase")
    monkeypatch.setattr(settings, "supabase_url", "https://mock.supabase.co")
    monkeypatch.setattr(settings, "supabase_anon_key", "mock_anon_key")
    monkeypatch.setattr(settings, "supabase_service_role_key", "mock_service_key")

    with SessionLocal() as db:
        admin = db.query(UserAccount).filter(UserAccount.email == settings.main_admin_email).first()
        assert admin is not None
        admin_id = admin.id
        admin_role = admin.role

    token = create_token({"sub": admin_id, "role": admin_role})
    headers = {"Authorization": f"Bearer {token}"}

    client = TestClient(app)
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 401
    assert "Invalid or expired Supabase token" in res.json().get("detail", "")
    get_settings.cache_clear()


def test_demo_otp_rejected_in_supabase_mode(monkeypatch):
    """C. Demo OTP '123456' with MIMS_AUTH_BACKEND=supabase -> REJECTED (400)"""
    get_settings.cache_clear()
    settings = get_settings()
    monkeypatch.setattr(settings, "auth_backend", "supabase")
    monkeypatch.setattr(settings, "supabase_url", "https://mock.supabase.co")
    monkeypatch.setattr(settings, "supabase_anon_key", "mock_anon_key")
    monkeypatch.setattr(settings, "supabase_service_role_key", "mock_service_key")

    with SessionLocal() as db:
        signup_row = PendingAdminSignup(
            token="test-session-token",
            name="Test Admin",
            email="testadmin@example.com",
            password_hash="",
            expires_at=9999999999999,
        )
        db.merge(signup_row)
        db.commit()

    payload = {
        "signup": {
            "name": "Test Admin",
            "email": "testadmin@example.com",
            "passwordHash": "test-session-token",
            "expiresAt": 9999999999999,
        },
        "otp": "123456",
    }

    client = TestClient(app)
    res = client.post("/api/auth/admin/signup/verify", json=payload)
    assert res.status_code == 400
    assert "Demo OTP '123456' is not allowed in Supabase Auth mode" in res.json().get("detail", "")
    get_settings.cache_clear()

