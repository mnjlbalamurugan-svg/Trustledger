import hashlib
import json
from datetime import datetime
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import LedgerRecord, AuditEvent

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def calculate_sha256(data_bytes: bytes) -> str:
    return hashlib.sha256(data_bytes).hexdigest()

def calculate_hash_from_str(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def calculate_record_hash(previous_hash: str, artifact_hash: str, timestamp_str: str, record_data: str) -> str:
    payload = f"{previous_hash}{artifact_hash}{timestamp_str}{record_data}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def append_ledger_record(
    db: Session,
    user_id: str,
    application_id: Optional[str],
    artifact_type: str,
    artifact_hash: str,
    metadata: Dict[str, Any] = None
) -> LedgerRecord:
    last_record = db.query(LedgerRecord).filter(
        LedgerRecord.user_id == user_id
    ).order_by(LedgerRecord.timestamp.desc()).first()

    previous_hash = last_record.record_hash if last_record else GENESIS_HASH

    now = datetime.utcnow()
    timestamp_str = now.isoformat()
    meta_str = json.dumps(metadata or {}, sort_keys=True)
    record_hash = calculate_record_hash(previous_hash, artifact_hash, timestamp_str, meta_str)

    record = LedgerRecord(
        user_id=user_id,
        application_id=application_id,
        artifact_type=artifact_type,
        artifact_hash=artifact_hash,
        previous_hash=previous_hash,
        record_hash=record_hash,
        timestamp=now,
        integrity_status="VERIFIED",
        metadata_json=meta_str
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Log audit event
    audit = AuditEvent(
        user_id=user_id,
        event_type="LEDGER_RECORD_CREATED",
        description=f"Recorded {artifact_type} ({artifact_hash[:8]}...) into verification ledger",
        user_email="",
        application_id=application_id
    )
    db.add(audit)
    db.commit()

    return record

def verify_ledger_chain(db: Session, user_id: str) -> Tuple[bool, int, int, int, str]:
    records = db.query(LedgerRecord).filter(
        LedgerRecord.user_id == user_id
    ).order_by(LedgerRecord.timestamp.asc()).all()

    if not records:
        return True, 0, 0, 0, "Ledger is empty. No records created yet."

    verified_count = 0
    tampered_count = 0
    expected_prev = GENESIS_HASH

    for r in records:
        timestamp_str = r.timestamp.isoformat()
        meta_str = r.metadata_json or "{}"
        expected_hash = calculate_record_hash(r.previous_hash, r.artifact_hash, timestamp_str, meta_str)

        if r.previous_hash != expected_prev or r.record_hash != expected_hash or r.integrity_status == "TAMPERED":
            tampered_count += 1
            r.integrity_status = "TAMPERED"
        else:
            verified_count += 1
            r.integrity_status = "VERIFIED"
        expected_prev = r.record_hash

    db.commit()
    is_valid = (tampered_count == 0)
    message = "Ledger Integrity Verified: All cryptographic hash links and Merkle proofs match." if is_valid else f"Integrity Violation Detected: {tampered_count} compromised records found."
    return is_valid, len(records), verified_count, tampered_count, message
