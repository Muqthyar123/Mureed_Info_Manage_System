import base64
import hashlib
import hmac
import json
import time
from typing import Any

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from . import models
from .supabase_auth import SupabaseAuthClient
from .validation import normalize_email


def hash_password(password: str) -> str:
    salt = get_settings().secret_key.encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000).hex()


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    return hmac.compare_digest(hash_password(password), password_hash)


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_token(payload: dict[str, Any], expires_in: int = 60 * 60 * 8) -> str:
    body = {**payload, "exp": int(time.time()) + expires_in}
    body_raw = _b64(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(get_settings().secret_key.encode("utf-8"), body_raw.encode("ascii"), hashlib.sha256)
    return f"{body_raw}.{_b64(sig.digest())}"


def decode_token(token: str) -> dict[str, Any]:
    try:
        body_raw, sig_raw = token.split(".", 1)
        expected = hmac.new(
            get_settings().secret_key.encode("utf-8"), body_raw.encode("ascii"), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(_unb64(sig_raw), expected):
            raise ValueError
        payload = json.loads(_unb64(body_raw))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError
        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.") from exc


def current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> models.UserAccount:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    token = authorization.removeprefix("Bearer ").strip()
    settings = get_settings()
    if settings.use_supabase_auth:
        supabase_user = SupabaseAuthClient(settings).get_user(token)
        user_id = supabase_user.get("id")
        email = normalize_email(supabase_user.get("email", ""))
        user = db.scalar(
            select(models.UserAccount).where(or_(models.UserAccount.id == user_id, models.UserAccount.email == email))
        )
    else:
        payload = decode_token(token)
        user = db.get(models.UserAccount, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account was not found.")
    return user


def require_admin(user: models.UserAccount = Depends(current_user)) -> models.UserAccount:
    if user.role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    if user.account_status != "Active" or user.admin_access_status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active Admin access required.")
    return user


def require_main_admin(user: models.UserAccount = Depends(current_user)) -> models.UserAccount:
    if user.role != "Admin" or user.admin_role != "MAIN_ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Main Admin access required.")
    if user.account_status != "Active" or user.admin_access_status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active Main Admin access required.")
    return user
