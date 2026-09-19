import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable for OAuth users
    organization_name = Column(String, default="Digital Lending Partners")
    phone = Column(String, nullable=True)
    role = Column(String, default="Risk Underwriter")
    google_id = Column(String, unique=True, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships for user data isolation
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    applicants = relationship("Applicant", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    kyc_sessions = relationship("KYCSession", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    ledger_records = relationship("LedgerRecord", back_populates="user", cascade="all, delete-orphan")

class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    dob = Column(String, nullable=True)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    pan = Column(String, nullable=True)
    identity_reference = Column(String, nullable=False)  # Aadhaar / National ID / PAN
    address = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    monthly_income = Column(Float, default=0.0)
    bank_account = Column(String, nullable=True)
    organization_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="applicants")
    applications = relationship("Application", back_populates="applicant")

class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    application_number = Column(String, unique=True, index=True, nullable=False)  # e.g., TL-10001
    applicant_id = Column(String, ForeignKey("applicants.id"), nullable=False)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, default="PENDING")  # PENDING, UNDER_REVIEW, MANUAL_REVIEW_MARKED, CLEARED, QUARANTINED
    requested_amount = Column(Float, default=500000.0)
    loan_purpose = Column(String, default="Working Capital")
    document_status = Column(String, default="PENDING")  # PENDING, VERIFIED, SUSPICIOUS, TAMPERED
    kyc_status = Column(String, default="PENDING")       # PENDING, VERIFIED, REVIEW_REQUIRED, FAILED
    network_flag = Column(String, default="CLEAN")       # CLEAN, LINKED, FRAUD_RING
    device_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="applications")
    applicant = relationship("Applicant", back_populates="applications")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    kyc_sessions = relationship("KYCSession", back_populates="application", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="application", cascade="all, delete-orphan")
    ledger_records = relationship("LedgerRecord", back_populates="application", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    filename = Column(String, nullable=False)
    document_type = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)      # SHA-256
    file_path = Column(String, nullable=True)
    forensic_result = Column(String, default="NORMAL") # NORMAL, SUSPICIOUS, MANIPULATED
    confidence = Column(Float, default=90.0)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    application = relationship("Application", back_populates="documents")

class KYCSession(Base):
    __tablename__ = "kyc_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    status = Column(String, default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, FAILED
    face_match_score = Column(Float, default=0.0)
    liveness_score = Column(Float, default=0.0)
    manipulation_score = Column(Float, default=0.0)
    risk_level = Column(String, default="LOW")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="kyc_sessions")
    application = relationship("Application", back_populates="kyc_sessions")
    images = relationship("KYCImage", back_populates="session", cascade="all, delete-orphan")

class KYCImage(Base):
    __tablename__ = "kyc_images"

    id = Column(String, primary_key=True, default=generate_uuid)
    kyc_session_id = Column(String, ForeignKey("kyc_sessions.id"), nullable=False)
    image_type = Column(String, nullable=False) # id_document, live_selfie
    image_path = Column(String, nullable=False)
    sha256_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("KYCSession", back_populates="images")

class FraudLink(Base):
    __tablename__ = "fraud_links"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    source_application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    target_application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    relationship_type = Column(String, nullable=False) # Shared Device, Shared Bank Account, Similar Identity Data, Shared IP Cluster
    confidence = Column(Float, default=95.0)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LedgerRecord(Base):
    __tablename__ = "ledger_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=True)
    artifact_type = Column(String, nullable=False)
    artifact_hash = Column(String, nullable=False)
    previous_hash = Column(String, nullable=False)
    record_hash = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    integrity_status = Column(String, default="VERIFIED") # VERIFIED, TAMPERED
    metadata_json = Column(Text, nullable=True)

    user = relationship("User", back_populates="ledger_records")
    application = relationship("Application", back_populates="ledger_records")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    severity = Column(String, default="MEDIUM") # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    detection_layer = Column(String, nullable=False) # Document Forensics, KYC Biometrics, Fraud Network, Verification Ledger
    status = Column(String, default="ACTIVE") # ACTIVE, REVIEWED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="alerts")
    application = relationship("Application", back_populates="alerts")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    module = Column(String, nullable=False)
    result = Column(String, nullable=False)
    confidence = Column(Float, default=90.0)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    event_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    user_email = Column(String, nullable=False)
    ip_address = Column(String, default="127.0.0.1")
    application_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
