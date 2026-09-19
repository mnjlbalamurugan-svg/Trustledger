from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Application, Applicant, Alert, AuditEvent, User, FraudLink, Document, KYCSession, LedgerRecord
from ..schemas import (
    ApplicationListItem,
    ApplicationDetailResponse,
    ApplicantResponse,
    CreateApplicationRequest,
    UpdateApplicationStatus
)
from ..services.ledger_service import calculate_sha256, append_ledger_record
from ..services.risk_engine import calculate_application_risk
from ..security import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications"])

def generate_next_app_number(db: Session, user_id: str) -> str:
    count = db.query(Application).filter(Application.user_id == user_id).count()
    return f"TL-{10001 + count}"

@router.post("", response_model=ApplicationDetailResponse)
def create_application(
    payload: CreateApplicationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app_number = generate_next_app_number(db, current_user.id)

    # 1. Create Applicant
    applicant = Applicant(
        user_id=current_user.id,
        name=payload.applicant_name.strip(),
        dob=payload.dob,
        phone=payload.phone.strip(),
        email=payload.email.strip().lower(),
        pan=payload.pan.strip().upper() if payload.pan else None,
        identity_reference=payload.identity_reference.strip(),
        address=payload.address,
        employment_type=payload.employment_type,
        monthly_income=payload.monthly_income,
        bank_account=payload.bank_account.strip() if payload.bank_account else None,
        organization_name=payload.organization_name,
    )
    db.add(applicant)
    db.commit()
    db.refresh(applicant)

    # 2. Create Application
    application = Application(
        user_id=current_user.id,
        application_number=app_number,
        applicant_id=applicant.id,
        risk_score=15,  # Base initial intake score
        risk_level="LOW",
        status="PENDING",
        requested_amount=payload.application_amount,
        loan_purpose=payload.loan_purpose,
        document_status="PENDING",
        kyc_status="PENDING",
        network_flag="CLEAN",
        device_id=payload.device_id,
        ip_address="127.0.0.1"
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # 3. Dynamic Fraud Link Detection against user's existing applications
    other_apps = db.query(Application).join(Applicant).filter(
        Application.user_id == current_user.id,
        Application.id != application.id
    ).all()

    has_link = False
    for other in other_apps:
        # Check Shared Bank Account
        if payload.bank_account and other.applicant.bank_account and payload.bank_account == other.applicant.bank_account:
            fl = FraudLink(
                user_id=current_user.id,
                source_application_id=application.id,
                target_application_id=other.id,
                relationship_type="Shared Bank Account",
                confidence=99.0,
                details=f"Disbursement account matches {other.application_number}"
            )
            db.add(fl)
            has_link = True
            # Create alert
            alt = Alert(
                user_id=current_user.id,
                application_id=application.id,
                severity="HIGH",
                title=f"Shared Bank Account with {other.application_number}",
                description=f"Account {payload.bank_account} reused across multiple loan applications.",
                detection_layer="Fraud Network",
                status="ACTIVE"
            )
            db.add(alt)

        # Check Shared Phone
        if payload.phone and other.applicant.phone and payload.phone == other.applicant.phone:
            fl = FraudLink(
                user_id=current_user.id,
                source_application_id=application.id,
                target_application_id=other.id,
                relationship_type="Shared Phone Number",
                confidence=95.0,
                details=f"Contact phone matches {other.application_number}"
            )
            db.add(fl)
            has_link = True

        # Check Shared PAN
        if payload.pan and other.applicant.pan and payload.pan == other.applicant.pan:
            fl = FraudLink(
                user_id=current_user.id,
                source_application_id=application.id,
                target_application_id=other.id,
                relationship_type="Similar Identity Data",
                confidence=98.0,
                details=f"Tax ID / PAN collision with {other.application_number}"
            )
            db.add(fl)
            has_link = True

    if has_link:
        application.network_flag = "LINKED"
        application.risk_score = 65
        application.risk_level = "HIGH"
        db.commit()

    # 4. Append initial intake artifact into Verification Ledger
    genesis_payload = f"APPLICATION_INTAKE:{application.id}:{application.application_number}:{datetime.utcnow().isoformat()}"
    app_hash = calculate_sha256(genesis_payload.encode('utf-8'))
    append_ledger_record(
        db=db,
        user_id=current_user.id,
        application_id=application.id,
        artifact_type="Loan Application Intake Recorded",
        artifact_hash=app_hash,
        metadata={
            "applicant": applicant.name,
            "amount": application.requested_amount,
            "purpose": application.loan_purpose
        }
    )

    # 5. Audit Log
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="APPLICATION_CREATED",
        description=f"Created application {application.application_number} for {applicant.name}",
        user_email=current_user.email,
        application_id=application.id
    )
    db.add(audit)
    db.commit()

    return get_application_detail(application.id, db, current_user)

@router.get("", response_model=List[ApplicationListItem])
def list_applications(
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Application).join(Applicant).filter(Application.user_id == current_user.id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Application.application_number.ilike(search_term),
                Applicant.name.ilike(search_term),
                Applicant.email.ilike(search_term),
                Applicant.identity_reference.ilike(search_term)
            )
        )

    if risk_level and risk_level != "ALL":
        query = query.filter(Application.risk_level == risk_level.upper())

    if status and status != "ALL":
        query = query.filter(Application.status == status.upper())

    apps = query.order_by(Application.created_at.desc()).all()

    return [
        ApplicationListItem(
            id=a.id,
            application_number=a.application_number,
            applicant_name=a.applicant.name if a.applicant else "N/A",
            applicant_id=a.applicant_id,
            requested_amount=a.requested_amount,
            loan_purpose=a.loan_purpose,
            risk_score=a.risk_score,
            risk_level=a.risk_level,
            status=a.status,
            document_status=a.document_status,
            kyc_status=a.kyc_status,
            network_flag=a.network_flag,
            created_at=a.created_at
        )
        for a in apps
    ]

