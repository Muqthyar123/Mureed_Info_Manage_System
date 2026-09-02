from . import models, schemas
from .validation import calculate_age


def mureed_out(row: models.Mureed, message: str | None = None, email_sent: bool | None = None) -> schemas.MureedOut:
    dob_str = str(row.date_of_birth)
    return schemas.MureedOut(
        id=row.id,
        name=row.name,
        dateOfBirth=dob_str,
        age=calculate_age(row.date_of_birth),
        gender=row.gender,
        address=row.address,
        phone=row.phone or "",
        email=row.email,
        peerName=row.peer_name,
        status=row.status,
        message=message,
        emailSent=email_sent,
    )


def peer_out(row: models.Peer, mureed_count: int = 0) -> schemas.PeerRow:
    return schemas.PeerRow(id=row.id, name=row.name, status=row.status, mureedCount=mureed_count)


def user_out(row: models.UserAccount) -> schemas.AppUserOut:
    return schemas.AppUserOut(
        id=row.id,
        name=row.name,
        email=row.email,
        role=row.role,
        accountStatus=row.account_status,
        createdDate=row.created_date,
        mureedId=row.mureed_id,
    )


def auth_user(row: models.UserAccount) -> schemas.AuthUser:
    return schemas.AuthUser(
        id=row.id,
        name=row.name,
        email=row.email,
        role="Admin" if row.role in ("Admin", "SUB_ADMIN", "SUPER_ADMIN") else row.role,
        adminRole=row.admin_role or ("SUB_ADMIN" if row.role == "SUB_ADMIN" else "MAIN_ADMIN"),
        mureedId=row.mureed_id,
    )


def approval_request_out(row: models.AdminApprovalRequest) -> schemas.AdminApprovalRequestOut:
    return schemas.AdminApprovalRequestOut(
        id=row.id,
        name=row.name,
        email=row.email,
        status=row.status,
        authMethod=row.auth_method,
        requestedDate=row.requested_date,
    )
