import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import DOCS_DIR
from ..models import Document, Application, AuditEvent, User
from ..schemas import DocumentResponse, DocumentForensicDetails
from ..services.ledger_service import calculate_sha256, append_ledger_record
from ..services.forensics import analyze_document_forensics
from ..security import get_current_user

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    application_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if application_id:
        query = query.join(Application).filter(
            (Application.id == application_id) | (Application.application_number == application_id)
        )
    docs = query.order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        meta = json.loads(d.metadata_json or "{}")
        forensics = analyze_document_forensics(d.filename, d.file_hash)
        if meta:
            forensics.update(meta)
        results.append(DocumentResponse(
            id=d.id,
            application_id=d.application_id,
            application_number=d.application.application_number if d.application else None,
            filename=d.filename,
            document_type=d.document_type,
            file_hash=d.file_hash,
            forensic_result=d.forensic_result,
            confidence=d.confidence,
            forensics=DocumentForensicDetails(**forensics),
            created_at=d.created_at
        ))
    return results

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    document_type: str = Form("Bank Statement"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, JPG, or PNG.")

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum threshold (25MB)")

    file_hash = calculate_sha256(content)

    # Verify application belongs to authenticated user
    app = db.query(Application).filter(
        Application.user_id == current_user.id,
        (Application.id == application_id) | (Application.application_number == application_id)
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found or does not belong to your account")

    # Save locally to controlled upload directory
    save_path = DOCS_DIR / f"{file_hash[:16]}_{file.filename}"
    with open(save_path, "wb") as f:
        f.write(content)

    # Perform forensic analysis
    forensic_data = analyze_document_forensics(file.filename, file_hash)

    doc = Document(
        user_id=current_user.id,
        application_id=app.id,
        filename=file.filename,
        document_type=document_type,
        file_hash=file_hash,
        file_path=str(save_path),
        forensic_result=forensic_data["forensic_result"],
        confidence=forensic_data["confidence"],
        metadata_json=json.dumps(forensic_data)
    )
    db.add(doc)

    # Update application document status
    app.document_status = forensic_data["forensic_result"]
    if forensic_data["is_tampered"]:
        app.risk_score = max(app.risk_score, 75)
        app.risk_level = "HIGH"
    db.commit()
    db.refresh(doc)

    # Append to cryptographic verification ledger
    append_ledger_record(
        db=db,
        user_id=current_user.id,
        application_id=app.id,
        artifact_type=f"Uploaded Document ({document_type})",
        artifact_hash=file_hash,
        metadata={"filename": file.filename, "tampering_detected": forensic_data["is_tampered"]}
    )

    # Log audit event
    audit = AuditEvent(
        user_id=current_user.id,
        event_type="DOCUMENT_UPLOAD",
        description=f"Uploaded document {file.filename} (Hash: {file_hash[:8]}...) for {app.application_number}",
        user_email=current_user.email,
        application_id=app.id
    )
    db.add(audit)
    db.commit()

    return DocumentResponse(
        id=doc.id,
        application_id=doc.application_id,
        application_number=app.application_number,
        filename=doc.filename,
        document_type=doc.document_type,
        file_hash=doc.file_hash,
        forensic_result=doc.forensic_result,
        confidence=doc.confidence,
        forensics=DocumentForensicDetails(
            font_consistency=forensic_data["font_consistency"],
            layout_consistency=forensic_data["layout_consistency"],
            metadata_status=forensic_data["metadata_status"],
            transaction_formatting=forensic_data["transaction_formatting"],
            image_manipulation=forensic_data["image_manipulation"],
            tampering_indicators_count=forensic_data["tampering_indicators_count"],
            confidence=forensic_data["confidence"],
            is_tampered=forensic_data["is_tampered"],
            summary=forensic_data["summary"]
        ),
        created_at=doc.created_at
    )

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    meta = json.loads(doc.metadata_json or "{}")
    forensics = analyze_document_forensics(doc.filename, doc.file_hash)
    if meta:
        forensics.update(meta)

    return DocumentResponse(
        id=doc.id,
        application_id=doc.application_id,
        application_number=doc.application.application_number if doc.application else None,
        filename=doc.filename,
        document_type=doc.document_type,
        file_hash=doc.file_hash,
        forensic_result=doc.forensic_result,
        confidence=doc.confidence,
        forensics=DocumentForensicDetails(**forensics),
        created_at=doc.created_at
    )
