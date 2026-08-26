import os
import sys
from sqlalchemy import create_engine, text

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import get_settings


def apply_migration():
    settings = get_settings()
    db_url = settings.database_url
    print(f"Applying Migration 002 to Database URL target (masked)...")

    if db_url.startswith("sqlite"):
        print("Target is SQLite; skipping PostgreSQL-specific migration 002.")
        return

    migration_file = os.path.join(os.path.dirname(__file__), "..", "migrations", "002_convert_ids_to_text.sql")
    with open(migration_file, "r", encoding="utf-8") as f:
        sql = f.read()

    engine = create_engine(db_url)
    with engine.begin() as conn:
        conn.execute(text(sql))
    print("Migration 002 applied successfully!")


if __name__ == "__main__":
    apply_migration()
