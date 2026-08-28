import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount, Mureed, Peer, AdminApprovalRequest
from app.security import hash_password
from app.config import get_settings
from app.supabase_auth import SupabaseAuthClient

settings = get_settings()
print(f"=== Inspecting MIMS Real-World Database & Auth State ===")
print(f"Auth Backend: {settings.auth_backend}")
print(f"Use Supabase Auth: {settings.use_supabase_auth}")

db = SessionLocal()
try:
    # 1. Inspect existing UserAccounts
    users = db.query(UserAccount).all()
    print(f"\nTotal UserAccounts in PostgreSQL: {len(users)}")
    for u in users:
        print(f" - ID: {u.id:36} | Role: {u.role:10} | AdminRole: {str(u.admin_role):10} | Status: {u.account_status:8} | Email: {u.email}")

    # 2. Check Super Admin
    super_admin_email = settings.main_admin_email.lower()
    super_admin_pass = "@Saifulla_123"
    
    super_admin = db.query(UserAccount).filter(UserAccount.email.ilike(super_admin_email)).first()
    if not super_admin:
        print(f"\nCreating Super Admin {super_admin_email} in PostgreSQL...")
        super_admin = UserAccount(
            id="usr-main-admin",
            name="Main Admin",
            email=super_admin_email,
            role="Admin",
            admin_role="MAIN_ADMIN",
            account_status="Active",
            admin_access_status="ACTIVE",
            created_date="2026-08-27",
            password_hash=hash_password(super_admin_pass),
            auth_methods="password",
        )
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
    else:
        super_admin.password_hash = hash_password(super_admin_pass)
        super_admin.role = "Admin"
        super_admin.admin_role = "MAIN_ADMIN"
        super_admin.account_status = "Active"
        super_admin.admin_access_status = "ACTIVE"
        db.commit()
        print(f"\nUpdated Super Admin {super_admin_email} in PostgreSQL with password @Saifulla_123")

    # 3. Ensure Super Admin exists in Supabase Auth cloud with password @Saifulla_123
    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        print("\nSyncing Super Admin into Supabase Auth Cloud...")
        try:
            res = client.sign_in_with_password(super_admin_email, super_admin_pass)
            print(f" - Super Admin signed in cleanly to Supabase Auth! Token length: {len(res.get('access_token', ''))}")
        except Exception as e1:
            print(f" - Super Admin sign-in failed ({e1}), attempting update/signup in Supabase Auth...")
            try:
                # Try updating password via service role
                client.update_user_password(super_admin.id, super_admin_pass)
                res = client.sign_in_with_password(super_admin_email, super_admin_pass)
                print(f" - Updated Super Admin password in Supabase Auth! Token length: {len(res.get('access_token', ''))}")
            except Exception as e2:
                print(f" - Update failed ({e2}), creating user in Supabase Auth...")
                try:
                    res_signup = client.sign_up_with_password(super_admin_email, super_admin_pass, data={"role": "Admin", "admin_role": "MAIN_ADMIN"})
                    print(" - Created Super Admin user in Supabase Auth!")
                except Exception as e3:
                    print(f" - Sign up exception: {e3}")

    # 4. Check Mureed & Peer counts
    mureeds_count = db.query(Mureed).count()
    peers_count = db.query(Peer).count()
    print(f"\nReal PostgreSQL Counts: Mureeds={mureeds_count}, Peers={peers_count}")

finally:
    db.close()
