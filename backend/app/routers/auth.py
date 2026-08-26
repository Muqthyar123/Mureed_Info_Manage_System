import time
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import get_settings
from ..database import get_db
from ..mappers import approval_request_out, auth_user
from ..security import create_token, current_user, hash_password, normalize_email, require_main_admin, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def auth_response(user: models.UserAccount) -> schemas.AuthResponse:
    return schemas.AuthResponse(user=auth_user(user), accessToken=create_token({"sub": user.id, "role": user.role}))


@router.get("/me", response_model=schemas.AuthUser)
def me(user: models.UserAccount = Depends(current_user)):
    return auth_user(user)


@router.post("/logout", status_code=204)
def logout():
    return None


@router.post("/admin/login", response_model=schemas.AuthResponse)
def login_admin(input: schemas.EmailPasswordIn, db: Session = Depends(get_db)):
    email = normalize_email(input.email)
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == email, models.UserAccount.role == "Admin"))
    if not user or "password" not in user.auth_methods.split(",") or not verify_password(input.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid admin email or password.")
    if user.admin_access_status == "PENDING":
        raise HTTPException(status_code=403, detail="Your Admin account is waiting for Main Admin approval.")
    if user.admin_access_status == "REJECTED":
        raise HTTPException(status_code=403, detail="Your Admin access request has been rejected.")
    if user.account_status != "Active" or user.admin_access_status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Active Admin access required.")
    return auth_response(user)


@router.post("/mureed/login", response_model=schemas.AuthResponse)
def login_mureed(input: schemas.EmailPasswordIn, db: Session = Depends(get_db)):
    email = normalize_email(input.email)
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == email, models.UserAccount.role == "Mureed"))
    if not user or not verify_password(input.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid registered email or password.")
    if user.account_status != "Active":
        raise HTTPException(status_code=403, detail="This Mureed account is not active.")
    return auth_response(user)


@router.post("/password-reset", status_code=204)
def request_password_reset(input: schemas.PasswordResetIn):
    if not input.email.strip():
        raise HTTPException(status_code=400, detail="Please enter your email address.")


@router.post("/mureed/setup", status_code=204)
def complete_account_setup(input: schemas.AccountSetupIn, db: Session = Depends(get_db)):
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == normalize_email(input.email), models.UserAccount.role == "Mureed"))
    if not user:
        raise HTTPException(status_code=404, detail="Setup link is invalid.")
    if user.account_status == "Inactive":
        raise HTTPException(status_code=403, detail="This Mureed account is inactive.")
    user.password_hash = hash_password(input.password)
    user.account_status = "Active"
    db.commit()


@router.post("/admin/signup/start", response_model=schemas.PendingAdminSignupOut)
def start_admin_signup(input: schemas.AdminSignupStartIn, db: Session = Depends(get_db)):
    token = f"signup-{uuid.uuid4().hex}"
    expires_at = int((time.time() + get_settings().otp_ttl_seconds) * 1000)
    row = models.PendingAdminSignup(
        token=token,
        name=input.name.strip(),
        email=normalize_email(input.email),
        password_hash=hash_password(input.password),
        expires_at=expires_at,
    )
    db.add(row)
    db.commit()
    return schemas.PendingAdminSignupOut(name=row.name, email=row.email, passwordHash=row.token, expiresAt=row.expires_at)


@router.post("/admin/signup/resend", response_model=schemas.PendingAdminSignupOut)
def resend_admin_signup_otp(input: schemas.PendingAdminSignupOut, db: Session = Depends(get_db)):
    row = db.get(models.PendingAdminSignup, input.passwordHash)
    if not row:
        raise HTTPException(status_code=404, detail="Signup session was not found.")
    row.expires_at = int((time.time() + get_settings().otp_ttl_seconds) * 1000)
    db.commit()
    return schemas.PendingAdminSignupOut(name=row.name, email=row.email, passwordHash=row.token, expiresAt=row.expires_at)


