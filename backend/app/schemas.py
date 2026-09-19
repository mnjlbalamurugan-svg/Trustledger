from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime

# Auth Schemas
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str
    organization_name: str
    phone: str

    @field_validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v

    @field_validator('confirm_password')
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError("Passwords do not match")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organization_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Application Creation Schema
class CreateApplicationRequest(BaseModel):
    applicant_name: str
    dob: Optional[str] = None
    phone: str
    email: EmailStr
    pan: Optional[str] = None
    identity_reference: str  # Aadhaar / National ID
    address: Optional[str] = None
    employment_type: Optional[str] = "Salaried"
    monthly_income: float = 0.0
    bank_account: Optional[str] = None
    organization_name: Optional[str] = None
    application_amount: float
    loan_purpose: str = "Working Capital"
    device_id: Optional[str] = None

class ApplicantResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    pan: Optional[str] = None
    identity_reference: str
    address: Optional[str] = None
    employment_type: Optional[str] = None
    monthly_income: float
    bank_account: Optional[str] = None
    organization_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationListItem(BaseModel):
    id: str
    application_number: str
    applicant_name: str
    applicant_id: str
    requested_amount: float
    loan_purpose: str
    risk_score: int
    risk_level: str
    status: str
    document_status: str
    kyc_status: str
    network_flag: str
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationDetailResponse(BaseModel):
    id: str
    application_number: str
    applicant: ApplicantResponse
    requested_amount: float
    loan_purpose: str
    risk_score: int
    risk_level: str
    status: str
    document_status: str
    kyc_status: str
    network_flag: str
    created_at: datetime
    updated_at: datetime
    evidence_summary: Dict[str, Any]
    explainability: str

class UpdateApplicationStatus(BaseModel):
    status: str # MANUAL_REVIEW_MARKED, CLEARED, QUARANTINED
    reason: Optional[str] = None

# Document Schemas
class DocumentForensicDetails(BaseModel):
    font_consistency: str
    layout_consistency: str
    metadata_status: str
    transaction_formatting: str
    image_manipulation: str
    tampering_indicators_count: int
    confidence: float
    is_tampered: bool
    summary: str

class DocumentResponse(BaseModel):
    id: str
    application_id: str
    application_number: Optional[str] = None
    filename: str
    document_type: str
    file_hash: str
    forensic_result: str
    confidence: float
    forensics: DocumentForensicDetails
    created_at: datetime

# KYC Schemas
class KYCImageUploadRequest(BaseModel):
    application_id: str
    image_type: str # id_document, live_selfie
    image_data_base64: str
    capture_source: Optional[str] = "webcam" # webcam, file_upload
    motion_score: Optional[float] = 0.0

class KYCLivenessRequest(BaseModel):
    session_id: str

class KYCLivenessResponse(BaseModel):
    session_id: str
    face_detected: bool
    blink_check: bool
    movement_check: bool
    replay_check: bool
    liveness_confidence: float
    status: str
    label: str = "Prototype Liveness Analysis"
    capture_source: str = "webcam"
    summary: str
    reason: Optional[str] = None

class KYCFaceMatchRequest(BaseModel):
    session_id: str

class KYCFaceMatchResponse(BaseModel):
    session_id: str
    face_match_score: float
    facial_similarity: float
    match_result: str # MATCH, MISMATCH, NO_FACE_DETECTED
    status: str
    id_face_detected: bool
    selfie_face_detected: bool
    threshold: float = 60.0
    explanation: str
    face_alignment: str = "PASS"
    image_quality: str = "PASS"
    manipulation_indicators: str = "CHECKED"
    label: str = "Prototype Face Match Analysis"

class KYCIntegrityRequest(BaseModel):
    session_id: str

class KYCIntegrityResponse(BaseModel):
    session_id: str
    deepfake_detected: bool
    manipulation_confidence: float
    checks: Dict[str, str]
    overall_status: str
    summary: str
    label: str = "Prototype Image Forensics"

class CompleteKYCRequest(BaseModel):
    session_id: str
    application_id: str

# Fraud Network Schemas
class NetworkNode(BaseModel):
    id: str
    label: str
    applicant_name: str
    risk_score: int
    risk_level: str
    is_central: bool
    status: str
    loan_amount: Optional[str] = None

class NetworkEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    confidence: float

class NetworkGraphResponse(BaseModel):
    application_id: Optional[str] = None
    application_number: Optional[str] = None
    network_risk: str
    connected_applications_count: int
    potential_ring_detected: bool
    summary: str
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]
    disclaimer: str

# Ledger Schemas
class LedgerRecordResponse(BaseModel):
    id: str
    application_id: Optional[str] = None
    application_number: Optional[str] = None
    artifact_type: str
    artifact_hash: str
    previous_hash: str
    record_hash: str
    timestamp: datetime
    integrity_status: str
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class LedgerVerificationResult(BaseModel):
    is_valid: bool
    total_records: int
    verified_records: int
    tampered_records: int
    message: str
    verification_timestamp: datetime

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    application_id: str
    application_number: str
    applicant_name: str
    severity: str
    title: str
    description: str
    detection_layer: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

class UpdateAlertStatus(BaseModel):
    status: str

# Dashboard Schemas
class DashboardSummaryResponse(BaseModel):
    applications_reviewed: int
    high_risk_applications: int
    documents_flagged: int
    kyc_alerts: int
    risk_distribution: Dict[str, int]

class RiskTrendPoint(BaseModel):
    date: str
    reviewed: int
    flagged: int
    avg_risk: float

class AuditEventResponse(BaseModel):
    id: str
    event_type: str
    description: str
    user_email: str
    application_id: Optional[str]
    created_at: datetime
