import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount, Mureed

db = SessionLocal()
try:
    print("--- Mureed UserAccounts in DB ---")
    mureed_users = db.query(UserAccount).filter(UserAccount.role == "Mureed").limit(10).all()
    print(f"Total Mureed UserAccounts found: {db.query(UserAccount).filter(UserAccount.role == 'Mureed').count()}")
    for u in mureed_users:
        print(f"ID: {u.id} | Email: {u.email} | Status: {u.account_status} | Has Hash: {bool(u.password_hash)} | MureedID: {u.mureed_id}")

    print("\n--- Recent Mureeds in DB ---")
    mureeds = db.query(Mureed).order_by(Mureed.id.desc()).limit(5).all()
    for m in mureeds:
        acc = db.query(UserAccount).filter(UserAccount.mureed_id == m.id).first()
        print(f"Mureed ID: {m.id} | Name: {m.name} | Email: {m.email} | Acc Status: {acc.account_status if acc else 'NO_USER_ACCOUNT'}")
finally:
    db.close()
