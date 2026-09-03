import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.security import create_token
from app import models

def run_tests():
    print("=" * 70)
    print("  RUNNING USER MANAGEMENT VISIBILITY & TRANSITION TEST SUITE")
    print("=" * 70)

    db = SessionLocal()

    # Get admin user for auth header
    admin_user = db.query(models.UserAccount).filter(models.UserAccount.role.in_(["Admin", "SUPER_ADMIN"])).first()
    if not admin_user:
        print("ERROR: No admin user found for testing.")
        sys.exit(1)

    token = create_token({"sub": admin_user.id, "email": admin_user.email, "role": admin_user.role, "admin_role": admin_user.admin_role})
    headers = {"Authorization": f"Bearer {token}"}

    client = TestClient(app)

    # -------------------------------------------------------------------
    # TEST 1: Create Mureed WITH Email
    # -------------------------------------------------------------------
    print("\n--- TEST 1: Create Mureed WITH Email ---")
    email1 = f"test_with_email_{uuid.uuid4().hex[:6]}@mims.app"
    payload1 = {
        "name": "Mureed With Email",
        "dateOfBirth": "1990-01-01",
        "gender": "Male",
        "address": "123 Test Street",
        "phone": "9876543210",
        "email": email1,
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp1 = client.post("/api/mureeds", json=payload1, headers=headers)
    assert resp1.status_code == 200, f"Failed create mureed with email: {resp1.text}"
    mureed1 = resp1.json()
    id1 = mureed1["id"]
    print(f"Created Mureed 1 ID: {id1} | Email: {mureed1['email']}")

    # Check Mureed Management API (GET /api/mureeds)
    r_mureeds = client.get(f"/api/mureeds/{id1}", headers=headers)
    assert r_mureeds.status_code == 200, "Mureed 1 must appear in Mureed Management"
    print("Mureed Management -> VISIBLE (PASS)")

    # Check User Management API (GET /api/users)
    r_users = client.get("/api/users?role=all", headers=headers)
    user_emails = [u["email"].lower() for u in r_users.json() if u.get("email")]
    assert email1.lower() in user_emails, "Mureed 1 WITH email MUST appear in User Management"
    print("User Management -> VISIBLE (PASS)")

    # -------------------------------------------------------------------
    # TEST 2: Create Mureed WITHOUT Email
    # -------------------------------------------------------------------
    print("\n--- TEST 2: Create Mureed WITHOUT Email ---")
    payload2 = {
        "name": "Mureed Without Email",
        "dateOfBirth": "1992-02-02",
        "gender": "Female",
        "address": "456 Test Street",
        "phone": "9876543211",
        "email": "",
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp2 = client.post("/api/mureeds", json=payload2, headers=headers)
    assert resp2.status_code == 200, f"Failed create mureed without email: {resp2.text}"
    mureed2 = resp2.json()
    id2 = mureed2["id"]
    print(f"Created Mureed 2 ID: {id2} | Email: {mureed2['email']}")

    # Check Mureed Management API (GET /api/mureeds)
    r_mureeds2 = client.get(f"/api/mureeds/{id2}", headers=headers)
    assert r_mureeds2.status_code == 200, "Mureed 2 without email MUST appear in Mureed Management"
    print("Mureed Management -> VISIBLE (PASS)")

    # Check User Management API (GET /api/users)
    r_users2 = client.get("/api/users?role=all", headers=headers)
    user_ids = [u["id"] for u in r_users2.json()]
    assert f"usr-{id2}" not in user_ids and id2 not in user_ids, "Mureed 2 WITHOUT email MUST NOT appear in User Management"
    print("User Management -> NOT VISIBLE (PASS)")

    # -------------------------------------------------------------------
    # TEST 3: Existing Mureed has email NULL -> Admin edits and adds email
    # -------------------------------------------------------------------
    print("\n--- TEST 3: Email Added Later (NULL -> Valid Email) ---")
    added_email = f"test_added_later_{uuid.uuid4().hex[:6]}@mims.app"
    payload3 = {
        "name": "Mureed Without Email",
        "dateOfBirth": "1992-02-02",
        "gender": "Female",
        "address": "456 Test Street",
        "phone": "9876543211",
        "email": added_email,
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp3 = client.put(f"/api/mureeds/{id2}", json=payload3, headers=headers)
    assert resp3.status_code == 200, f"Failed update email: {resp3.text}"
    mureed3 = resp3.json()
    assert mureed3["id"] == id2, "SAME Mureed ID must be preserved"
    print(f"Updated Mureed 2 ID: {mureed3['id']} | New Email: {mureed3['email']} | Message: {mureed3['message']}")

    # Check User Management API now
    r_users3 = client.get("/api/users?role=all", headers=headers)
    user_emails3 = [u["email"].lower() for u in r_users3.json() if u.get("email")]
    assert added_email.lower() in user_emails3, "Mureed 2 MUST NOW appear in User Management after adding email"
    print("User Management -> NOW VISIBLE (PASS)")

    # -------------------------------------------------------------------
    # TEST 4: Existing Mureed has email -> Edit non-email details
    # -------------------------------------------------------------------
    print("\n--- TEST 4: Edit Non-Email Details ---")
    payload4 = {
        "name": "Mureed Name Updated",
        "dateOfBirth": "1992-02-02",
        "gender": "Female",
        "address": "789 New Address",
        "phone": "9876543211",
        "email": added_email,
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp4 = client.put(f"/api/mureeds/{id2}", json=payload4, headers=headers)
    assert resp4.status_code == 200, f"Failed update details: {resp4.text}"
    mureed4 = resp4.json()
    assert mureed4["name"] == "Mureed Name Updated"
    print("Updated Mureed details. Message:", mureed4["message"])
    assert mureed4["message"] == "Mureed details updated successfully.", "No welcome email should be sent when email is unchanged"

    # -------------------------------------------------------------------
    # TEST 5: Existing Mureed has email -> Admin removes email
    # -------------------------------------------------------------------
    print("\n--- TEST 5: Email Removed Later (Valid -> NULL) ---")
    payload5 = {
        "name": "Mureed Name Updated",
        "dateOfBirth": "1992-02-02",
        "gender": "Female",
        "address": "789 New Address",
        "phone": "9876543211",
        "email": "", # Remove email!
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp5 = client.put(f"/api/mureeds/{id2}", json=payload5, headers=headers)
    assert resp5.status_code == 200, f"Failed removing email: {resp5.text}"
    mureed5 = resp5.json()
    assert mureed5["email"] is None or mureed5["email"] == "", "Email must be NULL in DB"
    print(f"Removed email for Mureed 2. Response email: {mureed5['email']}")

    # Mureed Management -> Still visible!
    r_mureeds5 = client.get(f"/api/mureeds/{id2}", headers=headers)
    assert r_mureeds5.status_code == 200, "Mureed record must NOT be deleted from Mureed Management"
    print("Mureed Management -> STILL VISIBLE (PASS)")

    # User Management -> Disappears!
    r_users5 = client.get("/api/users?role=all", headers=headers)
    user_emails5 = [u["email"].lower() for u in r_users5.json() if u.get("email")]
    assert added_email.lower() not in user_emails5, "Mureed 2 MUST NO LONGER appear in User Management after removing email"
    print("User Management -> DISAPPEARED / NOT VISIBLE (PASS)")

    # -------------------------------------------------------------------
    # TEST 6: Cleanup Test Data
    # -------------------------------------------------------------------
    print("\n--- TEST 6: Cleanup Test Data ---")
    client.delete(f"/api/mureeds/{id1}", headers=headers)
    client.delete(f"/api/mureeds/{id2}", headers=headers)
    print("Cleaned up temporary test Mureeds.")

    db.close()
    print("\n" + "=" * 70)
    print("  ALL USER MANAGEMENT VISIBILITY & TRANSITION TESTS PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
