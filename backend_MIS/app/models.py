from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Peer(Base):
    __tablename__ = "peers"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    date_of_birth: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="Active")

    mureeds: Mapped[list["Mureed"]] = relationship(back_populates="peer")


class Mureed(Base):
    __tablename__ = "mureeds"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    date_of_birth: Mapped[str] = mapped_column(String(10))
    gender: Mapped[str] = mapped_column(String(10))
    address: Mapped[str] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(10), index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    peer_id: Mapped[str | None] = mapped_column(String(80), ForeignKey("peers.id"), nullable=True)
    peer_name: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(20), default="Available")

    peer: Mapped[Peer | None] = relationship(back_populates="mureeds")


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    role: Mapped[str] = mapped_column(String(20))
    account_status: Mapped[str] = mapped_column(String(30), default="Active")
    created_date: Mapped[str] = mapped_column(String(10))
    mureed_id: Mapped[str | None] = mapped_column(String(80), ForeignKey("mureeds.id"), nullable=True)
    admin_role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    admin_access_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    auth_methods: Mapped[str] = mapped_column(String(80), default="password")
    password_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)


class AdminApprovalRequest(Base):
    __tablename__ = "admin_approval_requests"
    __table_args__ = (UniqueConstraint("email", "auth_method", name="uq_admin_request_email_method"),)

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(255), index=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    auth_method: Mapped[str] = mapped_column(String(20))
    requested_date: Mapped[str] = mapped_column(String(10))


class PendingAdminSignup(Base):
    __tablename__ = "pending_admin_signups"

    token: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(255), index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    expires_at: Mapped[int] = mapped_column()
