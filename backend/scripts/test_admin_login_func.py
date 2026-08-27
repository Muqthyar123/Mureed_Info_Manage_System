import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount
from app.config import get_settings
from app.supabase_auth import SupabaseAuthClient
from app.security import verify_password

settings = get_settings()
print("AUTH_BACKEND:", settings.auth_backend)

db = SessionLocal()
try:
    user = db.query(UserAccount).filter(UserAccount.email == settings.main_admin_email).first()
    print("User found:", user.email if user else "None")
    
    # 1. Local password check
    if user and user.password_hash:
        match = verify_password("Admin@123", user.password_hash)
        print("Local Password Check for 'Admin@123':", match)
    
    # 2. Supabase Auth check if AUTH_BACKEND=supabase
    if settings.auth_backend == "supabase":
        client = SupabaseAuthClient(settings)
        try:
            auth_res = client.sign_in_with_password(settings.main_admin_email, "Admin@123")
            print("Supabase Auth login SUCCESS. User ID:", auth_res.get("user", {}).get("id"))
        except Exception as e:
            print("Supabase Auth login FAILED:", str(e))

finally:
    db.close()