@router.post("/admin/signup/verify", response_model=schemas.AdminSignupVerifyOut)
def verify_admin_signup_otp(input: schemas.AdminSignupVerifyIn, db: Session = Depends(get_db)):
    settings = get_settings()
    pending = db.get(models.PendingAdminSignup, input.signup.passwordHash)
    if not pending:
        raise HTTPException(status_code=404, detail="Signup session was not found.")
    if int(time.time() * 1000) > pending.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new OTP.")
    if input.otp != settings.demo_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    existing = db.scalar(select(models.UserAccount).where(models.UserAccount.email == pending.email, models.UserAccount.role == "Admin"))
    if existing and existing.admin_access_status == "ACTIVE":
        response = auth_response(existing)
        return schemas.AdminSignupVerifyOut(status="ACTIVE", user=response.user, accessToken=response.accessToken)
    if existing and existing.admin_access_status == "REJECTED":
        return schemas.AdminSignupVerifyOut(status="REJECTED")

    is_main_admin = pending.email == normalize_email(settings.main_admin_email)
    admin = existing or models.UserAccount(
        id=f"usr-admin-{uuid.uuid4().hex[:12]}",
        email=pending.email,
        role="Admin",
        account_status="Active",
        created_date=date.today().isoformat(),
    )
    admin.name = pending.name
    admin.admin_role = "MAIN_ADMIN" if is_main_admin else "ADMIN"
    admin.admin_access_status = "ACTIVE" if is_main_admin else "PENDING"
    admin.auth_methods = "password"
    admin.password_hash = pending.password_hash
    db.merge(admin)

    if not is_main_admin:
        request = models.AdminApprovalRequest(
            id=f"admin-req-{uuid.uuid4().hex[:12]}",
            name=pending.name,
            email=pending.email,
            status="PENDING",
            auth_method="password",
            requested_date=date.today().isoformat(),
        )
        db.add(request)
        db.delete(pending)
        db.commit()
        return schemas.AdminSignupVerifyOut(status="PENDING")

    db.delete(pending)
    db.commit()
    response = auth_response(admin)
    return schemas.AdminSignupVerifyOut(status="ACTIVE", user=response.user, accessToken=response.accessToken)


@router.post("/admin/google", response_model=schemas.AuthResponse)
def login_admin_with_google(input: schemas.EmailIn, db: Session = Depends(get_db)):
    email = normalize_email(input.email)
    if not email:
        raise HTTPException(status_code=400, detail="Please enter a mock Google email.")
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == email, models.UserAccount.role == "Admin"))
    if user and user.admin_access_status == "ACTIVE":
        methods = set(user.auth_methods.split(","))
        methods.add("google")
        user.auth_methods = ",".join(sorted(methods))
        db.commit()
        return auth_response(user)
    if user and user.admin_access_status == "REJECTED":
        raise HTTPException(status_code=403, detail="Your Admin access request has been rejected.")
    if user and user.admin_access_status == "PENDING":
        raise HTTPException(status_code=403, detail="Your Admin account is waiting for Main Admin approval.")

    is_main_admin = email == normalize_email(get_settings().main_admin_email)
    new_user = models.UserAccount(
        id=f"usr-admin-google-{uuid.uuid4().hex[:12]}",
        name="Main Admin" if is_main_admin else email.split("@")[0],
        email=email,
        role="Admin",
        account_status="Active",
        created_date=date.today().isoformat(),
        admin_role="MAIN_ADMIN" if is_main_admin else "ADMIN",
        admin_access_status="ACTIVE" if is_main_admin else "PENDING",
        auth_methods="google",
    )
    db.add(new_user)
    if not is_main_admin:
        db.add(
            models.AdminApprovalRequest(
                id=f"admin-req-{uuid.uuid4().hex[:12]}",
                name=new_user.name,
                email=email,
                status="PENDING",
                auth_method="google",
                requested_date=date.today().isoformat(),
            )
        )
        db.commit()
        raise HTTPException(
            status_code=403,
            detail="This Google account is not authorized for Admin access. Your request has been sent for approval.",
        )
    db.commit()
    return auth_response(new_user)


@router.get("/admin/approval-requests", response_model=list[schemas.AdminApprovalRequestOut])
def list_admin_approval_requests(_: models.UserAccount = Depends(require_main_admin), db: Session = Depends(get_db)):
    return [approval_request_out(row) for row in db.scalars(select(models.AdminApprovalRequest).order_by(models.AdminApprovalRequest.requested_date.desc())).all()]


@router.post("/admin/approval-requests/{request_id}/approve", status_code=204)
def approve_admin_request(request_id: str, _: models.UserAccount = Depends(require_main_admin), db: Session = Depends(get_db)):
    request = db.get(models.AdminApprovalRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Admin approval request was not found.")
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == request.email, models.UserAccount.role == "Admin"))
    if not user:
        user = models.UserAccount(
            id=f"usr-admin-{uuid.uuid4().hex[:12]}",
            name=request.name,
            email=request.email,
            role="Admin",
            account_status="Active",
            created_date=date.today().isoformat(),
            admin_role="ADMIN",
            auth_methods=request.auth_method,
        )
        db.add(user)
    user.admin_access_status = "ACTIVE"
    request.status = "APPROVED"
    db.commit()


@router.post("/admin/approval-requests/{request_id}/reject", status_code=204)
def reject_admin_request(request_id: str, _: models.UserAccount = Depends(require_main_admin), db: Session = Depends(get_db)):
    request = db.get(models.AdminApprovalRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Admin approval request was not found.")
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == request.email, models.UserAccount.role == "Admin"))
    if user:
        user.admin_access_status = "REJECTED"
    request.status = "REJECTED"
    db.commit()
