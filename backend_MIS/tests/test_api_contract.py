import os
import sys

os.environ["MIMS_DATABASE_URL"] = "sqlite:///./test_mims.db"
os.environ["MIMS_AUTH_BACKEND"] = "local"
os.environ["MIMS_ENV"] = "testing"
os.environ["MIMS_MAIN_ADMIN_EMAIL"] = "mainadmin@example.com"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings
get_settings.cache_clear()

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


client = TestClient(app)


def admin_headers():
    response = client.post(
        "/api/auth/admin/login",
        json={"email": "mainadmin@example.com", "password": "Admin@123"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


def test_admin_can_list_mureeds_with_age():
    response = client.get("/api/mureeds?page=1&pageSize=1", headers=admin_headers())

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 10000
    assert isinstance(body["rows"][0]["age"], int)


def test_duplicate_mureed_email_returns_conflict():
    headers = admin_headers()
    existing = client.get("/api/mureeds/MRD-00002", headers=headers).json()

    response = client.post("/api/mureeds", headers=headers, json=existing)

    assert response.status_code == 409
    assert response.json()["detail"] == "Mureed with this email already exists."


def test_invalid_mureed_payload_is_rejected():
    payload = {
        "name": "Ahmed123",
        "dateOfBirth": "2030-01-01",
        "gender": "Male",
        "address": "Hyderabad",
        "phone": "123",
        "email": "bad-email",
        "peerName": "Qadri",
        "status": "Available",
    }

    response = client.post("/api/mureeds", headers=admin_headers(), json=payload)

    assert response.status_code == 422


def test_mureed_can_read_self_but_not_another_mureed():
    headers = admin_headers()
    own = client.get("/api/mureeds/MRD-00002", headers=headers).json()

    login = client.post(
        "/api/auth/mureed/login",
        json={"email": own["email"], "password": "mureed123"},
    )
    assert login.status_code == 200
    mureed_headers = {"Authorization": f"Bearer {login.json()['accessToken']}"}

    assert client.get("/api/mureeds/me", headers=mureed_headers).status_code == 200
    forbidden = client.get("/api/mureeds/MRD-00003", headers=mureed_headers)
    assert forbidden.status_code == 403


def test_peer_delete_is_blocked_when_mureeds_are_assigned():
    response = client.delete("/api/peers/mr-1", headers=admin_headers())

    assert response.status_code == 409
    assert "Mureeds are currently assigned" in response.json()["detail"]


def test_export_mureeds_csv_excludes_sensitive_fields():
    response = client.get("/api/exports/mureeds?format=csv&gender=Female", headers=admin_headers())

    assert response.status_code == 200
    text = response.content.decode("utf-8-sig")
    header = text.splitlines()[0]
    assert header == "Mureed Name,Date of Birth,Age,Gender,Address,Phone Number,Email,Peer Name,Mureed Status"
    assert "password" not in text.lower()
