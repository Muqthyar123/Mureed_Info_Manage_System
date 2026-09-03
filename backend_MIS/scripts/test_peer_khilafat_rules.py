import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import uuid
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.security import create_token
from app import models, mappers

def run_tests():
    print("=" * 70)
    print("  RUNNING PEER KHILAFAT & DOB FUNCTIONALITY TEST SUITE")
    print("=" * 70)

    db = SessionLocal()

    admin_user = db.query(models.UserAccount).filter(models.UserAccount.role.in_(["Admin", "SUPER_ADMIN"])).first()
    if not admin_user:
        print("ERROR: No admin user found for testing.")
        sys.exit(1)

    token = create_token({"sub": admin_user.id, "email": admin_user.email, "role": admin_user.role, "admin_role": admin_user.admin_role})
    headers = {"Authorization": f"Bearer {token}"}

    client = TestClient(app)

    # -------------------------------------------------------------------
    # TEST 1: Add Peer with DOB
    # -------------------------------------------------------------------
    print("\n--- TEST 1: Add Peer with DOB ---")
    dob1 = "1980-08-15"
    payload1 = {
        "name": f"Test Peer Alpha",
        "dateOfBirth": dob1,
        "status": "Active"
    }
    resp1 = client.post("/api/peers", json=payload1, headers=headers)
    assert resp1.status_code == 200, f"Failed create peer: {resp1.text}"
    peer1 = resp1.json()
    peer_id = peer1["id"]
    print(f"Created Peer ID: {peer_id} | Name: {peer1['name']} | DOB: {peer1['dateOfBirth']} | Khilafat: {peer1['khilafat']}")
    assert peer1["dateOfBirth"] == dob1
    assert "years" in peer1["khilafat"], f"Khilafat should be calculated, got: {peer1['khilafat']}"

    # -------------------------------------------------------------------
    # TEST 2: Edit Peer and change DOB
    # -------------------------------------------------------------------
    print("\n--- TEST 2: Edit Peer and Change DOB ---")
    dob2 = "1975-08-15"
    payload2 = {
        "name": peer1["name"],
        "dateOfBirth": dob2,
        "status": "Active"
    }
    resp2 = client.put(f"/api/peers/{peer_id}", json=payload2, headers=headers)
    assert resp2.status_code == 200, f"Failed update peer: {resp2.text}"
    peer2 = resp2.json()
    assert peer2["id"] == peer_id, "Same Peer ID must be preserved"
    assert peer2["dateOfBirth"] == dob2
    print(f"Updated Peer ID: {peer2['id']} | New DOB: {peer2['dateOfBirth']} | New Khilafat: {peer2['khilafat']}")

    # -------------------------------------------------------------------
    # TEST 3: Existing Peer without DOB displays "—"
    # -------------------------------------------------------------------
    print("\n--- TEST 3: Peer without DOB displays '—' ---")
    payload3 = {
        "name": f"Test Peer Beta",
        "dateOfBirth": None,
        "status": "Active"
    }
    resp3 = client.post("/api/peers", json=payload3, headers=headers)
    assert resp3.status_code == 200, f"Failed create peer without DOB: {resp3.text}"
    peer3 = resp3.json()
    peer_id3 = peer3["id"]
    print(f"Created Peer 3 ID: {peer_id3} | DOB: {peer3['dateOfBirth']} | Khilafat: {peer3['khilafat']}")
    assert peer3["khilafat"] == "—", "Khilafat should be '—' when DOB is missing"

    # -------------------------------------------------------------------
    # TEST 4: Enter Future DOB (Validation Error)
    # -------------------------------------------------------------------
    print("\n--- TEST 4: Future DOB Validation ---")
    future_dob = "2099-01-01"
    payload4 = {
        "name": "Future Peer",
        "dateOfBirth": future_dob,
        "status": "Active"
    }
    resp4 = client.post("/api/peers", json=payload4, headers=headers)
    assert resp4.status_code == 422, f"Future DOB should fail validation with HTTP 422, got: {resp4.status_code}"
    print("Future DOB rejected with HTTP 422 validation error as expected.")

    # -------------------------------------------------------------------
    # TEST 5 & 6: Khilafat Birthday Calculation Accuracy
    # -------------------------------------------------------------------
    print("\n--- TEST 5 & 6: Birthday Calculation Accuracy ---")
    today = date.today()
    
    # DOB past birthday this year
    dob_past_birthday = f"1990-01-01"
    khil_past = mappers.calculate_khilafat(dob_past_birthday)
    expected_past_years = today.year - 1990
    print(f"DOB: {dob_past_birthday} | Calculated: {khil_past} | Expected: {expected_past_years} years")
    assert khil_past == f"{expected_past_years} years"

    # DOB before birthday this year (e.g. Dec 31)
    dob_future_birthday = f"1990-12-31"
    khil_future_bday = mappers.calculate_khilafat(dob_future_birthday)
    expected_future_years = today.year - 1990 - 1 if (today.month, today.day) < (12, 31) else today.year - 1990
    print(f"DOB: {dob_future_birthday} | Calculated: {khil_future_bday} | Expected: {expected_future_years} years")
    assert khil_future_bday == f"{expected_future_years} years"

    # -------------------------------------------------------------------
    # TEST 7: Number of Mureeds Relationship Intact
    # -------------------------------------------------------------------
    print("\n--- TEST 7: Number of Mureeds Relationship ---")
    r_list = client.get("/api/peers", headers=headers)
    assert r_list.status_code == 200
    peers_data = r_list.json()
    gafoor = next((p for p in peers_data if p["name"] == "Gafoor Allah"), None)
    if gafoor:
        print(f"Peer 'Gafoor Allah' | Mureed Count: {gafoor['mureedCount']} | Khilafat: {gafoor['khilafat']}")
        assert gafoor["mureedCount"] >= 0

    # -------------------------------------------------------------------
    # TEST 8: Cleanup Test Data
    # -------------------------------------------------------------------
    print("\n--- TEST 8: Cleanup Test Data ---")
    client.delete(f"/api/peers/{peer_id}", headers=headers)
    client.delete(f"/api/peers/{peer_id3}", headers=headers)
    print("Cleaned up temporary test Peers.")

    db.close()
    print("\n" + "=" * 70)
    print("  ALL PEER KHILAFAT & DOB TESTS PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
