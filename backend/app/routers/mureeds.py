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


@router.post("", response_model=schemas.MureedOut)
def create_mureed(input: schemas.MureedBase, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    peer = db.scalar(select(models.Peer).where(models.Peer.name == input.peerName))
    existing = db.scalar(select(models.Mureed).where(models.Mureed.email == input.email))
    if existing:
        raise conflict("Mureed with this email already exists.")
    next_number = (db.scalar(select(func.count(models.Mureed.id))) or 0) + 1
    row = models.Mureed(
        id=f"MRD-{next_number:05d}",
        name=input.name.strip(),
        date_of_birth=input.dateOfBirth,
        gender=input.gender,
        address=input.address.strip(),
        phone=input.phone,
        email=input.email,
        peer_id=peer.id if peer else None,
        peer_name=input.peerName,
        status=input.status,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("Mureed with this email already exists.") from exc
    db.refresh(row)
    return mureed_out(row)


@router.put("/{mureed_id}", response_model=schemas.MureedOut)
def update_mureed(mureed_id: str, input: schemas.MureedBase, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.Mureed, mureed_id)
    if not row:
        raise HTTPException(status_code=404, detail="Mureed not found")
    peer = db.scalar(select(models.Peer).where(models.Peer.name == input.peerName))
    row.name = input.name.strip()
    row.date_of_birth = input.dateOfBirth
    row.gender = input.gender
    row.address = input.address.strip()
    row.phone = input.phone
    duplicate = db.scalar(select(models.Mureed).where(models.Mureed.email == input.email, models.Mureed.id != mureed_id))
    if duplicate:
        raise conflict("Mureed with this email already exists.")
    row.email = input.email
    row.peer_id = peer.id if peer else None
    row.peer_name = input.peerName
    row.status = input.status
    user = db.scalar(select(models.UserAccount).where(models.UserAccount.mureed_id == row.id))
    if user:
        user.name = row.name
        user.email = row.email
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("Mureed with this email already exists.") from exc
    db.refresh(row)
    return mureed_out(row)


@router.delete("/{mureed_id}", status_code=204)
def delete_mureed(mureed_id: str, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.Mureed, mureed_id)
    if row:
        user = db.scalar(select(models.UserAccount).where(models.UserAccount.mureed_id == row.id))
        if user:
            db.delete(user)
        db.delete(row)
        db.commit()
