import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import LedgerRecord, Application, User
from ..schemas import LedgerRecordResponse, LedgerVerificationResult
from ..services.ledger_service import verify_ledger_chain
from ..security import get_current_user

router = APIRouter(prefix="/api/ledger", tags=["Verification Ledger"])

@router.get("", response_model=List[LedgerRecordResponse])
def get_ledger_records(
    application_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LedgerRecord).filter(LedgerRecord.user_id == current_user.id)
    if application_id:
        query = query.join(Application).filter(
            (Application.id == application_id) | (Application.application_number == application_id)
        )

    records = query.order_by(LedgerRecord.timestamp.desc()).all()
    results = []
    for r in records:
        app = r.application
        meta = json.loads(r.metadata_json) if r.metadata_json else None
        results.append(LedgerRecordResponse(
            id=r.id,
            application_id=r.application_id,
            application_number=app.application_number if app else None,
            artifact_type=r.artifact_type,
            artifact_hash=r.artifact_hash,
            previous_hash=r.previous_hash,
            record_hash=r.record_hash,
            timestamp=r.timestamp,
            integrity_status=r.integrity_status,
            metadata=meta
        ))
    return results

@router.post("/verify", response_model=LedgerVerificationResult)
def verify_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_valid, total, verified, tampered, message = verify_ledger_chain(db, current_user.id)
    return LedgerVerificationResult(
        is_valid=is_valid,
        total_records=total,
        verified_records=verified,
        tampered_records=tampered,
        message=message,
        verification_timestamp=datetime.utcnow()
    )
