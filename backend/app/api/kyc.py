import base64
import json
import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import KYC_DIR
from ..models import KYCSession, KYCImage, Application, AuditEvent, User
from ..schemas import (
    KYCImageUploadRequest, KYCLivenessRequest, KYCLivenessResponse,
    KYCFaceMatchRequest, KYCFaceMatchResponse, KYCIntegrityRequest,
    KYCIntegrityResponse, CompleteKYCRequest
)
from ..services.ledger_service import calculate_sha256, append_ledger_record
from ..services.kyc_service import perform_liveness_check, perform_face_match, perform_image_integrity_check
from ..security import get_current_user

router = APIRouter(prefix="/api/kyc", tags=["KYC Biometrics"])

@router.post("/session")
def get_or_create_kyc_session(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(
        Application.user_id == current_user.id,
        (Application.application_number == application_id) | (Application.id == application_id)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found or does not belong to your account")

    session = db.query(KYCSession).filter(
        KYCSession.application_id == app.id,
        KYCSession.user_id == current_user.id
    ).order_by(KYCSession.created_at.desc()).first()

    if not session:
        session = KYCSession(
            user_id=current_user.id,
            application_id=app.id,
            status="IN_PROGRESS",
            face_match_score=0.0,
            liveness_score=0.0,
            manipulation_score=0.0,
            risk_level="LOW"
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    images = db.query(KYCImage).filter(KYCImage.kyc_session_id == session.id).all()
    img_dict = {img.image_type: {"id": img.id, "hash": img.sha256_hash} for img in images}

    return {
        "session_id": session.id,
        "application_id": app.id,
        "application_number": app.application_number,
        "status": session.status,
        "face_match_score": session.face_match_score,
        "liveness_score": session.liveness_score,
        "manipulation_score": session.manipulation_score,
        "images": img_dict
    }

@router.post("/document")
def capture_id_document(
    payload: KYCImageUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(
        Application.user_id == current_user.id,
        (Application.application_number == payload.application_id) | (Application.id == payload.application_id)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    session = db.query(KYCSession).filter(
        KYCSession.application_id == app.id,
        KYCSession.user_id == current_user.id
    ).order_by(KYCSession.created_at.desc()).first()

    if not session:
        session = KYCSession(user_id=current_user.id, application_id=app.id)
        db.add(session)
        db.commit()
        db.refresh(session)

    img_data = payload.image_data_base64
    if "," in img_data:
        img_data = img_data.split(",", 1)[1]
    raw_bytes = base64.b64decode(img_data)
    img_hash = calculate_sha256(raw_bytes)

    file_path = KYC_DIR / f"id_doc_{img_hash[:16]}.jpg"
    with open(file_path, "wb") as f:
        f.write(raw_bytes)

    existing_img = db.query(KYCImage).filter(
        KYCImage.kyc_session_id == session.id,
        KYCImage.image_type == "id_document"
    ).first()
    if existing_img:
        existing_img.image_path = str(file_path)
        existing_img.sha256_hash = img_hash
        img_record = existing_img
    else:
        img_record = KYCImage(
            kyc_session_id=session.id,
            image_type="id_document",
            image_path=str(file_path),
            sha256_hash=img_hash
        )
        db.add(img_record)
    db.commit()

    append_ledger_record(
        db=db,
        user_id=current_user.id,
        application_id=app.id,
        artifact_type="Identity Document Captured",
        artifact_hash=img_hash,
        metadata={"step": "KYC_ID_CAPTURE", "quality": "PASS"}
    )

    return {
        "success": True,
        "image_id": img_record.id,
        "image_hash": img_hash,
        "truncated_hash": f"{img_hash[:8]}...{img_hash[-6:]}",
        "session_id": session.id
    }

@router.post("/selfie")
def capture_live_selfie(
    payload: KYCImageUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(
        Application.user_id == current_user.id,
        (Application.application_number == payload.application_id) | (Application.id == payload.application_id)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    session = db.query(KYCSession).filter(
        KYCSession.application_id == app.id,
        KYCSession.user_id == current_user.id
    ).order_by(KYCSession.created_at.desc()).first()

    if not session:
        session = KYCSession(user_id=current_user.id, application_id=app.id)
        db.add(session)
        db.commit()
        db.refresh(session)

    img_data = payload.image_data_base64
    if "," in img_data:
        img_data = img_data.split(",", 1)[1]
    raw_bytes = base64.b64decode(img_data)
    img_hash = calculate_sha256(raw_bytes)

    file_path = KYC_DIR / f"selfie_{img_hash[:16]}.jpg"
    with open(file_path, "wb") as f:
        f.write(raw_bytes)

    # Save capture source and motion metadata in sidecar
    meta_path = file_path.with_suffix('.meta.json')
    try:
        with open(meta_path, "w") as mf:
            json.dump({
                "capture_source": payload.capture_source or "webcam",
                "motion_score": payload.motion_score or 0.0
            }, mf)
    except Exception:
        pass

    existing_img = db.query(KYCImage).filter(
        KYCImage.kyc_session_id == session.id,
        KYCImage.image_type == "live_selfie"
    ).first()
    if existing_img:
        existing_img.image_path = str(file_path)
        existing_img.sha256_hash = img_hash
        img_record = existing_img
    else:
        img_record = KYCImage(
            kyc_session_id=session.id,
            image_type="live_selfie",
            image_path=str(file_path),
            sha256_hash=img_hash
        )
        db.add(img_record)
    db.commit()

    append_ledger_record(
        db=db,
        user_id=current_user.id,
        application_id=app.id,
        artifact_type="Live Selfie Captured",
        artifact_hash=img_hash,
        metadata={"step": "KYC_SELFIE_CAPTURE", "liveness_candidate": True, "source": payload.capture_source}
    )

    return {
        "success": True,
        "image_id": img_record.id,
        "image_hash": img_hash,
        "truncated_hash": f"{img_hash[:8]}...{img_hash[-6:]}",
        "session_id": session.id
    }

@router.post("/liveness", response_model=KYCLivenessResponse)
def check_liveness(
    payload: KYCLivenessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(KYCSession).filter(
        KYCSession.id == payload.session_id,
        KYCSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="KYC session not found")

    selfie_img = db.query(KYCImage).filter(
        KYCImage.kyc_session_id == session.id,
        KYCImage.image_type == "live_selfie"
    ).first()

    selfie_path = selfie_img.image_path if selfie_img else None
    capture_source = "webcam"
    motion_score = 0.0

    if selfie_path:
        meta_path = Path(selfie_path).with_suffix('.meta.json')
        if meta_path.exists():
            try:
                with open(meta_path, 'r') as mf:
                    meta = json.load(mf)
                    capture_source = meta.get("capture_source", "webcam")
                    motion_score = meta.get("motion_score", 0.0)
            except Exception:
                pass

    result = perform_liveness_check(
        session_id=session.id,
        selfie_image_path=selfie_path,
        capture_source=capture_source,
        motion_score=motion_score
    )

    session.liveness_score = result.get("liveness_confidence", 0.0)
    db.commit()
    return KYCLivenessResponse(**result)

@router.post("/face-match", response_model=KYCFaceMatchResponse)
def check_face_match(
    payload: KYCFaceMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(KYCSession).filter(
        KYCSession.id == payload.session_id,
        KYCSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="KYC session not found")

    id_img = db.query(KYCImage).filter(
        KYCImage.kyc_session_id == session.id,
        KYCImage.image_type == "id_document"
    ).first()
    selfie_img = db.query(KYCImage).filter(
        KYCImage.kyc_session_id == session.id,
        KYCImage.image_type == "live_selfie"
    ).first()

    id_path = id_img.image_path if id_img else None
    selfie_path = selfie_img.image_path if selfie_img else None

    result = perform_face_match(
        session_id=session.id,
        id_image_path=id_path,
        selfie_image_path=selfie_path
    )

    session.face_match_score = result.get("face_match_score", 0.0)
    db.commit()
    return KYCFaceMatchResponse(**result)

@router.post("/image-integrity", response_model=KYCIntegrityResponse)
def check_image_integrity(
    payload: KYCIntegrityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(KYCSession).filter(
        KYCSession.id == payload.session_id,
        KYCSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="KYC session not found")

    selfie_img = db.query(KYCImage).filter(
        KYCImage.kyc_session_id == session.id,
        KYCImage.image_type == "live_selfie"
    ).first()
    selfie_path = selfie_img.image_path if selfie_img else None

    result = perform_image_integrity_check(session_id=session.id, image_path=selfie_path)
    session.manipulation_score = result.get("manipulation_confidence", 0.0)
    db.commit()
    return KYCIntegrityResponse(**result)

@router.post("/{session_id}/complete")
def complete_kyc_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(KYCSession).filter(
        KYCSession.id == session_id,
        KYCSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="KYC Session not found")

    session.status = "COMPLETED"

    # Evaluate dynamic risk level based on actual calculated scores:
    if session.face_match_score < 60.0:
        session.risk_level = "CRITICAL" if session.face_match_score < 30.0 else "HIGH"
        app_status = "FAILED" if session.face_match_score < 30.0 else "REVIEW_REQUIRED"
    elif session.liveness_score < 50.0:
        session.risk_level = "MEDIUM"
        app_status = "REVIEW_REQUIRED"
    else:
        session.risk_level = "LOW"
        app_status = "VERIFIED"

    app = session.application
    if app:
        app.kyc_status = app_status
        db.commit()

        # Append completion event to ledger with real calculated scores
        append_ledger_record(
            db=db,
            user_id=current_user.id,
            application_id=app.id,
            artifact_type="KYC Verification Summary Recorded",
            artifact_hash=calculate_sha256(f"{session.id}_kyc_completed_{session.face_match_score}_{session.liveness_score}".encode("utf-8")),
            metadata={
                "face_match": session.face_match_score,
                "liveness": session.liveness_score,
                "deepfake_confidence": session.manipulation_score,
                "decision": app_status,
                "label": "Prototype Biometric Analysis"
            }
        )

        # Audit event
        audit = AuditEvent(
            user_id=current_user.id,
            event_type="KYC_RESULT_ATTACHED",
            description=f"Attached KYC result to application {app.application_number} (Face Match: {session.face_match_score}%, Liveness: {session.liveness_score}%, Status: {app_status})",
            user_email=current_user.email,
            application_id=app.id
        )
        db.add(audit)
        db.commit()

    return {
        "message": "KYC Verification result successfully added to application dossier",
        "session_id": session.id,
        "application_number": app.application_number if app else "Unknown",
        "overall_kyc_risk": session.risk_level
    }

@router.get("/images/{image_id}")
def get_kyc_image(
    image_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    img = db.query(KYCImage).join(KYCSession).filter(
        KYCImage.id == image_id,
        KYCSession.user_id == current_user.id
    ).first()
    if not img or not os.path.exists(img.image_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(img.image_path)
