from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import require_admin

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/overview", response_model=schemas.OverviewStats)
def get_overview_stats(_: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    return schemas.OverviewStats(
        totalMureeds=db.scalar(select(func.count(models.Mureed.id))) or 0,
        availableMureeds=db.scalar(select(func.count(models.Mureed.id)).where(models.Mureed.status == "Available")) or 0,
        passedOutMureeds=db.scalar(select(func.count(models.Mureed.id)).where(models.Mureed.status == "Passed Out")) or 0,
        totalPeer=db.scalar(select(func.count(models.Peer.id))) or 0,
    )


@router.get("/mureeds-by-peer", response_model=list[schemas.PeerBreakdown])
def get_mureeds_by_peer(_: models.UserAccount = Depends(require_admin), db: Session = Depends(get_db)):
    result = []
    for peer in db.scalars(select(models.Peer).order_by(models.Peer.id)).all():
        total = db.scalar(select(func.count(models.Mureed.id)).where(models.Mureed.peer_name == peer.name)) or 0
        available = db.scalar(select(func.count(models.Mureed.id)).where(models.Mureed.peer_name == peer.name, models.Mureed.status == "Available")) or 0
        passed_out = db.scalar(select(func.count(models.Mureed.id)).where(models.Mureed.peer_name == peer.name, models.Mureed.status == "Passed Out")) or 0
        result.append(schemas.PeerBreakdown(peerName=peer.name, total=total, available=available, passedOut=passed_out))
    return result
