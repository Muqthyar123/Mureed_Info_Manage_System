from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..mappers import user_out
from ..security import require_admin
from ..validation import conflict

from ..config import get_settings
from ..services import email_service
from ..supabase_auth import SupabaseAuthClient

router = APIRouter(prefix="/users", tags=["users"])


def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return email
    parts = email.split("@", 1)
    username, domain = parts[0], parts[1]
    if len(username) <= 1:
        masked = username + "*"
    else:
        masked = username[0] + "*" * (len(username) - 1)
    return f"{masked}@{domain}"


def _is_valid_email(val: str | None) -> bool:
    if not val:
        return False
    s = val.strip().lower()
    return bool(s and s not in ("", "null", "undefined", "none") and "@" in s)


@router.get("", response_model=list[schemas.AppUserOut])
def list_users(
    search: str | None = None,
    role: str | None = None,
    status: str | None = None,
    current_user: models.UserAccount = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Fetch UserAccount rows that have a valid non-empty email
    users = db.scalars(select(models.UserAccount).order_by(models.UserAccount.created_date.desc())).all()
    valid_users = [u for u in users if _is_valid_email(u.email)]
    user_mureed_ids = {u.mureed_id for u in valid_users if u.mureed_id}
    user_emails = {u.email.strip().lower() for u in valid_users if u.email and u.email.strip()}

    # Fetch Mureeds with valid emails to synthesize missing user accounts
    mureeds = db.scalars(select(models.Mureed)).all()
    synthesized_users = []
    for m in mureeds:
        if _is_valid_email(m.email):
            m_email = m.email.strip().lower()
            dob_str = str(m.date_of_birth) if m.date_of_birth else "2026-01-01"
            if m.id not in user_mureed_ids and m_email not in user_emails:
                synthesized_users.append(
                    models.UserAccount(
                        id=f"usr-{m.id}",
                        name=m.name,
                        email=m.email.strip(),
                        role="Mureed",
                        account_status="Active",
                        created_date=dob_str[:10],
                        mureed_id=m.id,
                    )
                )

    all_users = valid_users + synthesized_users
    is_sub_admin = current_user.admin_role == "SUB_ADMIN" or current_user.role == "SUB_ADMIN"

    result = []
    search_term = search.strip().lower() if search and search.strip() else None

    for row in all_users:
        row_email = row.email.strip().lower() if row.email and row.email.strip() else ""
        row_name = row.name.strip().lower() if row.name else ""

        # Enforce Rule: Only show users with a valid non-empty email
        if not _is_valid_email(row_email):
            continue

        # Search filter
        if search_term:
            if search_term not in row_name and search_term not in row_email:
                continue

        # Role filter
        if role and role != "all":
            if role in ("Admin", "MAIN_ADMIN", "SUPER_ADMIN"):
                # Super Admin filter
                if row.role not in ("Admin", "SUPER_ADMIN", "MAIN_ADMIN") or row.admin_role == "SUB_ADMIN":
                    continue
            elif role in ("SUB_ADMIN", "Sub Admin"):
                # Sub Admin filter
                if row.role != "SUB_ADMIN" and row.admin_role != "SUB_ADMIN":
                    continue
            elif role == "Mureed":
                if row.role != "Mureed":
                    continue
            elif row.role != role and row.admin_role != role:
                continue

        # Status filter
        if status and status != "all":
            if row.account_status != status:
                continue

        u_out = user_out(row)
        if is_sub_admin and row.email and current_user.email:
            is_self = row.email.strip().lower() == current_user.email.strip().lower()
            is_mureed = row.role == "Mureed"
            if not is_self and not is_mureed:
                u_out.email = mask_email(u_out.email)
        result.append(u_out)

    return result


@router.post("/mureed-accounts", response_model=schemas.AppUserOut)
def create_mureed_account(input: schemas.CreateMureedAccountIn, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.scalar(select(models.UserAccount).where(models.UserAccount.email == input.email))
    if existing and existing.mureed_id != input.mureedId:
        raise conflict("User account with this email already exists.")
    row = models.UserAccount(
        id=f"usr-{input.mureedId or input.email}",
        name=input.name,
        email=input.email,
        role="Mureed",
        account_status="Active",
        created_date=date.today().isoformat(),
        mureed_id=input.mureedId,
    )
    db.merge(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("User account with this email already exists.") from exc
    return user_out(row)


@router.patch("/{user_id}/status", response_model=schemas.AppUserOut | None)
def set_account_status(
    user_id: str,
    input: schemas.AccountStatusIn,
    current_user: models.UserAccount = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.get(models.UserAccount, user_id)
    if row:
        settings = get_settings()
        is_sub_admin = current_user.admin_role == "SUB_ADMIN"
        if is_sub_admin and row.role != "Mureed":
            raise HTTPException(status_code=403, detail="Sub Admins can only change account status for Mureed accounts.")

        is_target_super_admin = row.admin_role in ("MAIN_ADMIN", "SUPER_ADMIN") or row.email.lower() == settings.main_admin_email.lower()
        if is_target_super_admin and current_user.admin_role not in ("MAIN_ADMIN", "SUPER_ADMIN"):
            raise HTTPException(status_code=403, detail="Sub Admins cannot modify Super Admin accounts.")

        if row.admin_role in ("MAIN_ADMIN", "SUPER_ADMIN") and input.accountStatus != "Active":
            active_main_admins = db.scalar(
                select(func.count(models.UserAccount.id)).where(
                    models.UserAccount.admin_role.in_(["MAIN_ADMIN", "SUPER_ADMIN"]),
                    models.UserAccount.account_status == "Active",
                    models.UserAccount.admin_access_status == "ACTIVE",
                    models.UserAccount.id != row.id,
                )
            ) or 0
            if active_main_admins == 0:
                raise HTTPException(status_code=400, detail="Cannot deactivate the only Main Admin.")

        row.account_status = input.accountStatus
        db.commit()
        db.refresh(row)
        u_out = user_out(row)
        if is_sub_admin and row.role != "Mureed" and row.email.strip().lower() != current_user.email.strip().lower():
            u_out.email = mask_email(u_out.email)
        return u_out
    return None


@router.post("/{user_id}/resend-setup-email", response_model=schemas.AppUserOut | None)
def resend_setup_email(
    user_id: str,
    current_user: models.UserAccount = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.get(models.UserAccount, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User account not found.")

    is_sub_admin = current_user.admin_role == "SUB_ADMIN"
    if is_sub_admin and row.role != "Mureed":
        raise HTTPException(status_code=403, detail="Sub Admins can only resend setup emails to Mureed accounts.")

    settings = get_settings()
    default_pw = settings.default_mureed_password
    email_service.send_mureed_welcome_email(row.email, row.name, initial_password=default_pw)
    u_out = user_out(row)
    if is_sub_admin and row.role != "Mureed" and row.email.strip().lower() != current_user.email.strip().lower():
        u_out.email = mask_email(u_out.email)
    return u_out


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    current_user: models.UserAccount = Depends(require_admin),
    db: Session = Depends(get_db),
):
    row = db.get(models.UserAccount, user_id)
    if row:
        settings = get_settings()
        is_sub_admin = current_user.admin_role == "SUB_ADMIN"
        if is_sub_admin and row.role != "Mureed":
            raise HTTPException(status_code=403, detail="Sub Admins can only delete Mureed accounts.")

        is_target_super_admin = row.admin_role in ("MAIN_ADMIN", "SUPER_ADMIN") or row.email.lower() == settings.main_admin_email.lower()
        if is_target_super_admin:
            raise HTTPException(status_code=403, detail="Super Admin accounts cannot be deleted.")

        # If deleting Mureed user account, delete corresponding Mureed record from mureeds table
        if row.mureed_id or row.role == "Mureed":
            mureed = db.scalar(
                select(models.Mureed).where(
                    or_(
                        models.Mureed.id == row.mureed_id,
                        func.lower(models.Mureed.email) == row.email.strip().lower()
                    )
                )
            )
            if mureed:
                db.delete(mureed)

        # Delete any corresponding AdminApprovalRequest records from database
        approval_reqs = db.scalars(
            select(models.AdminApprovalRequest).where(
                func.lower(models.AdminApprovalRequest.email) == row.email.strip().lower()
            )
        ).all()
        for req in approval_reqs:
            db.delete(req)

        if settings.use_supabase_auth:
            try:
                client = SupabaseAuthClient(settings)
                sp_user = client.get_user_by_email(row.email)
                if sp_user and sp_user.get("id"):
                    client.delete_user(sp_user["id"])
            except Exception:
                pass

        db.delete(row)
        db.commit()
