import os
import sys
import pytest

os.environ["MIMS_DATABASE_URL"] = "sqlite:///./test_mims.db"
os.environ["MIMS_AUTH_BACKEND"] = "local"
os.environ["MIMS_ENV"] = "testing"
os.environ["MIMS_MAIN_ADMIN_EMAIL"] = "mainadmin@example.com"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings
get_settings.cache_clear()

from app.database import Base, engine, SessionLocal
from app.seed import seed_database


@pytest.fixture(autouse=True, scope="session")
def reset_test_database():
    """Ensure a fresh seeded test database before running the test suite."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield
