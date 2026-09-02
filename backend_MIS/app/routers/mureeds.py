from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..mappers import mureed_out
from ..security import current_user, require_admin
from ..validation import conflict

router = APIRouter(prefix="/mureeds", tags=["mureeds"])


def location_from_address(address: str) -> str:
    parts = [part.strip() for part in address.split(",") if part.strip()]
    return parts[-1] if parts else address.strip()


def apply_filters(stmt, search: str | None, peerName: str | None, location: str | None, gender: str | None, status: str | None):
    if search:
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(models.Mureed.name).like(term),
                func.lower(models.Mureed.email).like(term),
                models.Mureed.phone.like(f"%{search.strip()}%"),
            )
        )
    if peerName and peerName != "all":
        stmt = stmt.where(models.Mureed.peer_name == peerName)
    if gender and gender != "all":
        stmt = stmt.where(models.Mureed.gender == gender)
    if status and status != "all":
        stmt = stmt.where(models.Mureed.status == status)
    if location and location != "all":
        stmt = stmt.where(models.Mureed.address.like(f"%{location}"))
    return stmt


@router.get("", response_model=schemas.PaginatedMureeds)
def list_mureeds(
    page: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=500),
    search: str | None = None,
    peerName: str | None = None,
    location: str | None = None,
    gender: str | None = None,
    status: str | None = None,
    sortBy: str | None = "name",
    sortDir: str | None = "asc",
    _: models.UserAccount = Depends(require_admin),
    db: Session = Depends(get_db),
):
    stmt = apply_filters(select(models.Mureed), search, peerName, location, gender, status)
    count_stmt = apply_filters(select(func.count(models.Mureed.id)), search, peerName, location, gender, status)
    sort_map = {
        "name": models.Mureed.name,
        "dateOfBirth": models.Mureed.date_of_birth,
        "gender": models.Mureed.gender,
        "address": models.Mureed.address,
        "phone": models.Mureed.phone,
        "email": models.Mureed.email,
        "peerName": models.Mureed.peer_name,
        "status": models.Mureed.status,
        "age": models.Mureed.date_of_birth,
    }
    sort_col = sort_map.get(sortBy or "name", models.Mureed.name)
    order = desc(sort_col) if sortDir == "desc" else asc(sort_col)
    if sortBy == "age":
        order = asc(sort_col) if sortDir == "desc" else desc(sort_col)
    rows = db.scalars(stmt.order_by(order).offset((page - 1) * pageSize).limit(pageSize)).all()
    return schemas.PaginatedMureeds(
        rows=[mureed_out(row) for row in rows],
        total=db.scalar(count_stmt) or 0,
        page=page,
        pageSize=pageSize,
    )


@router.get("/export-data", response_model=list[schemas.MureedOut])
def list_mureeds_for_export(
    search: str | None = None,
    peerName: str | None = None,
    location: str | None = None,
    gender: str | None = None,
    status: str | None = None,
    sortBy: str | None = "name",
    sortDir: str | None = "asc",
    _: models.UserAccount = Depends(require_admin),
    db: Session = Depends(get_db),
):
    stmt = apply_filters(select(models.Mureed), search, peerName, location, gender, status)
    sort_map = {"name": models.Mureed.name, "peerName": models.Mureed.peer_name, "age": models.Mureed.date_of_birth}
    sort_col = sort_map.get(sortBy or "name", models.Mureed.name)
    order = desc(sort_col) if sortDir == "desc" else asc(sort_col)
    if sortBy == "age":
        order = asc(sort_col) if sortDir == "desc" else desc(sort_col)
    return [mureed_out(row) for row in db.scalars(stmt.order_by(order)).all()]


