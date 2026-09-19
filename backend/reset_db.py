"""
TrustLedger Clean Database Reset Script
Deletes any existing database file and recreates fresh, empty tables with zero demo records.
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir.parent))

from backend.app.database import engine, Base
import backend.app.models

def reset_database():
    db_path = backend_dir / "trustledger.db"
    if db_path.exists():
        print(f"Removing existing database file: {db_path}")
        try:
            os.remove(db_path)
        except Exception as e:
            print(f"Notice during file deletion: {e}")

    # Drop all and recreate empty tables
    print("Recreating clean, empty database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database reset successful. 0 demo records present. System is completely clean for new user registration.")

if __name__ == "__main__":
    reset_database()
