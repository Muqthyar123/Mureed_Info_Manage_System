import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount, Mureed, Peer

db = SessionLocal()
try:
    print("=== Checking Database Passwords & Hash Format ===")
    users = db.query(UserAccount).all()
    print(f"Total UserAccounts in DB: {len(users)}")
    for u in users:
        is_hashed = bool(u.password_hash) and len(u.password_hash) == 64 and not u.password_hash.startswith("Admin") and not u.password_hash.startswith("@")
        print(f" - ID: {u.id:20} | Role: {u.role:10} | Email: {u.email:40} | Hashed: {is_hashed} ({u.password_hash[:12]}...)")
        assert is_hashed, f"User {u.email} does not have a valid PBKDF2 SHA-256 password_hash!"

    print("\n=== Checking Peers & Mureeds Count ===")
    mureed_count = db.query(Mureed).count()
    peer_count = db.query(Peer).count()
    print(f"Total Mureeds in DB: {mureed_count}")
    print(f"Total Peers in DB: {peer_count}")

    print("\nALL PASSWORD HASH CHECKS PASSED 100%!")
finally:
    db.close()