@router.get("/{app_id_or_number}", response_model=ApplicationDetailResponse)
def get_application_detail(
    app_id_or_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(
        Application.user_id == current_user.id,
        or_(
            Application.id == app_id_or_number,
            Application.application_number == app_id_or_number
        )
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Dynamic Evidence Summary
    docs = db.query(Document).filter(Document.application_id == app.id).all()
    kyc_sess = db.query(KYCSession).filter(KYCSession.application_id == app.id).order_by(KYCSession.created_at.desc()).first()
    fraud_links = db.query(FraudLink).filter(
        or_(FraudLink.source_application_id == app.id, FraudLink.target_application_id == app.id)
    ).all()
    ledger_records = db.query(LedgerRecord).filter(LedgerRecord.application_id == app.id).all()

    # Document Evidence
    doc_items = []
    doc_confidence = 90.0
    for d in docs:
        doc_items.append(f"{d.filename}: {d.forensic_result}")
        if d.confidence:
            doc_confidence = d.confidence
    if not doc_items:
        doc_items = ["No document uploaded yet"]

    # KYC Evidence
    kyc_items = []
    kyc_confidence = 0.0
    if kyc_sess:
        kyc_items.append(f"Face Match: {int(kyc_sess.face_match_score)}%")
        kyc_items.append(f"Liveness Check: {int(kyc_sess.liveness_score)}%")
        if kyc_sess.manipulation_score > 50:
            kyc_items.append(f"Deepfake indicators detected ({int(kyc_sess.manipulation_score)}%)")
        kyc_confidence = kyc_sess.manipulation_score
    else:
        kyc_items = ["KYC session not initiated"]

    # Network Evidence
    net_items = [f"{fl.relationship_type}: {fl.details or 'Connected'}" for fl in fraud_links]
    if not net_items:
        net_items = ["No suspicious entity relationships detected"]

    # Ledger Evidence
    led_items = [f"{lr.artifact_type} ({lr.artifact_hash[:8]}...)" for lr in ledger_records]
    if not led_items:
        led_items = ["No cryptographic ledger records yet"]

    evidence_summary = {
        "document_forensics": {
            "items": doc_items,
            "confidence": doc_confidence,
            "status": app.document_status
        },
        "photo_kyc": {
            "items": kyc_items,
            "confidence": kyc_confidence,
            "status": app.kyc_status
        },
        "fraud_network": {
            "items": net_items,
            "status": "HIGH_RISK" if len(fraud_links) > 0 else "CLEAN"
        },
        "verification_ledger": {
            "items": led_items,
            "status": "VERIFIED" if len(ledger_records) > 0 else "EMPTY"
        }
    }

    explainability = (
        f"Application {app.application_number} has {len(fraud_links)} active network connections, "
        f"{len(docs)} documents inspected, and KYC status '{app.kyc_status}'."
    )

    return ApplicationDetailResponse(
        id=app.id,
        application_number=app.application_number,
        applicant=ApplicantResponse.model_validate(app.applicant),
        requested_amount=app.requested_amount,
        loan_purpose=app.loan_purpose,
        risk_score=app.risk_score,
        risk_level=app.risk_level,
        status=app.status,
        document_status=app.document_status,
        kyc_status=app.kyc_status,
        network_flag=app.network_flag,
        created_at=app.created_at,
        updated_at=app.updated_at,
        evidence_summary=evidence_summary,
        explainability=explainability
    )

@router.patch("/{app_id_or_number}/status")
def update_application_status(
    app_id_or_number: str,
    payload: UpdateApplicationStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(
        Application.user_id == current_user.id,
        or_(
            Application.id == app_id_or_number,
            Application.application_number == app_id_or_number
        )
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.status
    app.status = payload.status
    app.updated_at = datetime.utcnow()
    db.commit()

    # Log audit event
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="APPLICATION_STATUS_UPDATED",
        description=f"Status of {app.application_number} changed from {old_status} to {payload.status}. Note: {payload.reason or 'Action by underwriter'}",
        user_email=current_user.email,
        application_id=app.id
    )
    db.add(audit)
    db.commit()

    return {"message": f"Application status updated to {payload.status}", "status": app.status}

@router.post("/{app_id_or_number}/manual-review")
def mark_for_manual_review(
    app_id_or_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(
        Application.user_id == current_user.id,
        or_(
            Application.id == app_id_or_number,
            Application.application_number == app_id_or_number
        )
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = "MANUAL_REVIEW_MARKED"
    app.updated_at = datetime.utcnow()

    # Create active alert
    new_alert = Alert(
        user_id=current_user.id,
        application_id=app.id,
        severity="HIGH",
        title=f"{app.application_number} — Marked for Manual Review",
        description="Application flagged by underwriter for in-depth verification.",
        detection_layer="Underwriter Protocol",
        status="ACTIVE"
    )
    db.add(new_alert)

    # Log audit event
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="MANUAL_REVIEW",
        description=f"Application {app.application_number} marked for manual review by {current_user.name}",
        user_email=current_user.email,
        application_id=app.id
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Application {app.application_number} marked for manual review",
        "status": app.status,
        "application_number": app.application_number
    }
