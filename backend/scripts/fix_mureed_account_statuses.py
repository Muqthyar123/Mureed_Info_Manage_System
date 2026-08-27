import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount

db = SessionLocal()
try:
    pending_mureeds = db.query(UserAccount).filter(
        UserAccount.role == "Mureed",
        UserAccount.account_status == "Pending Setup"
    ).all()
    
    print(f"Found {len(pending_mureeds)} Mureed accounts with status 'Pending Setup'. Updating to 'Active'...")
    for u in pending_mureeds:
        u.account_status = "Active"
        print(f" - Updated: {u.id} | {u.email}")
        
    db.commit()
    print("All Mureed account statuses updated to 'Active' successfully.")
finally:
    db.close()
