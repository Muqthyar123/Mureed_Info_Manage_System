import re
from datetime import date

from fastapi import HTTPException


NAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z\s'-]*[A-Za-z.]?$")
EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$")
VALID_GENDERS = {"Male", "Female"}
VALID_MUREED_STATUSES = {"Available", "Passed Out"}
VALID_ACCOUNT_STATUSES = {"Active", "Inactive", "Pending Setup"}
VALID_PEER_STATUSES = {"Active", "Inactive"}


def normalize_email(value: str) -> str:
    return value.strip().lower()


def validate_name(value: str, label: str = "Name") -> str:
    text = value.strip()
    if not text:
        raise ValueError(f"{label} is required.")
    if any(char.isdigit() for char in text):
        raise ValueError(f"{label} cannot contain numbers.")
    if not NAME_PATTERN.fullmatch(text):
        raise ValueError("Name may only contain letters, spaces, hyphens and apostrophes.")
    if len(text) < 2:
        raise ValueError("Please enter a valid name.")
    return text


def validate_email(value: str) -> str:
    text = normalize_email(value)
    if not text:
        raise ValueError("Email is required.")
    if not EMAIL_PATTERN.fullmatch(text):
        raise ValueError("Please enter a valid email address.")
    return text


def normalize_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) > 10 and digits.startswith("91"):
        digits = digits[2:]
    return digits[:10]


def validate_phone(value: str) -> str:
    digits = normalize_phone(value)
    if not digits:
        raise ValueError("Phone Number is required.")
    if len(digits) != 10:
        raise ValueError("Please enter a valid 10-digit phone number.")
    if not re.match(r"^[6-9]", digits):
        raise ValueError("Indian mobile numbers must start with 6, 7, 8 or 9.")
    return digits


def validate_password(value: str) -> str:
    if not value:
        raise ValueError("Password is required.")
    if not 8 <= len(value) <= 12:
        raise ValueError("Password must be between 8 and 12 characters.")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"[0-9]", value):
        raise ValueError("Password must contain at least one number.")
    if not re.search(r"[^A-Za-z0-9]", value):
        raise ValueError("Password must contain at least one special character.")
    return value


def validate_iso_date(value: str) -> str:
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("Date of Birth must be a valid yyyy-mm-dd date.") from exc
    if parsed >= date.today():
        raise ValueError("Date of Birth must be in the past.")
    return parsed.isoformat()


def calculate_age(date_of_birth: str | date, today: date | None = None) -> int:
    if isinstance(date_of_birth, date):
        born = date_of_birth
    else:
        born = date.fromisoformat(str(date_of_birth))
    current = today or date.today()
    return current.year - born.year - ((current.month, current.day) < (born.month, born.day))


def conflict(detail: str) -> HTTPException:
    return HTTPException(status_code=409, detail=detail)
