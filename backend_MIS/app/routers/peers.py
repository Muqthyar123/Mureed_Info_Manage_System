from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..mappers import peer_out
from ..security import require_admin
from ..validation import conflict

router = APIRouter(prefix="/peers", tags=["peers"])


@router.get("", response_model=list[schemas.PeerRow])
def list_peers(search: str | None = None, status: str | None = None, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    stmt = select(models.Peer)
    if search:
        stmt = stmt.where(func.lower(models.Peer.name).like(f"%{search.strip().lower()}%"))
    if status and status != "all":
        stmt = stmt.where(models.Peer.status == status)
    peers = db.scalars(stmt.order_by(models.Peer.name)).all()
    result = []
    for peer in peers:
        count = db.scalar(select(func.count(models.Mureed.id)).where(models.Mureed.peer_name == peer.name)) or 0
        result.append(peer_out(peer, count))
    return result


@router.get("/names", response_model=list[str])
def list_peer_names(_: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    return list(db.scalars(select(models.Peer.name).order_by(models.Peer.id)).all())


@router.post("", response_model=schemas.PeerOut)
def create_peer(input: schemas.PeerIn, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.scalar(select(models.Peer).where(func.lower(models.Peer.name) == input.name.strip().lower()))
    if existing:
        raise conflict("Peer with this name already exists.")
    max_num = 0
    for pid in db.scalars(select(models.Peer.id)).all():
        if pid and pid.startswith("mr-"):
            try:
                num = int(pid.split("-")[1])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass
    row = models.Peer(id=f"mr-{max_num + 1}", name=input.name.strip(), status=input.status)
    db.add(row)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("Peer with this name already exists.") from exc
    db.refresh(row)
    return schemas.PeerOut(id=row.id, name=row.name, status=row.status)


@router.put("/{peer_id}", response_model=schemas.PeerOut)
def update_peer(peer_id: str, input: schemas.PeerIn, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.Peer, peer_id)
    if not row:
        raise HTTPException(status_code=404, detail="Peer not found")
    duplicate = db.scalar(select(models.Peer).where(func.lower(models.Peer.name) == input.name.lower(), models.Peer.id != peer_id))
    if duplicate:
        raise conflict("Peer with this name already exists.")
    old_name = row.name
    row.name = input.name.strip()
    row.status = input.status
    for mureed in db.scalars(select(models.Mureed).where(models.Mureed.peer_name == old_name)).all():
        mureed.peer_name = row.name
        mureed.peer_id = row.id
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise conflict("Peer with this name already exists.") from exc
    db.refresh(row)
    return schemas.PeerOut(id=row.id, name=row.name, status=row.status)


@router.delete("/{peer_id}", status_code=204)
def delete_peer(peer_id: str, _: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.get(models.Peer, peer_id)
    if row:
        assigned = db.scalar(select(func.count(models.Mureed.id)).where(models.Mureed.peer_id == peer_id)) or 0
        if assigned:
            raise conflict("Cannot delete this Peer because Mureeds are currently assigned to it.")
        db.delete(row)
        db.commit()
