import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings
from app.supabase_auth import SupabaseAuthClient

settings = get_settings()
client = SupabaseAuthClient(settings)

print("Testing sign_in_with_password...")
res = client.sign_in_with_password(settings.main_admin_email, "@Saifulla_123")
token = res["access_token"]
print(f"Token: {token[:30]}... (Length: {len(token)})")

print("Testing get_user with access_token...")
import httpx
r = httpx.get(f"{settings.supabase_url.rstrip('/')}/auth/v1/user", headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"})
print(f"GET /auth/v1/user Response Status: {r.status_code}")
print(f"GET /auth/v1/user Response Body: {r.text}")
