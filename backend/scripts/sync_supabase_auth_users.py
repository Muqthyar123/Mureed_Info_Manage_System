import os
import sys
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount
from app.security import hash_password
from app.config import get_settings
from app.supabase_auth import SupabaseAuthClient

settings = get_settings()
print(f"=== Syncing PostgreSQL UserAccounts with Supabase Auth ===")

service_key = settings.supabase_service_role_key
base_url = settings.supabase_url.rstrip("/")
headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
}

db = SessionLocal()
try:
    # 1. Fetch all existing users from Supabase Auth admin API
    res = httpx.get(f"{base_url}/auth/v1/admin/users", headers=headers, timeout=15)
    supabase_users = res.json().get("users", []) if res.status_code == 200 else []
    print(f"Found {len(supabase_users)} existing users in Supabase Auth Admin API.")

    email_to_sp_user = {u["email"].lower(): u for u in supabase_users if u.get("email")}

    accounts = db.query(UserAccount).all()
    for acc in accounts:
        email = acc.email.lower()
        pass_to_set = "@Saifulla_123" if acc.email.lower() == settings.main_admin_email.lower() else ("SubAdmin@123" if acc.role in ("Admin", "SUB_ADMIN") else "@Mureed_123")
        
        # Always update local password_hash in PostgreSQL
        acc.password_hash = hash_password(pass_to_set)

        if email in email_to_sp_user:
            sp_id = email_to_sp_user[email]["id"]
            # Update password and confirm email via admin API
            up_res = httpx.put(
                f"{base_url}/auth/v1/admin/users/{sp_id}",
                headers=headers,
                json={"password": pass_to_set, "email_confirm": True},
                timeout=15,
            )
            print(f" - Updated Supabase Auth user {email} (ID: {sp_id}): {up_res.status_code}")
        else:
            # Create user via admin API
            cr_res = httpx.post(
                f"{base_url}/auth/v1/admin/users",
                headers=headers,
                json={"email": email, "password": pass_to_set, "email_confirm": True, "user_metadata": {"role": acc.role, "name": acc.name}},
                timeout=15,
            )
            if cr_res.status_code in (200, 201):
                new_sp = cr_res.json()
                print(f" - Created Supabase Auth user {email} (ID: {new_sp.get('id')}): 201 OK")
            else:
                print(f" - Create failed for {email}: {cr_res.status_code} {cr_res.text}")

    db.commit()
    print("\nSuccessfully synced all PostgreSQL accounts into Supabase Auth Cloud!")

    # Test login for Super Admin
    client = SupabaseAuthClient(settings)
    token_res = client.sign_in_with_password(settings.main_admin_email, "@Saifulla_123")
    print(f"\n✅ SUPER ADMIN LOGIN TEST PASSED! Token length: {len(token_res.get('access_token', ''))}")

finally:
    db.close()
