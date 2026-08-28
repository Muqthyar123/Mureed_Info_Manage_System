import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import UserAccount, AdminApprovalRequest
from app.config import get_settings
from app.routers.auth import signup_sub_admin, approve_admin_request, login_sub_admin
from app.schemas import SubAdminSignupIn, EmailPasswordIn

db = SessionLocal()
test_email = "test.subadmin99@mims.app"
test_name = "Test SubAdmin"
test_pw = "SubAdmin@123"

try:
    print("=== Testing Sub Admin Signup, Approval, and Login Flow ===")
    
    # Clean up existing test records if any
    db.query(UserAccount).filter(UserAccount.email == test_email).delete()
    db.query(AdminApprovalRequest).filter(AdminApprovalRequest.email == test_email).delete()
    db.commit()

    # 1. Signup
    signup_in = SubAdminSignupIn(name=test_name, email=test_email, password=test_pw)
    signup_res = signup_sub_admin(signup_in, db=db)
    print("1. Signup Result:", signup_res)

    # Verify user record in DB
    user_db = db.query(UserAccount).filter(UserAccount.email == test_email).first()
    req_db = db.query(AdminApprovalRequest).filter(AdminApprovalRequest.email == test_email).first()
    print("   DB User Status:", user_db.admin_access_status if user_db else "None")
    print("   DB User Has Password Hash:", bool(user_db.password_hash) if user_db else False)
    print("   DB Request Status:", req_db.status if req_db else "None")

    # 2. Approve Request
    print("\n2. Approving Request ID:", req_db.id)
    # mock super admin user
    super_admin = db.query(UserAccount).filter(UserAccount.email == get_settings().main_admin_email).first()
    approve_admin_request(req_db.id, _=super_admin, db=db)

    db.refresh(user_db)
    db.refresh(req_db)
    print("   Post-Approval DB User Status:", user_db.admin_access_status)
    print("   Post-Approval DB Request Status:", req_db.status)

    # 3. Login
    print("\n3. Attempting Sub Admin Login with password:", test_pw)
    login_in = EmailPasswordIn(email=test_email, password=test_pw)
    login_res = login_sub_admin(login_in, db=db)
    print("   Login SUCCESS!")
    print("   User Role:", login_res.user.role)
    print("   Admin Role:", login_res.user.adminRole)
    print("   Has Access Token:", bool(login_res.accessToken))

finally:
    # Cleanup test data
    db.query(UserAccount).filter(UserAccount.email == test_email).delete()
    db.query(AdminApprovalRequest).filter(AdminApprovalRequest.email == test_email).delete()
    db.commit()
    db.close()
