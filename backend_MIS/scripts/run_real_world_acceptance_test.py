import os
import sys
import uuid
from fastapi.testclient import TestClient

from dotenv import load_dotenv
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")))

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import SessionLocal
from app.models import UserAccount, Mureed, Peer, AdminApprovalRequest
from app.config import get_settings

settings = get_settings()
client = TestClient(app)

print("==================================================")
print("  RUNNING MIMS REAL-WORLD SYSTEM ACCEPTANCE TEST  ")
print("==================================================")
print(f"Auth Backend: {settings.auth_backend}")
print(f"Use Supabase Auth: {settings.use_supabase_auth}")

def test_system():
    # ----------------------------------------------------
    # 1. SUPER ADMIN TEST
    # ----------------------------------------------------
    print("\n--- [1/5] SUPER ADMIN LOGIN & API TEST ---")
    super_email = settings.main_admin_email
    super_pass = settings.main_admin_password
    print(f"Attempting login for: '{super_email}'")

    res_login = client.post("/api/auth/admin/login", json={"email": super_email, "password": super_pass})
    print(f"POST /api/auth/admin/login Status: {res_login.status_code}")
    assert res_login.status_code == 200, f"Super Admin login failed: {res_login.text}"
    
    data_login = res_login.json()
    token = data_login["accessToken"]
    assert token, "Supabase accessToken missing from response"
    print(f"Super Admin JWT Token Length: {len(token)}")

    headers = {"Authorization": f"Bearer {token}"}

    # /auth/me
    res_me = client.get("/api/auth/me", headers=headers)
    print(f"GET /api/auth/me Status: {res_me.status_code}")
    assert res_me.status_code == 200, f"/auth/me failed: {res_me.text}"
    user_me = res_me.json()
    assert user_me["email"].lower() == super_email.lower()
    assert user_me["adminRole"] == "MAIN_ADMIN"

    # /reports/overview
    res_overview = client.get("/api/reports/overview", headers=headers)
    print(f"GET /api/reports/overview Status: {res_overview.status_code} -> Data: {res_overview.json()}")
    assert res_overview.status_code == 200

    # /mureeds
    res_mureeds = client.get("/api/mureeds", headers=headers)
    print(f"GET /api/mureeds Status: {res_mureeds.status_code} -> Rows: {len(res_mureeds.json().get('rows', []))}, Total: {res_mureeds.json().get('total')}")
    assert res_mureeds.status_code == 200

    # /peers
    res_peers = client.get("/api/peers", headers=headers)
    print(f"GET /api/peers Status: {res_peers.status_code} -> Peers Count: {len(res_peers.json())}")
    assert res_peers.status_code == 200

    # /users
    res_users = client.get("/api/users", headers=headers)
    print(f"GET /api/users Status: {res_users.status_code} -> Users Count: {len(res_users.json())}")
    assert res_users.status_code == 200

    # ----------------------------------------------------
    # 2. CREATE A REAL TEST MUREED
    # ----------------------------------------------------
    print("\n--- [2/5] CREATE REAL MUREED TEST ---")
    test_mureed_email = f"realtestmureed_{uuid.uuid4().hex[:6]}@mims.app"
    mureed_payload = {
        "name": "Real System Test Mureed",
        "dateOfBirth": "1996-08-15",
        "gender": "Male",
        "address": "786 High Street, City",
        "phone": "9876543210",
        "email": test_mureed_email,
        "peerName": "None",
        "status": "Available",
    }
    res_create_mureed = client.post("/api/mureeds", json=mureed_payload, headers=headers)
    print(f"POST /api/mureeds Status: {res_create_mureed.status_code}")
    assert res_create_mureed.status_code in (200, 201), f"Create Mureed failed: {res_create_mureed.text}"
    created_mureed = res_create_mureed.json()
    mureed_id = created_mureed["id"]
    print(f"Created Mureed ID: {mureed_id} | Email: {created_mureed['email']}")

    # ----------------------------------------------------
    # 3. TEST MUREED LOGIN
    # ----------------------------------------------------
    print("\n--- [3/5] MUREED LOGIN & PROFILE ISOLATION TEST ---")
    res_mureed_login = client.post("/api/auth/mureed/login", json={"email": test_mureed_email, "password": settings.default_mureed_password})
    print(f"POST /api/auth/mureed/login Status: {res_mureed_login.status_code}")
    assert res_mureed_login.status_code == 200, f"Mureed login failed: {res_mureed_login.text}"
    
    mureed_token = res_mureed_login.json()["accessToken"]
    m_headers = {"Authorization": f"Bearer {mureed_token}"}

    res_m_me = client.get("/api/auth/me", headers=m_headers)
    print(f"Mureed GET /api/auth/me Status: {res_m_me.status_code}")
    assert res_m_me.status_code == 200

    res_own_mureed = client.get(f"/api/mureeds/{mureed_id}", headers=m_headers)
    print(f"Mureed GET /api/mureeds/{mureed_id} (Own Profile) Status: {res_own_mureed.status_code}")
    assert res_own_mureed.status_code == 200

    res_admin_page = client.get("/api/reports/overview", headers=m_headers)
    print(f"Mureed GET /api/reports/overview (Forbidden check) Status: {res_admin_page.status_code}")
    assert res_admin_page.status_code == 403

    # ----------------------------------------------------
    # 4. TEST SUB ADMIN SIGNUP, APPROVAL & LOGIN
    # ----------------------------------------------------
    print("\n--- [4/5] SUB ADMIN SIGNUP, APPROVAL & PERMISSIONS TEST ---")
    sub_email = f"testsubadmin_{uuid.uuid4().hex[:6]}@mims.app"
    test_sub_pass = "TestSubAdminPass@123"
    res_sub_signup = client.post("/api/auth/sub-admin/signup", json={"name": "Test SubAdmin", "email": sub_email, "password": test_sub_pass})
    print(f"POST /api/auth/sub-admin/signup Status: {res_sub_signup.status_code}")
    assert res_sub_signup.status_code == 201

    # Super Admin lists approval requests
    res_reqs = client.get("/api/auth/admin/approval-requests", headers=headers)
    req_id = None
    for req in res_reqs.json():
        if req["email"].lower() == sub_email.lower():
            req_id = req["id"]
            break
    assert req_id is not None, f"Approval request not found for {sub_email}"

    # Super Admin approves request
    res_approve = client.post(f"/api/auth/admin/approval-requests/{req_id}/approve", headers=headers)
    print(f"POST /api/auth/admin/approval-requests/{req_id}/approve Status: {res_approve.status_code}")
    assert res_approve.status_code in (200, 204)

    # Sub Admin logs in
    res_sub_login = client.post("/api/auth/sub-admin/login", json={"email": sub_email, "password": test_sub_pass})
    print(f"POST /api/auth/sub-admin/login Status: {res_sub_login.status_code}")
    assert res_sub_login.status_code == 200

    sub_token = res_sub_login.json()["accessToken"]
    sub_headers = {"Authorization": f"Bearer {sub_token}"}

    # Sub Admin access checks
    res_sub_overview = client.get("/api/reports/overview", headers=sub_headers)
    print(f"Sub Admin GET /api/reports/overview Status: {res_sub_overview.status_code}")
    assert res_sub_overview.status_code == 200

    # Sub Admin cannot approve sub admins
    res_sub_approval_blocked = client.get("/api/auth/admin/approval-requests", headers=sub_headers)
    print(f"Sub Admin GET /api/auth/admin/approval-requests (Forbidden check) Status: {res_sub_approval_blocked.status_code}")
    assert res_sub_approval_blocked.status_code == 403

    # Clean up test records
    print("\n--- [5/5] CLEANUP TEST DATA ---")
    client.delete(f"/api/mureeds/{mureed_id}", headers=headers)
    client.delete(f"/api/users/usr-subadmin-{req_id}", headers=headers)
    print("Cleaned up temporary test Mureed & Sub Admin.")

    print("\n==================================================")
    print("  ALL MIMS REAL-WORLD ACCEPTANCE TESTS PASSED 100%! ")
    print("==================================================")

if __name__ == "__main__":
    test_system()
