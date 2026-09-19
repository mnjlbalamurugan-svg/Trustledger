import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
KYC_DIR = UPLOAD_DIR / "kyc"
KYC_DIR.mkdir(parents=True, exist_ok=True)
DOCS_DIR = UPLOAD_DIR / "documents"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/trustledger.db")
SECRET_KEY = os.getenv("SECRET_KEY", "trustledger-enterprise-production-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Google OAuth 2.0 Settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
