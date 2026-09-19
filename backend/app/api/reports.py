import csv
import io
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Application, Alert, Document, User
from ..security import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/summary")
def get_reports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    total_apps = len(apps)

    fraud_alerts = db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.severity.in_(["HIGH", "CRITICAL"])
    ).count()

    doc_alerts = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.forensic_result.in_(["SUSPICIOUS", "MANIPULATED"])
    ).count()

    kyc_alerts = db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.detection_layer.contains("KYC")
    ).count()

    network_alerts = db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.detection_layer.contains("Network")
    ).count()

    cleared = sum(1 for a in apps if a.status == "CLEARED")
    success_rate = f"{(cleared / total_apps * 100):.1f}%" if total_apps > 0 else "0.0%"

    return {
        "metrics": {
            "total_applications": total_apps,
            "fraud_alerts": fraud_alerts,
            "document_alerts": doc_alerts,
            "kyc_alerts": kyc_alerts,
            "network_alerts": network_alerts,
            "verification_success_rate": success_rate
        },
        "alerts_by_layer": [
            {"layer": "Document Forensics", "count": doc_alerts},
            {"layer": "Fraud Network Rings", "count": network_alerts},
            {"layer": "KYC & Biometrics", "count": kyc_alerts}
        ],
        "application_outcomes": [
            {"name": "Cleared & Funded", "value": cleared, "color": "#62D6A7"},
            {"name": "Under Review", "value": sum(1 for a in apps if "REVIEW" in a.status), "color": "#F4A340"},
            {"name": "Quarantined / Manual Review", "value": sum(1 for a in apps if a.status == "QUARANTINED"), "color": "#F05A5A"}
        ]
    }

@router.get("/export")
def export_report_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Application Number", "Applicant Name", "Requested Amount (INR)",
        "Loan Purpose", "Risk Score", "Risk Level", "Status",
        "Document Status", "KYC Status", "Network Flag", "Created At"
    ])

    for a in apps:
        writer.writerow([
            a.application_number,
            a.applicant.name if a.applicant else "N/A",
            a.requested_amount,
            a.loan_purpose,
            a.risk_score,
            a.risk_level,
            a.status,
            a.document_status,
            a.kyc_status,
            a.network_flag,
            a.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trustledger_portfolio_report.csv"}
    )
