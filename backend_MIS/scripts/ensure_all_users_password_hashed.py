import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount
from app.security import hash_password
from app.config import get_settings

settings = get_settings()

db = SessionLocal()
try:
    users = db.query(UserAccount).all()
    print(f"Checking {len(users)} UserAccounts in database...")
    for u in users:
        if not u.password_hash:
            if u.email.lower() == settings.main_admin_email.lower():
                u.password_hash = hash_password("Admin@123")
            elif u.role in ("Admin", "SUB_ADMIN", "SUPER_ADMIN"):
                u.password_hash = hash_password("SubAdmin@123")
            else:
                u.password_hash = hash_password("@Mureed_123")
            print(f" - Hashed password for {u.email} ({u.role})")
    db.commit()
    print("All UserAccounts now store passwords in PBKDF2 SHA-256 hash format!")
finally:
    db.close()
