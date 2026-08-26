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

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[schemas.AppUserOut])
def list_users(search: str | None = None, role: str | None = None, status: str | None = None, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    stmt = select(models.UserAccount)
    if search:
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(or_(func.lower(models.UserAccount.name).like(term), func.lower(models.UserAccount.email).like(term)))
    if role and role != "all":
        stmt = stmt.where(models.UserAccount.role == role)
    if status and status != "all":
        stmt = stmt.where(models.UserAccount.account_status == status)
    return [user_out(row) for row in db.scalars(stmt.order_by(models.UserAccount.created_date.desc())).all()]


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
        account_status="Pending Setup",
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
def set_account_status(user_id: str, input: schemas.AccountStatusIn, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.UserAccount, user_id)
    if row:
        if row.admin_role == "MAIN_ADMIN" and input.accountStatus != "Active":
            active_main_admins = db.scalar(
                select(func.count(models.UserAccount.id)).where(
                    models.UserAccount.admin_role == "MAIN_ADMIN",
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
        return user_out(row)
    return None


@router.post("/{user_id}/resend-setup-email", response_model=schemas.AppUserOut | None)
def resend_setup_email(user_id: str, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.UserAccount, user_id)
    return user_out(row) if row else None


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.UserAccount, user_id)
    if row and row.role == "Admin":
        raise HTTPException(status_code=403, detail="Admin users cannot be deleted from this screen.")
    if row:
        db.delete(row)
        db.commit()
