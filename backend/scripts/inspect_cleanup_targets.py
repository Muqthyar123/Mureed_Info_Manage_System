import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount, Mureed, AdminApprovalRequest, Peer
from app.config import get_settings

settings = get_settings()

db = SessionLocal()
try:
    total_mureeds = db.query(Mureed).count()
    total_users = db.query(UserAccount).count()
    non_superadmin_users = db.query(UserAccount).filter(UserAccount.email != settings.main_admin_email).count()
    superadmin_users = db.query(UserAccount).filter(UserAccount.email == settings.main_admin_email).count()
    total_approval_requests = db.query(AdminApprovalRequest).count()
    total_peers = db.query(Peer).count()

    print("--- DB Cleanup Target Summary ---")
    print(f"Total Mureeds to delete: {total_mureeds}")
    print(f"Total User Accounts: {total_users}")
    print(f"Super Admin accounts to KEEP ({settings.main_admin_email}): {superadmin_users}")
    print(f"Non-Super Admin accounts to DELETE: {non_superadmin_users}")
    print(f"Total Admin Approval Requests to DELETE: {total_approval_requests}")
    print(f"Total Peers to KEEP: {total_peers}")

finally:
    db.close()
