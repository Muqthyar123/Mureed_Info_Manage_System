import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, SessionLocal
from app.config import get_settings
from app.security import create_token
from app import models

def run_tests():
    print("=" * 60)
    print("  RUNNING OPTIONAL EMAIL & TRANSITION TEST SUITE")
    print("=" * 60)

    db = SessionLocal()
    settings = get_settings()

    # Get admin user for auth header
    admin_user = db.query(models.UserAccount).filter(models.UserAccount.role.in_(["Admin", "SUPER_ADMIN"])).first()
    if not admin_user:
        print("ERROR: No admin user found for testing.")
        sys.exit(1)

    token = create_token({"sub": admin_user.id, "email": admin_user.email, "role": admin_user.role, "admin_role": admin_user.admin_role})
    headers = {"Authorization": f"Bearer {token}"}

    client = TestClient(app)

    # ----------------------------------------------------
    # TEST 1: Create Mureed without Email (Phone only)
    # ----------------------------------------------------
    print("\n--- TEST 1: Create Mureed without Email ---")
    payload1 = {
        "name": "Test NoEmail Mureed",
        "dateOfBirth": "1995-05-15",
        "gender": "Male",
        "address": "123 Test Street",
        "phone": "9876543210",
        "email": "",
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp1 = client.post("/api/mureeds", json=payload1, headers=headers)
    assert resp1.status_code == 200, f"Failed create no-email: {resp1.text}"
    mureed1 = resp1.json()
    mureed_id = mureed1["id"]
    print(f"Created Mureed ID: {mureed_id} | Email in response: '{mureed1['email']}' | Message: '{mureed1['message']}'")
    assert mureed1["email"] is None or mureed1["email"] == "", "Email should be None/empty"
    assert "No email was provided" in mureed1["message"]

    # Verify DB state directly
    db_mureed = db.query(models.Mureed).filter(models.Mureed.id == mureed_id).first()
    assert db_mureed is not None, "Mureed record missing in DB"
    assert db_mureed.email is None, "DB email must be NULL"

    # Verify UserAccount is NOT created for email-less mureed
    db_user = db.query(models.UserAccount).filter(models.UserAccount.mureed_id == mureed_id).first()
    assert db_user is None, "UserAccount should not exist for email-less Mureed"

    # ----------------------------------------------------
    # TEST 2: Edit Mureed fields while email remains NULL
    # ----------------------------------------------------
    print("\n--- TEST 2: Edit Mureed fields while Email remains NULL ---")
    payload2 = {
        "name": "Test NoEmail Mureed Updated",
        "dateOfBirth": "1995-05-15",
        "gender": "Male",
        "address": "456 Updated Street",
        "phone": "9876543211",
        "email": "",
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp2 = client.put(f"/api/mureeds/{mureed_id}", json=payload2, headers=headers)
    assert resp2.status_code == 200, f"Failed update: {resp2.text}"
    mureed2 = resp2.json()
    print(f"Updated Mureed ID: {mureed2['id']} | Address: {mureed2['address']} | Message: '{mureed2['message']}'")
    assert mureed2["id"] == mureed_id, "Mureed ID must not change"
    assert mureed2["address"] == "456 Updated Street", "Address should be updated"

    # ----------------------------------------------------
    # TEST 3: Add Email Later (NULL -> Valid Email Transition)
    # ----------------------------------------------------
    print("\n--- TEST 3: Add Email Later (NULL -> Valid Email) ---")
    new_email = f"added_later_{uuid.uuid4().hex[:6]}@mims.app"
    payload3 = {
        "name": "Test NoEmail Mureed Updated",
        "dateOfBirth": "1995-05-15",
        "gender": "Male",
        "address": "456 Updated Street",
        "phone": "9876543211",
        "email": new_email,
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp3 = client.put(f"/api/mureeds/{mureed_id}", json=payload3, headers=headers)
    assert resp3.status_code == 200, f"Failed adding email: {resp3.text}"
    mureed3 = resp3.json()
    print(f"Updated Mureed ID: {mureed3['id']} | New Email: {mureed3['email']} | Message: '{mureed3['message']}'")
    assert mureed3["id"] == mureed_id, "SAME Mureed ID must be preserved"
    assert mureed3["email"] == new_email, "Email in DB must be updated to new email"
    assert "Login credentials have been sent" in mureed3["message"] or "login email could not be sent" in mureed3["message"]

    # Verify UserAccount NOW exists and is linked
    db.expire_all()
    db_user_after = db.query(models.UserAccount).filter(models.UserAccount.mureed_id == mureed_id).first()
    assert db_user_after is not None, "UserAccount should now exist after adding email"
    assert db_user_after.email == new_email, "UserAccount email should match"

    # ----------------------------------------------------
    # TEST 4: Edit Again Without Changing Email (Case 3)
    # ----------------------------------------------------
    print("\n--- TEST 4: Edit Again Without Changing Email ---")
    payload4 = {
        "name": "Test NoEmail Mureed Renamed",
        "dateOfBirth": "1995-05-15",
        "gender": "Male",
        "address": "456 Updated Street",
        "phone": "9876543211",
        "email": new_email,
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp4 = client.put(f"/api/mureeds/{mureed_id}", json=payload4, headers=headers)
    assert resp4.status_code == 200, f"Failed update same email: {resp4.text}"
    mureed4 = resp4.json()
    print(f"Updated Name: {mureed4['name']} | Message: '{mureed4['message']}'")
    assert mureed4["name"] == "Test NoEmail Mureed Renamed"
    assert mureed4["message"] == "Mureed details updated successfully."

    # ----------------------------------------------------
    # TEST 5: Duplicate Email Rejection (409 Conflict)
    # ----------------------------------------------------
    print("\n--- TEST 5: Duplicate Email Rejection ---")
    payload5 = {
        "name": "Another Mureed",
        "dateOfBirth": "1990-01-01",
        "gender": "Female",
        "address": "789 Other Road",
        "phone": "9876543212",
        "email": new_email, # Duplicate!
        "peerName": "Khadariya",
        "status": "Available"
    }
    resp5 = client.post("/api/mureeds", json=payload5, headers=headers)
    assert resp5.status_code == 409, f"Should fail 409 for duplicate email, got: {resp5.status_code}"
    print("409 Conflict returned as expected for duplicate email.")

    # ----------------------------------------------------
    # TEST 6: Cleanup
    # ----------------------------------------------------
    print("\n--- TEST 6: Cleanup Test Data ---")
    resp_del = client.delete(f"/api/mureeds/{mureed_id}", headers=headers)
    assert resp_del.status_code == 204, f"Delete failed: {resp_del.status_code}"
    print(f"Deleted temporary test Mureed {mureed_id}.")

    db.close()
    print("\n" + "=" * 60)
    print("  ALL OPTIONAL EMAIL & TRANSITION TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
