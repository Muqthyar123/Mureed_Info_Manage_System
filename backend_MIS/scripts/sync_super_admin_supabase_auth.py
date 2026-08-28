import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import httpx
from app.config import get_settings

settings = get_settings()
print("SUPABASE_URL:", settings.supabase_url)
print("MAIN_ADMIN_EMAIL:", settings.main_admin_email)

headers = {
    "apikey": settings.supabase_service_role_key,
    "Authorization": f"Bearer {settings.supabase_service_role_key}",
    "Content-Type": "application/json",
}

# 1. Try to create user via admin endpoint
signup_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users"
resp = httpx.post(
    signup_url,
    headers=headers,
    json={
        "email": settings.main_admin_email,
        "password": "Admin@123",
        "email_confirm": True,
        "user_metadata": {"name": "Main Admin", "role": "SUPER_ADMIN"},
    },
    timeout=15,
)

print("Admin user creation status:", resp.status_code)
print("Response:", resp.text)

if resp.status_code >= 400:
    # If user already exists, list users to find user_id and update password
    list_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users"
    list_resp = httpx.get(list_url, headers=headers, timeout=15)
    if list_resp.status_code == 200:
        users = list_resp.json().get("users", [])
        matched = [u for u in users if u.get("email") == settings.main_admin_email]
        if matched:
            user_id = matched[0]["id"]
            print(f"Found existing Supabase Auth user ID: {user_id}. Updating password...")
            update_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}"
            up_resp = httpx.put(
                update_url,
                headers=headers,
                json={"password": "Admin@123", "email_confirm": True},
                timeout=15,
            )
            print("Password update status:", up_resp.status_code)
            print("Update response:", up_resp.text)
