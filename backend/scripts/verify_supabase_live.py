import os
import sys
import io
import openpyxl

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure MIMS_AUTH_BACKEND=local for FastAPI test client calls against local SQLAlchemy session
os.environ["MIMS_AUTH_BACKEND"] = "local"
os.environ["MIMS_ENV"] = "development"

from app.config import get_settings
get_settings.cache_clear()

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine
from app import models
from sqlalchemy import select, func, inspect

client = TestClient(app)

def run_live_supabase_verification():
    print("==================================================")
    print("     MIMS SUPABASE POSTGRESQL LIVE VERIFICATION   ")
    print("==================================================\n")

    settings = get_settings()
    print(f"Database Engine Dialect: {engine.dialect.name}")
    assert engine.dialect.name == "postgresql", "Error: Database engine must be PostgreSQL!"

    # 1. LIVE POSTGRESQL API TEST & 10,000 MUREED PAGINATION TEST
    print("\n--- 1. Testing GET /api/mureeds (Pagination & Total Count) ---")
    # Log in as Main Admin
    admin_login = client.post("/api/auth/admin/login", json={"email": settings.main_admin_email, "password": "Admin@123"})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    token = admin_login.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    res_mureeds = client.get("/api/mureeds?page=1&pageSize=50", headers=headers)
    assert res_mureeds.status_code == 200
    data_mureeds = res_mureeds.json()
    print(f"Total Mureeds in PostgreSQL: {data_mureeds['total']}")
    print(f"Page size returned: {len(data_mureeds['rows'])}")
    assert data_mureeds["total"] >= 10000
    assert len(data_mureeds["rows"]) == 50

    # 2. LIVE FILTER TESTS
    print("\n--- 2. Testing Live Filters (Peer, Gender, Status, Location, Search) ---")
    res_filter = client.get("/api/mureeds?gender=Female&status=Available&peerName=Qadri&page=1&pageSize=10", headers=headers)
    assert res_filter.status_code == 200
    filter_rows = res_filter.json()["rows"]
    print(f"Filtered records count (Female, Available, Qadri): {res_filter.json()['total']}")
    for row in filter_rows:
        assert row["gender"] == "Female"
        assert row["status"] == "Available"
        assert row["peerName"] == "Qadri"
        assert isinstance(row["age"], int)

    res_search = client.get("/api/mureeds?search=Junaid", headers=headers)
    assert res_search.status_code == 200
    print(f"Search results for 'Junaid': {res_search.json()['total']} matches found")

    res_locations = client.get("/api/mureeds/locations", headers=headers)
    assert res_locations.status_code == 200
    locations = res_locations.json()
    print(f"Extracted Unique Locations: {locations[:5]}... (Total: {len(locations)})")

    # 3. LIVE MUREED CRUD TEST (Temporary Record)
    print("\n--- 3. Testing Mureed CRUD (Temporary Record) ---")
    temp_mureed = {
        "name": "Live Test Mureed",
        "dateOfBirth": "1999-09-09",
        "gender": "Male",
        "address": "456 Test Street, Hyderabad",
        "phone": "9988776655",
        "email": "livetest.mureed@example.com",
        "peerName": "Qadri",
        "status": "Available",
    }
    create_res = client.post("/api/mureeds", headers=headers, json=temp_mureed)
    assert create_res.status_code == 200
    created_id = create_res.json()["id"]
    print(f"Created temporary Mureed ID: {created_id}")

    get_res = client.get(f"/api/mureeds/{created_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["email"] == "livetest.mureed@example.com"

    update_res = client.put(f"/api/mureeds/{created_id}", headers=headers, json={**temp_mureed, "name": "Live Test Mureed Updated"})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Live Test Mureed Updated"

    del_res = client.delete(f"/api/mureeds/{created_id}", headers=headers)
    assert del_res.status_code in (200, 204)
    print(f"Deleted temporary Mureed ID: {created_id} (Status: {del_res.status_code})")

    # 4. PEER CRUD & 409 CONFLICT TEST
    print("\n--- 4. Testing Peer Delete Blocked on Assigned Mureeds (409 Conflict) ---")
    res_peer_del = client.delete("/api/peers/mr-1", headers=headers)
    print(f"Delete assigned Peer (mr-1) status: {res_peer_del.status_code}")
    assert res_peer_del.status_code == 409
    assert "Mureeds are currently assigned" in res_peer_del.json()["detail"]

    # 5. EXPORT TEST (CSV & Excel Column Order & Exclusions)
    print("\n--- 5. Testing Filtered CSV and Excel Exports ---")
    res_csv = client.get("/api/exports/mureeds?format=csv&gender=Female", headers=headers)
    assert res_csv.status_code == 200
    csv_text = res_csv.content.decode("utf-8-sig")
    csv_header = csv_text.splitlines()[0]
    expected_header = "Mureed Name,Date of Birth,Age,Gender,Address,Phone Number,Email,Peer Name,Mureed Status"
    assert csv_header == expected_header
    assert "password" not in csv_text.lower()
    print("CSV Header verified:", csv_header)

    res_xlsx = client.get("/api/exports/mureeds?format=xlsx&gender=Female", headers=headers)
    assert res_xlsx.status_code == 200
    wb = openpyxl.load_workbook(filename=io.BytesIO(res_xlsx.content))
    ws = wb.active
    excel_header = [cell.value for cell in ws[1]]
    assert ",".join(excel_header) == expected_header
    print("Excel Header verified:", ",".join(excel_header))

    # 6. REPORTS OVERVIEW TEST
    print("\n--- 6. Testing GET /api/reports/overview ---")
    res_overview = client.get("/api/reports/overview", headers=headers)
    assert res_overview.status_code == 200
    overview = res_overview.json()
    print("Overview Metrics:", overview)
    assert "totalMureeds" in overview
    assert "availableMureeds" in overview
    assert "passedOutMureeds" in overview
    assert "totalPeer" in overview

    # 7. AUTHORIZATION & DATA ISOLATION TEST
    print("\n--- 7. Testing Mureed Data Isolation ---")
    # Login as Mureed 2
    mureed2 = client.get("/api/mureeds/MRD-00002", headers=headers).json()
    mureed_login = client.post("/api/auth/mureed/login", json={"email": mureed2["email"], "password": "mureed123"})
    assert mureed_login.status_code == 200
    mureed_headers = {"Authorization": f"Bearer {mureed_login.json()['accessToken']}"}

    # Mureed reading own record -> 200
    assert client.get("/api/mureeds/me", headers=mureed_headers).status_code == 200
    # Mureed reading another Mureed -> 403 Forbidden
    forbidden_get = client.get("/api/mureeds/MRD-00003", headers=mureed_headers)
    assert forbidden_get.status_code == 403
    print("Data Isolation Verified: Mureed access to another record returned 403 Forbidden")

    # 8. POSTGRESQL INDEX AUDIT
    print("\n--- 8. Auditing PostgreSQL Table Indexes ---")
    inspector = inspect(engine)
    indexes = {idx['name']: idx['column_names'] for idx in inspector.get_indexes('mureeds')}
    print("Indexes on 'mureeds' table:")
    for idx_name, cols in indexes.items():
        print(f" - {idx_name}: {cols}")
    assert any("email" in cols for cols in indexes.values())
    assert any("phone" in cols for cols in indexes.values())
    assert any("peer_id" in cols for cols in indexes.values())

    print("\n==================================================")
    print(" ALL LIVE SUPABASE POSTGRESQL API TESTS PASSED 100%")
    print("==================================================")

if __name__ == "__main__":
    run_live_supabase_verification()