@router.get("/locations", response_model=list[str])
def list_locations(_: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.scalars(select(models.Mureed.address)).all()
    return sorted({location_from_address(address) for address in rows if location_from_address(address)})


@router.get("/me", response_model=schemas.MureedOut)
def get_my_mureed(user: models.UserAccount = Depends(current_user), db: Session = Depends(get_db)):
    if user.role != "Mureed" or not user.mureed_id:
        raise HTTPException(status_code=403, detail="Mureed account required.")
    if user.account_status != "Active":
        raise HTTPException(status_code=403, detail="This Mureed account is not active.")
    row = db.get(models.Mureed, user.mureed_id)
    if not row:
        raise HTTPException(status_code=404, detail="Mureed not found")
    return mureed_out(row)


@router.get("/by-email", response_model=schemas.MureedOut)
def get_mureed_by_email(email: str, user: models.UserAccount = Depends(current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(models.Mureed).where(func.lower(models.Mureed.email) == email.strip().lower()))
    if not row:
        raise HTTPException(status_code=404, detail="Mureed not found")
    if user.role != "Admin" and user.mureed_id != row.id:
        raise HTTPException(status_code=403, detail="Mureeds can only view their own information.")
    return mureed_out(row)


@router.get("/{mureed_id}", response_model=schemas.MureedOut)
def get_mureed(mureed_id: str, user: models.UserAccount = Depends(current_user), db: Session = Depends(get_db)):
    row = db.get(models.Mureed, mureed_id)
    if not row:
        raise HTTPException(status_code=404, detail="Mureed not found")
    if user.role == "Mureed" and user.mureed_id != row.id:
        raise HTTPException(status_code=403, detail="Mureeds can only view their own information.")
    return mureed_out(row)


from ..services import email_service
from ..config import get_settings
from ..supabase_auth import SupabaseAuthClient
from ..security import hash_password


@router.post("", response_model=schemas.MureedOut)
def create_mureed(input: schemas.MureedBase, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    peer = db.scalar(select(models.Peer).where(models.Peer.name == input.peerName))
    
    clean_email = input.email.strip().lower() if input.email and input.email.strip() else None
    clean_phone = input.phone.strip() if input.phone and input.phone.strip() else ""

    if clean_email:
        existing = db.scalar(select(models.Mureed).where(func.lower(models.Mureed.email) == clean_email))
        if existing:
            raise conflict("Mureed with this email already exists.")

    max_num = 0
    for mid in db.scalars(select(models.Mureed.id)).all():
        if mid and mid.startswith("MRD-"):
            try:
                num = int(mid.split("-")[1])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass
    mureed_id = f"MRD-{(max_num + 1):05d}"

    row = models.Mureed(
        id=mureed_id,
        name=input.name.strip(),
        date_of_birth=input.dateOfBirth,
        gender=input.gender,
        address=input.address.strip(),
        phone=clean_phone,
        email=clean_email,
        peer_id=peer.id if peer else None,
        peer_name=input.peerName,
        status=input.status,
    )
    db.add(row)

    settings = get_settings()
    default_pw = settings.default_mureed_password
    msg = None
    email_sent = None

    if clean_email:
        user_id = f"usr-{mureed_id}"
        if settings.use_supabase_auth:
            client = SupabaseAuthClient(settings)
            try:
                client.ensure_supabase_user_synced(clean_email, default_pw, {"name": input.name.strip(), "role": "Mureed", "mureed_id": mureed_id})
                sp_user = client.get_user_by_email(clean_email)
                if sp_user and sp_user.get("id"):
                    user_id = sp_user["id"]
            except Exception:
                pass

        user_acc = models.UserAccount(
            id=user_id,
            name=input.name.strip(),
            email=clean_email,
            role="Mureed",
            account_status="Active",
            created_date=input.dateOfBirth[:10] if len(input.dateOfBirth) >= 10 else "2026-01-01",
            mureed_id=mureed_id,
            auth_methods="password",
            password_hash=hash_password(default_pw) if not settings.use_supabase_auth else None,
        )
        db.add(user_acc)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("Mureed with this email already exists.") from exc
    db.refresh(row)

    if clean_email:
        email_sent = email_service.send_mureed_welcome_email(clean_email, row.name, initial_password=default_pw)
        if email_sent:
            msg = "Mureed account created successfully. Login credentials have been sent to the provided email."
        else:
            msg = "Mureed account created, but the login email could not be sent. Please retry sending the credentials."
    else:
        msg = "Mureed account created successfully. No email was provided, so login credentials were not sent."

    return mureed_out(row, message=msg, email_sent=email_sent)


@router.post("/{mureed_id}/resend-invitation", status_code=200)
def resend_mureed_invitation(mureed_id: str, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.Mureed, mureed_id)
    if not row:
        raise HTTPException(status_code=404, detail="Mureed not found")
    if not row.email or not row.email.strip():
        raise HTTPException(status_code=400, detail="Cannot send invitation: Mureed does not have an email address.")
    
    settings = get_settings()
    default_pw = settings.default_mureed_password
    clean_email = row.email.strip().lower()

    # Ensure UserAccount exists for Mureed
    user_acc = db.scalar(select(models.UserAccount).where(or_(models.UserAccount.mureed_id == mureed_id, func.lower(models.UserAccount.email) == clean_email)))
    if not user_acc:
        user_id = f"usr-{mureed_id}"
        if settings.use_supabase_auth:
            client = SupabaseAuthClient(settings)
            try:
                client.ensure_supabase_user_synced(clean_email, default_pw, {"name": row.name, "role": "Mureed", "mureed_id": mureed_id})
                sp_user = client.get_user_by_email(clean_email)
                if sp_user and sp_user.get("id"):
                    user_id = sp_user["id"]
            except Exception:
                pass
        user_acc = models.UserAccount(
            id=user_id,
            name=row.name,
            email=clean_email,
            role="Mureed",
            account_status="Active",
            created_date=row.date_of_birth[:10] if len(row.date_of_birth) >= 10 else "2026-01-01",
            mureed_id=mureed_id,
            auth_methods="password",
            password_hash=hash_password(default_pw) if not settings.use_supabase_auth else None,
        )
        db.add(user_acc)
        db.commit()

    sent = email_service.send_mureed_welcome_email(clean_email, row.name, initial_password=default_pw)
    if not sent:
        raise HTTPException(status_code=500, detail="Could not send invitation email via Brevo.")
    return {"message": f"Invitation email resent successfully to {clean_email}."}


def _is_blank_email(val: str | None) -> bool:
    if not val:
        return True
    s = val.strip().lower()
    return s in ("", "null", "undefined", "none")


@router.put("/{mureed_id}", response_model=schemas.MureedOut)
def update_mureed(mureed_id: str, input: schemas.MureedBase, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.Mureed, mureed_id)
    if not row:
        raise HTTPException(status_code=404, detail="Mureed not found")
    
    prev_email = None if _is_blank_email(row.email) else row.email.strip().lower()
    new_email = None if _is_blank_email(input.email) else input.email.strip().lower()
    clean_phone = input.phone.strip() if input.phone and input.phone.strip() else ""

    email_sent = None
    msg = "Mureed details updated successfully."

    peer = db.scalar(select(models.Peer).where(models.Peer.name == input.peerName))

    if new_email and new_email != prev_email:
        duplicate = db.scalar(select(models.Mureed).where(func.lower(models.Mureed.email) == new_email, models.Mureed.id != mureed_id))
        if duplicate:
            raise conflict("Mureed with this email already exists.")

    # Find existing UserAccount BEFORE changing fields
    user = db.scalar(select(models.UserAccount).where(or_(models.UserAccount.mureed_id == mureed_id, (func.lower(models.UserAccount.email) == prev_email if prev_email else False))))
    user_had_valid_email = (user is not None) and (not _is_blank_email(user.email))

    row.name = input.name.strip()
    row.date_of_birth = input.dateOfBirth
    row.gender = input.gender
    row.address = input.address.strip()
    row.phone = clean_phone
    row.email = new_email
    row.peer_id = peer.id if peer else None
    row.peer_name = input.peerName
    row.status = input.status

    settings = get_settings()
    default_pw = settings.default_mureed_password

    # Detect transition: new email entered AND (previously had no email OR user account never had an email)
    is_email_added_transition = (new_email is not None) and (prev_email is None or not user_had_valid_email)

    if new_email:
        if not user:
            # Create Auth Account for Mureed
            user_id = f"usr-{mureed_id}"
            if settings.use_supabase_auth:
                client = SupabaseAuthClient(settings)
                try:
                    client.ensure_supabase_user_synced(new_email, default_pw, {"name": row.name, "role": "Mureed", "mureed_id": mureed_id})
                    sp_user = client.get_user_by_email(new_email)
                    if sp_user and sp_user.get("id"):
                        user_id = sp_user["id"]
                except Exception:
                    pass

            user = models.UserAccount(
                id=user_id,
                name=row.name,
                email=new_email,
                role="Mureed",
                account_status="Active",
                created_date=input.dateOfBirth[:10] if len(input.dateOfBirth) >= 10 else "2026-01-01",
                mureed_id=mureed_id,
                auth_methods="password",
                password_hash=hash_password(default_pw) if not settings.use_supabase_auth else None,
            )
            db.add(user)
        else:
            # Update existing UserAccount
            user.name = row.name
            user.email = new_email
            if settings.use_supabase_auth:
                try:
                    client = SupabaseAuthClient(settings)
                    client.ensure_supabase_user_synced(new_email, default_pw, {"name": row.name, "role": "Mureed", "mureed_id": mureed_id})
                except Exception:
                    pass
    else:
        # Email is NULL/empty
        if user:
            user.name = row.name
            user.email = None

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("Mureed with this email already exists.") from exc
    db.refresh(row)

    # Determine email sending & notification messages based on transition rules
    if is_email_added_transition:
        email_sent = email_service.send_mureed_welcome_email(new_email, row.name, initial_password=default_pw)
        if email_sent:
            msg = "Mureed details updated successfully. Login credentials have been sent to the provided email."
        else:
            msg = "Mureed details updated, but the login email could not be sent. Please retry sending the credentials."
    elif new_email is None:
        msg = "Mureed details updated successfully. No email was provided, so login credentials were not sent."
    else:
        msg = "Mureed details updated successfully."

    return mureed_out(row, message=msg, email_sent=email_sent)


@router.delete("/{mureed_id}", status_code=204)
def delete_mureed(mureed_id: str, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.Mureed, mureed_id)
    if row:
        settings = get_settings()
        clean_email = row.email.strip().lower() if row.email and row.email.strip() else None
        users = db.scalars(
            select(models.UserAccount).where(
                or_(
                    models.UserAccount.mureed_id == row.id,
                    (func.lower(models.UserAccount.email) == clean_email if clean_email else False)
                )
            )
        ).all()
        for user in users:
            if settings.use_supabase_auth and user.email:
                try:
                    client = SupabaseAuthClient(settings)
                    sp_user = client.get_user_by_email(user.email)
                    if sp_user and sp_user.get("id"):
                        client.delete_user(sp_user["id"])
                except Exception:
                    pass
            db.delete(user)
        db.delete(row)
        db.commit()

