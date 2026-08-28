from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models
from .config import get_settings
from .security import hash_password


PEER_NAMES = [
    "Qadri",
    "Chishti",
    "Naqshbandi",
    "Suhrawardi",
    "Shadhili",
    "Rifai",
    "Kubrawi",
    "Bektashi",
]

FIRST = [
    "Abdul",
    "Muqthyar",
    "Ayesha",
    "Bilal",
    "Fatima",
    "Hamza",
    "Imran",
    "Junaid",
    "Khadija",
    "Layla",
    "Mohsin",
    "Nadia",
    "Omar",
    "Rukhsana",
    "Saif",
    "Tahira",
    "Usman",
    "Wasim",
    "Yasmin",
    "Zoya",
]
LAST = ["Ahmed", "Khan", "Siddiqui", "Sheikh", "Ansari", "Qureshi", "Baig", "Farooqui", "Hashmi", "Rahman"]
CITIES = ["Hyderabad", "Vijayawada", "Bengaluru", "Chennai", "Nagpur", "Pune", "Bhopal", "Lucknow", "Kurnool", "Warangal"]
STREETS = ["Main Road", "Station Street", "Gulshan Colony", "Noor Nagar", "Chowk Bazaar"]
FEMALE_NAMES = {"Ayesha", "Fatima", "Khadija", "Layla", "Nadia", "Rukhsana", "Tahira", "Yasmin", "Zoya"}


def rng(seed: int):
    state = seed

    def next_value() -> float:
        nonlocal state
        state = (state * 1664525 + 1013904223) % 4294967296
        return state / 4294967296

    return next_value


def today() -> str:
    return date.today().isoformat()


def seed_database(db: Session) -> None:
    if db.scalar(select(func.count(models.Peer.id))) > 0 or db.scalar(select(func.count(models.Mureed.id))) > 0:
        return

    settings = get_settings()
    peers = [
        models.Peer(
            id=f"mr-{index + 1}",
            name=name,
            status="Inactive" if index == len(PEER_NAMES) - 1 else "Active",
        )
        for index, name in enumerate(PEER_NAMES)
    ]
    db.add_all(peers)
    db.flush()

    rand = rng(20260823)
    mureeds: list[models.Mureed] = []
    for index in range(1, 10001):
        first = FIRST[int(rand() * len(FIRST))]
        last = LAST[int(rand() * len(LAST))]
        year = 1975 + int(rand() * 35)
        month = 1 + int(rand() * 12)
        day = 1 + int(rand() * 28)
        peer = peers[int(rand() * len(peers))]
        status = "Available" if rand() > 0.32 else "Passed Out"
        mureeds.append(
            models.Mureed(
                id=f"MRD-{index:05d}",
                name=f"{first} {last}",
                date_of_birth=f"{year}-{month:02d}-{day:02d}",
                gender="Female" if first in FEMALE_NAMES else "Male",
                address=f"{1 + int(rand() * 200)}, {STREETS[int(rand() * len(STREETS))]}, {CITIES[int(rand() * len(CITIES))]}",
                phone=f"9{str(100000000 + int(rand() * 899999999))[:9]}",
                email=f"{first.lower()}.{last.lower()}{index}@example.com",
                peer_id=peer.id,
                peer_name=peer.name,
                status=status,
            )
        )
    db.add_all(mureeds)

    users = [
        models.UserAccount(
            id="usr-main-admin",
            name="Main Admin",
            email=settings.main_admin_email,
            role="Admin",
            account_status="Active",
            created_date="2026-01-01",
            admin_role="MAIN_ADMIN",
            admin_access_status="ACTIVE",
            auth_methods="password,google",
            password_hash=hash_password("Admin@123"),
        ),
        models.UserAccount(
            id="usr-admin",
            name="System Admin",
            email="admin@mims.app",
            role="Admin",
            account_status="Active",
            created_date="2026-01-02",
            admin_role="ADMIN",
            admin_access_status="ACTIVE",
            auth_methods="password",
            password_hash=hash_password("admin123"),
        ),
    ]
    for index, mureed in enumerate(mureeds[:40]):
        users.append(
            models.UserAccount(
                id=f"usr-{mureed.id}",
                name=mureed.name,
                email=mureed.email,
                role="Mureed",
                account_status="Pending Setup" if index % 7 == 0 else "Inactive" if index % 11 == 0 else "Active",
                created_date=f"2026-0{1 + (index % 8)}-{1 + (index % 27):02d}",
                mureed_id=mureed.id,
                password_hash=hash_password("mureed123"),
            )
        )
    db.add_all(users)
    db.add(
        models.AdminApprovalRequest(
            id="admin-req-john",
            name="John Doe",
            email="john@example.com",
            status="PENDING",
            auth_method="password",
            requested_date="2026-01-05",
        )
    )
    db.commit()
