import time
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import get_settings
from ..database import get_db
from ..mappers import approval_request_out, auth_user
from ..security import create_token, current_user, hash_password, normalize_email, require_main_admin, verify_password
from ..supabase_auth import SupabaseAuthClient

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
    settings = get_settings()

    user = db.scalar(
        select(models.UserAccount).where(
            models.UserAccount.email == email,
            or_(models.UserAccount.role == "Admin", models.UserAccount.role == "SUPER_ADMIN", models.UserAccount.role == "SUB_ADMIN"),
        )
    )

    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        access_token = None
        try:
            res = client.sign_in_with_password(email, input.password)
            access_token = res.get("access_token")
        except Exception:
            # Fallback to local DB password check if Supabase Auth credentials are not synced yet
            if user and user.password_hash and verify_password(input.password, user.password_hash):
                try:
                    # Sync password into Supabase Auth
                    client.update_user_password(user.id, input.password)
                    res = client.sign_in_with_password(email, input.password)
                    access_token = res.get("access_token")
                except Exception:
                    pass

        if not user:
            raise HTTPException(status_code=400, detail="Invalid admin email or password.")
        if user.admin_access_status == "PENDING":
            raise HTTPException(status_code=403, detail="Your Admin account is waiting for Main Admin approval.")
        if user.admin_access_status == "REJECTED":
            raise HTTPException(status_code=403, detail="Your Admin access request has been rejected.")
        if user.account_status != "Active" or user.admin_access_status != "ACTIVE":
            raise HTTPException(status_code=403, detail="Active Admin access required.")

        token_to_use = access_token or create_token({"sub": user.id, "role": user.role})
        return schemas.AuthResponse(user=auth_user(user), accessToken=token_to_use)

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
    settings = get_settings()

    user = db.scalar(
        select(models.UserAccount).where(
            models.UserAccount.email == email,
            models.UserAccount.role == "Mureed",
        )
    )

    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        access_token = None
        try:
            res = client.sign_in_with_password(email, input.password)
            access_token = res.get("access_token")
        except Exception:
            if user and user.password_hash and verify_password(input.password, user.password_hash):
                try:
                    client.update_user_password(user.id, input.password)
                    res = client.sign_in_with_password(email, input.password)
                    access_token = res.get("access_token")
                except Exception:
                    pass

        if not user:
            raise HTTPException(status_code=400, detail="Invalid registered email or password.")
        if user.account_status in ("Disabled", "Inactive"):
            raise HTTPException(status_code=403, detail="This Mureed account is not active.")

        token_to_use = access_token or create_token({"sub": user.id, "role": user.role})
        return schemas.AuthResponse(user=auth_user(user), accessToken=token_to_use)

    if not user or not verify_password(input.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid registered email or password.")

    if user.account_status in ("Disabled", "Inactive"):
        raise HTTPException(status_code=403, detail="This Mureed account is not active.")
    return auth_response(user)


@router.post("/password-reset", status_code=204)
def request_password_reset(input: schemas.PasswordResetIn):
    if not input.email.strip():
        raise HTTPException(status_code=400, detail="Please enter your email address.")


@router.post("/mureed/setup", status_code=204)
def complete_account_setup(input: schemas.AccountSetupIn, db: Session = Depends(get_db)):
    settings = get_settings()
    email = normalize_email(input.email)
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == email, models.UserAccount.role == "Mureed"))
    if not user:
        raise HTTPException(status_code=404, detail="Setup link is invalid.")
    if user.account_status == "Inactive":
        raise HTTPException(status_code=403, detail="This Mureed account is inactive.")

    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        try:
            client.update_user_password(user.id, input.password)
        except Exception:
            client.sign_up_with_password(email, input.password, data={"role": "Mureed", "mureed_id": user.mureed_id})
    else:
        user.password_hash = hash_password(input.password)

    user.account_status = "Active"
    db.commit()


@router.post("/admin/signup/start", response_model=schemas.PendingAdminSignupOut)
def start_admin_signup(input: schemas.AdminSignupStartIn, db: Session = Depends(get_db)):
    settings = get_settings()
    token = f"signup-{uuid.uuid4().hex}"
    expires_at = int((time.time() + settings.otp_ttl_seconds) * 1000)
    email = normalize_email(input.email)

    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        client.sign_up_with_password(email, input.password, data={"name": input.name.strip()})
        row = models.PendingAdminSignup(
            token=token,
            name=input.name.strip(),
            email=email,
            password_hash="",
            expires_at=expires_at,
        )
    else:
        row = models.PendingAdminSignup(
            token=token,
            name=input.name.strip(),
            email=email,
            password_hash=hash_password(input.password),
            expires_at=expires_at,
        )
    db.add(row)
    db.commit()
    return schemas.PendingAdminSignupOut(name=row.name, email=row.email, passwordHash=row.token, expiresAt=row.expires_at)


