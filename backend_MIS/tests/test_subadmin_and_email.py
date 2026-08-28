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


def test_sub_admin_signup_approval_and_login_flow():
    # 1. Sub Admin Signup -> Status PENDING
    signup_resp = client.post(
        "/api/auth/sub-admin/signup",
        json={
            "name": "Test Sub Admin",
            "email": "subadmin.test@mims.app",
            "password": "SubAdminPass@123",
        },
    )
    assert signup_resp.status_code == 201
    assert signup_resp.json()["status"] == "PENDING"

    # 2. Attempt Sub Admin Login before approval -> 403 Forbidden
    login_pending = client.post(
        "/api/auth/sub-admin/login",
        json={"email": "subadmin.test@mims.app", "password": "SubAdminPass@123"},
    )
    assert login_pending.status_code == 403
    assert "waiting for Super Admin approval" in login_pending.json()["detail"]

    # 3. Super Admin views approval requests
    admin_headers = main_admin_headers()
    reqs_resp = client.get("/api/auth/admin/approval-requests", headers=admin_headers)
    assert reqs_resp.status_code == 200
    requests = reqs_resp.json()
    target_req = next((r for r in requests if r["email"] == "subadmin.test@mims.app"), None)
    assert target_req is not None

    # 4. Super Admin approves Sub Admin
    approve_resp = client.post(
        f"/api/auth/admin/approval-requests/{target_req['id']}/approve",
        headers=admin_headers,
    )
    assert approve_resp.status_code == 204

    # 5. Sub Admin logs in after approval -> 200 OK
    login_approved = client.post(
        "/api/auth/sub-admin/login",
        json={"email": "subadmin.test@mims.app", "password": "SubAdminPass@123"},
    )
    assert login_approved.status_code == 200
    sub_admin_token = {"Authorization": f"Bearer {login_approved.json()['accessToken']}"}

    # 6. Sub Admin can access Mureeds
    mureeds_resp = client.get("/api/mureeds", headers=sub_admin_token)
    assert mureeds_resp.status_code == 200

    # 7. Sub Admin CANNOT access Super Admin approval requests -> 403 Forbidden
    restricted_resp = client.get("/api/auth/admin/approval-requests", headers=sub_admin_token)
    assert restricted_resp.status_code == 403


def test_forgot_and_reset_password_flow():
    # 1. Forgot password request -> 200 OK
    forgot_resp = client.post(
        "/api/auth/forgot-password",
        json={"email": "mainadmin@example.com"},
    )
    assert forgot_resp.status_code == 200
    assert "password reset instructions" in forgot_resp.json()["message"]
