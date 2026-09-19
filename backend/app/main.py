from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .api import (
    auth,
    dashboard,
    applications,
    documents,
    kyc,
    network,
    ledger,
    alerts,
    reports
)

# Initialize database schema without inserting any demo records
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TrustLedger API",
    description="Digital Lending Security Intelligence & Fraud Verification Engine",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(applications.router)
app.include_router(documents.router)
app.include_router(kyc.router)
app.include_router(network.router)
app.include_router(ledger.router)
app.include_router(alerts.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {
        "service": "TrustLedger Digital Lending Security Intelligence",
        "tagline": "Detect. Verify. Connect. Protect.",
        "status": "OPERATIONAL",
        "version": "2.0.0"
    }

@app.get("/api/health")
def health():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "ledger_engine": "ACTIVE",
        "authentication": "JWT_AND_GOOGLE_OAUTH"
    }
