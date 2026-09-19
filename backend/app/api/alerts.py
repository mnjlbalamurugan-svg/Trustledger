from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Alert, AuditEvent, User
from ..schemas import AlertResponse, UpdateAlertStatus
from ..security import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert).filter(Alert.user_id == current_user.id)
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())

    alerts = query.order_by(Alert.created_at.desc()).all()
    results = []
    for a in alerts:
        app = a.application
        applicant_name = app.applicant.name if app and app.applicant else "Unknown Applicant"
        results.append(AlertResponse(
            id=a.id,
            application_id=a.application_id,
            application_number=app.application_number if app else "TL-UNKNOWN",
            applicant_name=applicant_name,
            severity=a.severity,
            title=a.title,
            description=a.description,
            detection_layer=a.detection_layer,
            status=a.status,
            created_at=a.created_at,
            resolved_at=a.resolved_at
        ))
    return results

@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert_status(
    alert_id: str,
    payload: UpdateAlertStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = payload.status
    if payload.status == "RESOLVED":
        alert.resolved_at = datetime.utcnow()
    db.commit()

    audit = AuditEvent(
        user_id=current_user.id,
        event_type="ALERT_STATUS_CHANGED",
        description=f"Alert '{alert.title}' status updated to {payload.status}",
        application_id=alert.application_id,
        user_email=current_user.email
    )
    db.add(audit)
    db.commit()

    app = alert.application
    return AlertResponse(
        id=alert.id,
        application_id=alert.application_id,
        application_number=app.application_number if app else "TL-UNKNOWN",
        applicant_name=app.applicant.name if app and app.applicant else "Unknown",
        severity=alert.severity,
        title=alert.title,
        description=alert.description,
        detection_layer=alert.detection_layer,
        status=alert.status,
        created_at=alert.created_at,
        resolved_at=alert.resolved_at
    )