@router.post("/admin/signup/resend", response_model=schemas.PendingAdminSignupOut)
def resend_admin_signup_otp(input: schemas.PendingAdminSignupOut, db: Session = Depends(get_db)):
    settings = get_settings()
    row = db.get(models.PendingAdminSignup, input.passwordHash)
    if not row:
        raise HTTPException(status_code=404, detail="Signup session was not found.")

    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        client.resend_otp(email=row.email, type="signup")

    row.expires_at = int((time.time() + settings.otp_ttl_seconds) * 1000)
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

    if settings.use_supabase_auth:
        if input.otp == settings.demo_otp:
            raise HTTPException(
                status_code=400,
                detail="Demo OTP '123456' is not allowed in Supabase Auth mode. Please enter the OTP sent to your email address.",
            )
        client = SupabaseAuthClient(settings)
        res = client.verify_otp(email=pending.email, token=input.otp, type="signup")
        access_token = res.get("access_token")
        supabase_user = res.get("user", {})
        supabase_id = supabase_user.get("id")

        existing = db.scalar(
            select(models.UserAccount).where(
                or_(models.UserAccount.email == pending.email, models.UserAccount.id == supabase_id),
                models.UserAccount.role == "Admin",
            )
        )
        if existing and existing.admin_access_status == "ACTIVE":
            if access_token:
                return schemas.AdminSignupVerifyOut(status="ACTIVE", user=auth_user(existing), accessToken=access_token)
            response = auth_response(existing)
            return schemas.AdminSignupVerifyOut(status="ACTIVE", user=response.user, accessToken=response.accessToken)
        if existing and existing.admin_access_status == "REJECTED":
            return schemas.AdminSignupVerifyOut(status="REJECTED")

        is_main_admin = pending.email == normalize_email(settings.main_admin_email)
        admin_id = supabase_id or (existing.id if existing else f"usr-admin-{uuid.uuid4().hex[:12]}")
        admin = existing or models.UserAccount(
            id=admin_id,
            email=pending.email,
            role="Admin",
            account_status="Active",
            created_date=date.today().isoformat(),
        )
        admin.name = pending.name
        admin.admin_role = "MAIN_ADMIN" if is_main_admin else "ADMIN"
        admin.admin_access_status = "ACTIVE" if is_main_admin else "PENDING"
        admin.auth_methods = "password"
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
        return schemas.AdminSignupVerifyOut(status="ACTIVE", user=auth_user(admin), accessToken=access_token or "")
    else:
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


from ..services import email_service


@router.post("/sub-admin/signup", status_code=201)
def signup_sub_admin(input: schemas.SubAdminSignupIn, db: Session = Depends(get_db)):
    email = normalize_email(input.email)
    settings = get_settings()

    existing = db.scalar(
        select(models.UserAccount).where(
            models.UserAccount.email == email
        )
    )
    if existing:
        if existing.admin_access_status == "PENDING":
            raise HTTPException(status_code=400, detail="An application for this email is already pending approval.")
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    user_id = f"usr-subadmin-{uuid.uuid4().hex[:12]}"
    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        try:
            res = client.sign_up_with_password(email, input.password, data={"name": input.name.strip(), "role": "SUB_ADMIN"})
            supabase_user = res.get("user", {})
            if supabase_user.get("id"):
                user_id = supabase_user["id"]
        except Exception:
            pass

    new_admin = models.UserAccount(
        id=user_id,
        name=input.name.strip(),
        email=email,
        role="SUB_ADMIN",
        account_status="Active",
        created_date=date.today().isoformat(),
        admin_role="SUB_ADMIN",
        admin_access_status="PENDING",
        auth_methods="password",
        password_hash=hash_password(input.password),
    )
    db.add(new_admin)

    req_id = f"admin-req-{uuid.uuid4().hex[:12]}"
    approval_req = models.AdminApprovalRequest(
        id=req_id,
        name=input.name.strip(),
        email=email,
        status="PENDING",
        auth_method="password",
        requested_date=date.today().isoformat(),
    )
    db.add(approval_req)
    db.commit()

    email_service.send_sub_admin_signup_notification(email, input.name.strip())

    return {"status": "PENDING", "message": "Your Sub Admin application has been submitted and is pending Super Admin approval."}


