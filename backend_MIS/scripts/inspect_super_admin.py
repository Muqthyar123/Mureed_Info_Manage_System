import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount, AdminApprovalRequest
from app.config import get_settings

settings = get_settings()
print("MAIN_ADMIN_EMAIL in settings:", settings.main_admin_email)
print("AUTH_BACKEND in settings:", settings.auth_backend)

db = SessionLocal()
try:
    super_admin = db.query(UserAccount).filter(UserAccount.email == settings.main_admin_email).first()
    if super_admin:
        print("\n--- Super Admin Record in user_accounts ---")
        print("ID:", super_admin.id)
        print("Name:", super_admin.name)
        print("Email:", super_admin.email)
        print("Role:", super_admin.role)
        print("Admin Role:", super_admin.admin_role)
        print("Status:", super_admin.account_status)
        print("Has Password Hash:", bool(super_admin.password_hash))
    else:
        print("\n❌ Super Admin record NOT FOUND in user_accounts table for:", settings.main_admin_email)
        print("All users in user_accounts:")
        users = db.query(UserAccount).all()
        for u in users:
            print(f" - {u.id} | {u.email} | {u.role} | {u.admin_role} | {u.status}")
finally:
    db.close()
