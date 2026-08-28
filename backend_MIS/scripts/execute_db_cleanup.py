import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount, Mureed, AdminApprovalRequest, Peer
from app.config import get_settings
from app.security import hash_password

settings = get_settings()

db = SessionLocal()
try:
    print("=== Starting Database Cleanup ===")
    
    # 1. Delete all Mureed records
    mureeds_deleted = db.query(Mureed).delete(synchronize_session=False)
    print(f"Deleted {mureeds_deleted} Mureed records from 'mureeds' table.")

    # 2. Delete all non-Super Admin UserAccounts
    users_deleted = db.query(UserAccount).filter(UserAccount.email != settings.main_admin_email).delete(synchronize_session=False)
    print(f"Deleted {users_deleted} non-Super Admin user accounts from 'user_accounts' table.")

    # 3. Delete all AdminApprovalRequests
    requests_deleted = db.query(AdminApprovalRequest).delete(synchronize_session=False)
    print(f"Deleted {requests_deleted} approval requests from 'admin_approval_requests' table.")

    # 4. Ensure Super Admin account exists and has complete active credentials
    super_admin = db.query(UserAccount).filter(UserAccount.email == settings.main_admin_email).first()
    if not super_admin:
        super_admin = UserAccount(
            id="usr-main-admin",
            name="Main Admin",
            email=settings.main_admin_email,
            role="Admin",
            admin_role="MAIN_ADMIN",
            account_status="Active",
            admin_access_status="ACTIVE",
            auth_methods="password,google",
            password_hash=hash_password("Admin@123"),
            created_date="2026-01-01",
        )
        db.add(super_admin)
        print("Created fresh Super Admin account record.")
    else:
        super_admin.role = "Admin"
        super_admin.admin_role = "MAIN_ADMIN"
        super_admin.account_status = "Active"
        super_admin.admin_access_status = "ACTIVE"
        super_admin.password_hash = hash_password("Admin@123")
        print("Updated Super Admin account to ACTIVE status.")

    db.commit()

    # Final verification counts
    remaining_mureeds = db.query(Mureed).count()
    remaining_users = db.query(UserAccount).all()
    remaining_peers = db.query(Peer).count()

    print("\n=== Cleanup Complete Verification ===")
    print(f"Remaining Mureeds: {remaining_mureeds}")
    print(f"Remaining User Accounts ({len(remaining_users)} total):")
    for u in remaining_users:
        print(f"  - ID: {u.id} | Email: {u.email} | Role: {u.role} | AdminRole: {u.admin_role} | Status: {u.account_status}")
    print(f"Remaining Peers: {remaining_peers}")

finally:
    db.close()
