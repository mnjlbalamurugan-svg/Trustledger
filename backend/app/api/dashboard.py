from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Application, Alert, Document, KYCSession, AuditEvent, User
from ..schemas import DashboardSummaryResponse, RiskTrendPoint, AlertResponse, AuditEventResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    apps_count = len(apps)

    high_risk_count = sum(1 for a in apps if a.risk_level in ["HIGH", "CRITICAL"])
    doc_flagged = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.forensic_result.in_(["SUSPICIOUS", "MANIPULATED"])
    ).count()
    kyc_alerts_count = db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.detection_layer.contains("KYC")
    ).count()

    dist = {
        "Low": sum(1 for a in apps if a.risk_level == "LOW"),
        "Medium": sum(1 for a in apps if a.risk_level == "MEDIUM"),
        "High": sum(1 for a in apps if a.risk_level == "HIGH"),
        "Critical": sum(1 for a in apps if a.risk_level == "CRITICAL")
    }

    return DashboardSummaryResponse(
        applications_reviewed=apps_count,
        high_risk_applications=high_risk_count,
        documents_flagged=doc_flagged,
        kyc_alerts=kyc_alerts_count,
        risk_distribution=dist
    )

@router.get("/risk-trend", response_model=List[RiskTrendPoint])
def get_risk_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns risk trend data calculated from user's actual applications over the last 14 days.
    If no applications exist, returns empty data points with 0 values.
    """
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    base_date = datetime.utcnow().date() - timedelta(days=13)

    trend = []
    for i in range(14):
        target_date = base_date + timedelta(days=i)
        day_apps = [a for a in apps if a.created_at.date() == target_date]
        day_flagged = [a for a in day_apps if a.risk_level in ["HIGH", "CRITICAL"]]
        avg_risk = sum(a.risk_score for a in day_apps) / len(day_apps) if day_apps else 0.0

        trend.append(RiskTrendPoint(
            date=target_date.strftime("%b %d"),
            reviewed=len(day_apps),
            flagged=len(day_flagged),
            avg_risk=round(avg_risk, 1)
        ))

    return trend

@router.get("/alerts", response_model=List[AlertResponse])
def get_recent_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alerts = db.query(Alert).filter(
        Alert.user_id == current_user.id
    ).order_by(Alert.created_at.desc()).limit(10).all()

    res = []
    for a in alerts:
        app = a.application
        applicant_name = app.applicant.name if app and app.applicant else "Unknown Applicant"
        res.append(AlertResponse(
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
    return res

@router.get("/audit-events", response_model=List[AuditEventResponse])
def get_audit_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    events = db.query(AuditEvent).filter(
        AuditEvent.user_id == current_user.id
    ).order_by(AuditEvent.created_at.desc()).limit(20).all()
    return events
