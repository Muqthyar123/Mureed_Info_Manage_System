from io import BytesIO, StringIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..mappers import mureed_out, peer_out
from ..routers.mureeds import apply_filters
from ..security import require_admin

router = APIRouter(prefix="/exports", tags=["exports"])


MUREED_COLUMNS = [
    "Mureed Name",
    "Date of Birth",
    "Age",
    "Gender",
    "Address",
    "Phone Number",
    "Email",
    "Peer Name",
    "Mureed Status",
]
PEER_COLUMNS = ["Peer Name", "Status", "Number of Mureeds"]


def _csv_response(filename: str, columns: list[str], rows: list[list[str | int]]) -> StreamingResponse:
    buffer = StringIO()
    buffer.write("\ufeff")
    import csv

    writer = csv.writer(buffer)
    writer.writerow(columns)
    writer.writerows(rows)
    content = buffer.getvalue().encode("utf-8")
    return StreamingResponse(
        iter([content]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
    )


def _xlsx_response(filename: str, columns: list[str], rows: list[list[str | int]]) -> StreamingResponse:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = filename[:31]
    sheet.append(columns)
    for row in rows:
        sheet.append(row)
    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}.xlsx"'},
    )


@router.get("/mureeds")
def export_mureeds(
    format: str = Query("xlsx", pattern="^(csv|xlsx)$"),
    search: str | None = None,
    peerName: str | None = None,
    location: str | None = None,
    gender: str | None = None,
    status: str | None = None,
    _: models.UserAccount = Depends(require_admin),
    db: Session = Depends(get_db),
):
    stmt = apply_filters(select(models.Mureed), search, peerName, location, gender, status).order_by(models.Mureed.name)
    rows = []
    for row in db.scalars(stmt).all():
        item = mureed_out(row)
        rows.append(
            [
                item.name,
                item.dateOfBirth,
                item.age,
                item.gender,
                item.address,
                item.phone,
                item.email,
                item.peerName,
                item.status,
            ]
        )
    if format == "csv":
        return _csv_response("mureeds", MUREED_COLUMNS, rows)
    return _xlsx_response("mureeds", MUREED_COLUMNS, rows)


@router.get("/peers")
def export_peers(
    format: str = Query("xlsx", pattern="^(csv|xlsx)$"),
    _: models.UserAccount = Depends(require_admin),
    db: Session = Depends(get_db),
):
    peer_rows = []
    for peer in db.scalars(select(models.Peer).order_by(models.Peer.name)).all():
        count = len(peer.mureeds)
        item = peer_out(peer, count)
        peer_rows.append([item.name, item.status, item.mureedCount])
    if format == "csv":
        return _csv_response("peers", PEER_COLUMNS, peer_rows)
    return _xlsx_response("peers", PEER_COLUMNS, peer_rows)
