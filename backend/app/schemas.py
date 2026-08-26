from pydantic import BaseModel, Field, field_validator

from .validation import (
    VALID_ACCOUNT_STATUSES,
    VALID_GENDERS,
    VALID_MUREED_STATUSES,
    VALID_PEER_STATUSES,
    validate_email,
    validate_iso_date,
    validate_name,
    validate_password,
    validate_phone,
)


class MureedBase(BaseModel):
    name: str
    dateOfBirth: str
    gender: str
    address: str
    phone: str
    email: str
    peerName: str
    status: str

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        return validate_name(value, "Mureed Name")

    @field_validator("dateOfBirth")
    @classmethod
    def valid_dob(cls, value: str) -> str:
        return validate_iso_date(value)

    @field_validator("gender")
    @classmethod
    def valid_gender(cls, value: str) -> str:
        if value not in VALID_GENDERS:
            raise ValueError("Gender must be Male or Female.")
        return value

    @field_validator("address")
    @classmethod
    def valid_address(cls, value: str) -> str:
        text = value.strip()
        if not text:
            raise ValueError("Address is required.")
        return text

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value: str) -> str:
        return validate_phone(value)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return validate_email(value)

    @field_validator("peerName")
    @classmethod
    def valid_peer_name(cls, value: str) -> str:
        return validate_name(value, "Peer Name")

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        if value not in VALID_MUREED_STATUSES:
            raise ValueError("Mureed Status must be Available or Passed Out.")
        return value


class MureedOut(MureedBase):
    id: str
    age: int


class PaginatedMureeds(BaseModel):
    rows: list[MureedOut]
    total: int
    page: int
    pageSize: int


class PeerIn(BaseModel):
    name: str
    status: str = "Active"

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        return validate_name(value, "Peer Name")

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        if value not in VALID_PEER_STATUSES:
            raise ValueError("Peer status must be Active or Inactive.")
        return value


class PeerOut(PeerIn):
    id: str


class PeerRow(PeerOut):
    mureedCount: int


class AppUserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    accountStatus: str
    createdDate: str
    mureedId: str | None = None


class AuthUser(BaseModel):
    id: str
    name: str
    email: str
    role: str
    adminRole: str | None = None
    mureedId: str | None = None


class AuthResponse(BaseModel):
    user: AuthUser
    accessToken: str


class EmailPasswordIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return validate_email(value)


class EmailIn(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return validate_email(value)


class PasswordResetIn(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return validate_email(value)


class AccountSetupIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return validate_email(value)

    @field_validator("password")
    @classmethod
    def valid_password(cls, value: str) -> str:
        return validate_password(value)


class AdminSignupStartIn(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        return validate_name(value, "Name")

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return validate_email(value)

    @field_validator("password")
    @classmethod
    def valid_password(cls, value: str) -> str:
        return validate_password(value)


class PendingAdminSignupOut(BaseModel):
    name: str
    email: str
    passwordHash: str = Field(description="Opaque signup token kept for frontend compatibility.")
    expiresAt: int


class AdminSignupVerifyIn(BaseModel):
    signup: PendingAdminSignupOut
    otp: str


class AdminSignupVerifyOut(BaseModel):
    status: str
    user: AuthUser | None = None
    accessToken: str | None = None


class AdminApprovalRequestOut(BaseModel):
    id: str
    name: str
    email: str
    status: str
    authMethod: str
    requestedDate: str


class CreateMureedAccountIn(BaseModel):
    name: str
    email: str
    mureedId: str | None = None

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        return validate_name(value, "Mureed Name")

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        return validate_email(value)


class AccountStatusIn(BaseModel):
    accountStatus: str

    @field_validator("accountStatus")
    @classmethod
    def valid_account_status(cls, value: str) -> str:
        if value not in VALID_ACCOUNT_STATUSES:
            raise ValueError("Account status must be Active, Inactive, or Pending Setup.")
        return value


class OverviewStats(BaseModel):
    totalMureeds: int
    availableMureeds: int
    passedOutMureeds: int
    totalPeer: int


class PeerBreakdown(BaseModel):
    peerName: str
    total: int
    available: int
    passedOut: int