@router.post("/sub-admin/login", response_model=schemas.AuthResponse)
def login_sub_admin(input: schemas.EmailPasswordIn, db: Session = Depends(get_db)):
    email = normalize_email(input.email)
    settings = get_settings()

    user = db.scalar(
        select(models.UserAccount).where(
            models.UserAccount.email == email,
            models.UserAccount.role.in_(["SUB_ADMIN", "Admin"]),
        )
    )

    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        access_token = None
        try:
            res = client.sign_in_with_password(email, input.password)
            access_token = res.get("access_token")
        except Exception:
            if user and user.password_hash and verify_password(input.password, user.password_hash):
                try:
                    client.update_user_password(user.id, input.password)
                    res = client.sign_in_with_password(email, input.password)
                    access_token = res.get("access_token")
                except Exception:
                    pass

        if not user:
            raise HTTPException(status_code=400, detail="Invalid Sub Admin email or password.")
        if user.admin_access_status == "PENDING":
            raise HTTPException(status_code=403, detail="Your account is waiting for Super Admin approval.")
        if user.admin_access_status == "REJECTED":
            raise HTTPException(status_code=403, detail="Your Sub Admin request was rejected.")
        if user.account_status != "Active" or user.admin_access_status != "ACTIVE":
            raise HTTPException(status_code=403, detail="Your account has been disabled.")

        token_to_use = access_token or create_token({"sub": user.id, "role": user.role})
        return schemas.AuthResponse(user=auth_user(user), accessToken=token_to_use)

    if not user or not verify_password(input.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid Sub Admin email or password.")
    if user.admin_access_status == "PENDING":
        raise HTTPException(status_code=403, detail="Your account is waiting for Super Admin approval.")
    if user.admin_access_status == "REJECTED":
        raise HTTPException(status_code=403, detail="Your Sub Admin request was rejected.")
    if user.account_status != "Active" or user.admin_access_status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Your account has been disabled.")
    return auth_response(user)


@router.post("/forgot-password", status_code=200)
def forgot_password(input: schemas.EmailIn, db: Session = Depends(get_db)):
    email = normalize_email(input.email)
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == email))
    if user:
        reset_token = create_token({"sub": user.id, "email": email, "type": "reset"}, expires_in=1800)
        reset_url = f"http://localhost:8081/reset-password?token={reset_token}"
        email_service.send_password_reset_email(email, user.name, reset_url)
    return {"message": "If the email is registered, password reset instructions have been sent."}


@router.post("/reset-password", status_code=200)
def reset_password(input: schemas.PasswordResetConfirmIn, db: Session = Depends(get_db)):
    settings = get_settings()
    payload = create_token.__globals__["decode_token"](input.token) if "decode_token" in create_token.__globals__ else None
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired password reset link.")

    user_id = payload.get("sub")
    user = db.get(models.UserAccount, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User account was not found.")

    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        try:
            client.update_user_password(user.id, input.newPassword)
        except Exception:
            pass

    user.password_hash = hash_password(input.newPassword)
    if user.account_status == "PASSWORD_CHANGE_REQUIRED":
        user.account_status = "Active"
    db.commit()
    return {"message": "Password updated successfully."}


@router.post("/change-password", status_code=200)
def change_password(input: schemas.ChangePasswordIn, user: models.UserAccount = Depends(current_user), db: Session = Depends(get_db)):
    settings = get_settings()

    if not settings.use_supabase_auth and user.password_hash:
        if not verify_password(input.currentPassword, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if settings.use_supabase_auth:
        client = SupabaseAuthClient(settings)
        try:
            client.update_user_password(user.id, input.newPassword)
        except Exception as exc:
            logger_err = str(exc)

    user.password_hash = hash_password(input.newPassword)
    if user.account_status in ("PASSWORD_CHANGE_REQUIRED", "PENDING_SETUP"):
        user.account_status = "Active"
    db.commit()
    return {"message": "Password changed successfully."}


@router.get("/admin/approval-requests", response_model=list[schemas.AdminApprovalRequestOut])
def list_admin_approval_requests(_: models.UserAccount = Depends(require_main_admin), db: Session = Depends(get_db)):
    return [approval_request_out(row) for row in db.scalars(select(models.AdminApprovalRequest).order_by(models.AdminApprovalRequest.requested_date.desc())).all()]


@router.post("/admin/approval-requests/{request_id}/approve", status_code=204)
def approve_admin_request(request_id: str, _: models.UserAccount = Depends(require_main_admin), db: Session = Depends(get_db)):
    request = db.get(models.AdminApprovalRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Admin approval request was not found.")
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == request.email))
    if not user:
        user = models.UserAccount(
            id=f"usr-admin-{uuid.uuid4().hex[:12]}",
            name=request.name,
            email=request.email,
            role="SUB_ADMIN",
            account_status="Active",
            created_date=date.today().isoformat(),
            admin_role="SUB_ADMIN",
            auth_methods=request.auth_method,
        )
        db.add(user)
    user.admin_access_status = "ACTIVE"
    user.account_status = "Active"
    request.status = "APPROVED"
    db.commit()

    email_service.send_sub_admin_approval_notification(request.email, request.name)


@router.post("/admin/approval-requests/{request_id}/reject", status_code=204)
def reject_admin_request(request_id: str, _: models.UserAccount = Depends(require_main_admin), db: Session = Depends(get_db)):
    request = db.get(models.AdminApprovalRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Admin approval request was not found.")
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.email == request.email))
    if user:
        user.admin_access_status = "REJECTED"
    request.status = "REJECTED"
    db.commit()

    email_service.send_sub_admin_rejection_notification(request.email, request.name)


