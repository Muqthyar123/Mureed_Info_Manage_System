import os
import sys

os.environ["MIMS_DATABASE_URL"] = "sqlite:///./test_mims.db"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def main_admin_headers():
    response = client.post(
        "/api/auth/admin/login",
        json={"email": "mainadmin@example.com", "password": "Admin@123"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


# ----------------------------------------------------
# 1. SECURITY & DATA ISOLATION TESTS
# ----------------------------------------------------

def test_mureed_cannot_access_or_modify_other_mureed():
    headers = main_admin_headers()
    mureed1 = client.get("/api/mureeds/MRD-00002", headers=headers).json()
    mureed2 = client.get("/api/mureeds/MRD-00003", headers=headers).json()

    # Login as Mureed 1 (MRD-00002)
    login_resp = client.post(
        "/api/auth/mureed/login",
        json={"email": mureed1["email"], "password": "mureed123"},
    )
    assert login_resp.status_code == 200
    mureed1_token = {"Authorization": f"Bearer {login_resp.json()['accessToken']}"}

    # Mureed 1 accesses own profile -> 200 OK
    assert client.get("/api/mureeds/me", headers=mureed1_token).status_code == 200

    # Mureed 1 attempts to read Mureed 2 -> 403 Forbidden
    resp_read = client.get(f"/api/mureeds/{mureed2['id']}", headers=mureed1_token)
    assert resp_read.status_code == 403
    assert resp_read.json()["detail"] == "Mureeds can only view their own information."

    # Mureed 1 attempts to update Mureed 2 -> 403 Forbidden
    resp_update = client.put(f"/api/mureeds/{mureed2['id']}", headers=mureed1_token, json=mureed2)
    assert resp_update.status_code == 403

    # Mureed 1 attempts to delete Mureed 2 -> 403 Forbidden
    resp_delete = client.delete(f"/api/mureeds/{mureed2['id']}", headers=mureed1_token)
    assert resp_delete.status_code == 403

    # Mureed 1 attempts to list all Mureeds -> 403 Forbidden
    resp_list = client.get("/api/mureeds", headers=mureed1_token)
    assert resp_list.status_code == 403


def test_normal_admin_cannot_manage_approval_requests():
    # Login as normal admin
    admin_login = client.post(
        "/api/auth/admin/login",
        json={"email": "admin@mims.app", "password": "admin123"},
    )
    assert admin_login.status_code == 200
    normal_admin_token = {"Authorization": f"Bearer {admin_login.json()['accessToken']}"}

    # Attempt to list approval requests -> 403 Forbidden
    resp = client.get("/api/auth/admin/approval-requests", headers=normal_admin_token)
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Main Admin access required."

    # Attempt to approve -> 403 Forbidden
    resp_approve = client.post("/api/auth/admin/approval-requests/dummy-id/approve", headers=normal_admin_token)
    assert resp_approve.status_code == 403

    # Attempt to reject -> 403 Forbidden
    resp_reject = client.post("/api/auth/admin/approval-requests/dummy-id/reject", headers=normal_admin_token)
    assert resp_reject.status_code == 403


def test_unknown_google_admin_gets_pending_and_forbidden():
    # Google login with an unknown email
    resp = client.post("/api/auth/admin/google", json={"email": "newgoogleadmin@example.com"})
    assert resp.status_code == 403
    assert "not authorized for Admin access" in resp.json()["detail"]

    # Verify that an approval request was created
    headers = main_admin_headers()
    requests = client.get("/api/auth/admin/approval-requests", headers=headers).json()
    req = next((r for r in requests if r["email"] == "newgoogleadmin@example.com"), None)
    assert req is not None
    assert req["status"] == "PENDING"
    assert req["authMethod"] == "google"


def test_main_admin_can_approve_and_reject_admin():
    # 1. Start signup for Admin A
    start_a = client.post(
        "/api/auth/admin/signup/start",
        json={"name": "Admin Alpha", "email": "adminalpha@example.com", "password": "Password@123"},
    )
    assert start_a.status_code == 200
    signup_a = start_a.json()

    # Verify OTP
    verify_a = client.post(
        "/api/auth/admin/signup/verify",
        json={"signup": signup_a, "otp": "123456"},
    )
    assert verify_a.status_code == 200
    assert verify_a.json()["status"] == "PENDING"

    # Pending Admin Alpha attempts login -> 403 Forbidden
    login_a_pending = client.post(
        "/api/auth/admin/login",
        json={"email": "adminalpha@example.com", "password": "Password@123"},
    )
    assert login_a_pending.status_code == 403

    # 2. Main Admin approves Admin Alpha
    headers = main_admin_headers()
    requests = client.get("/api/auth/admin/approval-requests", headers=headers).json()
    req_a = next(r for r in requests if r["email"] == "adminalpha@example.com")

    approve_resp = client.post(f"/api/auth/admin/approval-requests/{req_a['id']}/approve", headers=headers)
    assert approve_resp.status_code == 204

    # Now Approved Admin Alpha can login -> 200 OK
    login_a_active = client.post(
        "/api/auth/admin/login",
        json={"email": "adminalpha@example.com", "password": "Password@123"},
    )
    assert login_a_active.status_code == 200

    # 3. Start signup for Admin B (to test rejection)
    start_b = client.post(
        "/api/auth/admin/signup/start",
        json={"name": "Admin Beta", "email": "adminbeta@example.com", "password": "Password@123"},
    )
    signup_b = start_b.json()
    client.post("/api/auth/admin/signup/verify", json={"signup": signup_b, "otp": "123456"})

    requests_b = client.get("/api/auth/admin/approval-requests", headers=headers).json()
    req_b = next(r for r in requests_b if r["email"] == "adminbeta@example.com")

    reject_resp = client.post(f"/api/auth/admin/approval-requests/{req_b['id']}/reject", headers=headers)
    assert reject_resp.status_code == 204

    # Rejected Admin Beta attempts login -> 403 Forbidden
    login_b_rejected = client.post(
        "/api/auth/admin/login",
        json={"email": "adminbeta@example.com", "password": "Password@123"},
    )
    assert login_b_rejected.status_code == 403


# ----------------------------------------------------
# 2. FIELD VALIDATION TESTS
# ----------------------------------------------------

def test_validation_rules_for_mureed_creation():
    headers = main_admin_headers()

    base_payload = {
        "name": "Meera Muqthyar",
        "dateOfBirth": "1998-05-15",
        "gender": "Male",
        "address": "123 Main St, Hyderabad",
        "phone": "9876543210",
        "email": "meera.valid@example.com",
        "peerName": "Qadri",
        "status": "Available",
    }

    # Valid name variations (D'Souza, Al-Amin)
    valid1 = client.post("/api/mureeds", headers=headers, json={**base_payload, "name": "D'Souza", "email": "dsouza@example.com"})
    assert valid1.status_code == 200

    valid2 = client.post("/api/mureeds", headers=headers, json={**base_payload, "name": "Al-Amin", "email": "alamin@example.com"})
    assert valid2.status_code == 200

    # Invalid name (digits) -> 422
    invalid_name = client.post("/api/mureeds", headers=headers, json={**base_payload, "name": "Meera123", "email": "m1@example.com"})
    assert invalid_name.status_code == 422

    # Invalid email -> 422
    invalid_email = client.post("/api/mureeds", headers=headers, json={**base_payload, "email": "bademailformat"})
    assert invalid_email.status_code == 422

    # Invalid phone (less than 10 digits) -> 422
    invalid_phone1 = client.post("/api/mureeds", headers=headers, json={**base_payload, "phone": "98765", "email": "p1@example.com"})
    assert invalid_phone1.status_code == 422

    # Invalid phone (does not start with 6-9) -> 422
    invalid_phone2 = client.post("/api/mureeds", headers=headers, json={**base_payload, "phone": "1234567890", "email": "p2@example.com"})
    assert invalid_phone2.status_code == 422

    # Invalid gender -> 422
    invalid_gender = client.post("/api/mureeds", headers=headers, json={**base_payload, "gender": "Other", "email": "g1@example.com"})
    assert invalid_gender.status_code == 422

    # Invalid status -> 422
    invalid_status = client.post("/api/mureeds", headers=headers, json={**base_payload, "status": "Unknown", "email": "s1@example.com"})
    assert invalid_status.status_code == 422


def test_password_validation_rules():
    # Test weak passwords in admin signup
    weak_passwords = [
        "short1!",        # Too short (<8)
        "verylongpassword123!", # Too long (>12)
        "lowercase1!",    # No uppercase
        "UPPERCASE1!",    # No lowercase
        "NoDigitsHere!",  # No digit
        "NoSpecial123",   # No special char
    ]
    for pw in weak_passwords:
        resp = client.post(
            "/api/auth/admin/signup/start",
            json={"name": "Test User", "email": f"test_{hash(pw)}@example.com", "password": pw},
        )
        assert resp.status_code == 422, f"Password '{pw}' should have been rejected with 422"


# ----------------------------------------------------
# 3. CRUD, SEARCH, FILTER, PAGINATION & EXPORT TESTS
# ----------------------------------------------------

def test_mureed_crud_and_server_side_filtering():
    headers = main_admin_headers()

    # 1. Create
    new_mureed = {
        "name": "Shaik Mureed",
        "dateOfBirth": "2000-01-01",
        "gender": "Male",
        "address": "Banjara Hills, Hyderabad",
        "phone": "9123456789",
        "email": "shaik.mureed@example.com",
        "peerName": "Qadri",
        "status": "Available",
    }
    created = client.post("/api/mureeds", headers=headers, json=new_mureed)
    assert created.status_code == 200
    m_id = created.json()["id"]

    # 2. Read
    fetched = client.get(f"/api/mureeds/{m_id}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Shaik Mureed"

    # 3. Update
    updated_payload = {**new_mureed, "status": "Passed Out"}
    updated = client.put(f"/api/mureeds/{m_id}", headers=headers, json=updated_payload)
    assert updated.status_code == 200
    assert updated.json()["status"] == "Passed Out"

    # 4. Search by name & filter by location
    search_resp = client.get("/api/mureeds?search=Shaik&location=Hyderabad", headers=headers)
    assert search_resp.status_code == 200
    assert search_resp.json()["total"] >= 1

    # 5. Filter by gender & status
    filter_resp = client.get("/api/mureeds?gender=Male&status=Passed%20Out", headers=headers)
    assert filter_resp.status_code == 200

    # 6. Pagination check
    page_resp = client.get("/api/mureeds?page=1&pageSize=5", headers=headers)
    assert page_resp.status_code == 200
    assert len(page_resp.json()["rows"]) <= 5
    assert page_resp.json()["pageSize"] == 5

    # 7. Delete
    del_resp = client.delete(f"/api/mureeds/{m_id}", headers=headers)
    assert del_resp.status_code == 204

    # Verify deleted
    assert client.get(f"/api/mureeds/{m_id}", headers=headers).status_code == 404


def test_peer_crud():
    headers = main_admin_headers()

    # Create Peer
    peer_create = client.post("/api/peers", headers=headers, json={"name": "Test Order Peer", "status": "Active"})
    assert peer_create.status_code == 200
    p_id = peer_create.json()["id"]

    # Update Peer
    peer_update = client.put(f"/api/peers/{p_id}", headers=headers, json={"name": "Test Order Peer Renamed", "status": "Active"})
    assert peer_update.status_code == 200
    assert peer_update.json()["name"] == "Test Order Peer Renamed"

    # Delete Peer (no mureeds assigned)
    peer_delete = client.delete(f"/api/peers/{p_id}", headers=headers)
    assert peer_delete.status_code == 204


def test_export_peers_and_filtered_mureeds():
    headers = main_admin_headers()

    # Export Peers CSV
    peers_csv = client.get("/api/exports/peers?format=csv", headers=headers)
    assert peers_csv.status_code == 200
    assert "Peer Name,Status,Number of Mureeds" in peers_csv.content.decode("utf-8-sig")

    # Export Peers XLSX
    peers_xlsx = client.get("/api/exports/peers?format=xlsx", headers=headers)
    assert peers_xlsx.status_code == 200

    # Export Mureeds XLSX with filters
    mureeds_xlsx = client.get("/api/exports/mureeds?format=xlsx&gender=Male", headers=headers)
    assert mureeds_xlsx.status_code == 200


def test_production_configuration_validation(monkeypatch):
    from app.config import Settings
    import pytest

    monkeypatch.setenv("MIMS_ENV", "production")
    monkeypatch.setenv("MIMS_DATABASE_URL", "sqlite:///./mims.db")
    monkeypatch.setenv("MIMS_AUTH_BACKEND", "supabase")
    monkeypatch.setenv("SUPABASE_URL", "https://mock.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "mock-anon-key")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "mock-service-key")

    s1 = Settings()
    with pytest.raises(RuntimeError, match="Production mode cannot use SQLite"):
        s1.validate_production()

    monkeypatch.setenv("MIMS_DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
    monkeypatch.setenv("MIMS_AUTH_BACKEND", "local")
    s2 = Settings()
    with pytest.raises(RuntimeError, match="Production mode must use Supabase Auth"):
        s2.validate_production()

    monkeypatch.setenv("MIMS_ENV", "development")
    monkeypatch.setenv("MIMS_AUTH_BACKEND", "supabase")
    monkeypatch.setenv("SUPABASE_URL", "")
    s3 = Settings()
    with pytest.raises(RuntimeError, match="Supabase auth mode requires"):
        s3.require_supabase()


