from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models import Application, FraudLink

def get_fraud_network_graph(db: Session, app_number: str) -> Dict[str, Any]:
    """
    Returns graph representation centered around target application.
    Center: TL-10482 (Electric Violet)
    Connected:
    - TL-10391 (Mint - Verified/Clean)
    - TL-10401 (Coral - Suspicious/Tampered Document)
    - TL-10417 (Coral - Suspicious/Deepfake KYC)
    Edges: Shared Device, Shared Bank Account, Similar Identity Data, Shared IP Cluster
    """
    target = db.query(Application).filter(Application.application_number == app_number).first()
    if not target:
        target = db.query(Application).filter(Application.application_number == "TL-10482").first()

    nodes = [
        {
            "id": "TL-10482",
            "label": "TL-10482",
            "applicant_name": "Arun Kumar",
            "risk_score": 82,
            "risk_level": "HIGH",
            "is_central": (target.application_number == "TL-10482") if target else True,
            "status": "Target Investigation (Under Review)",
            "loan_amount": "₹750,000"
        },
        {
            "id": "TL-10401",
            "label": "TL-10401",
            "applicant_name": "Ravi Kumar",
            "risk_score": 67,
            "risk_level": "HIGH",
            "is_central": False,
            "status": "Document Tampering Flagged",
            "loan_amount": "₹600,000"
        },
        {
            "id": "TL-10417",
            "label": "TL-10417",
            "applicant_name": "Sanjay Raj",
            "risk_score": 74,
            "risk_level": "HIGH",
            "is_central": False,
            "status": "KYC Deepfake Flagged",
            "loan_amount": "₹900,000"
        },
        {
            "id": "TL-10391",
            "label": "TL-10391",
            "applicant_name": "Priya Sharma",
            "risk_score": 24,
            "risk_level": "LOW",
            "is_central": False,
            "status": "Verified / Clean Applicant",
            "loan_amount": "₹350,000"
        }
    ]

    edges = [
        {
            "id": "edge-1",
            "source": "TL-10482",
            "target": "TL-10401",
            "relationship": "Shared Device (Pixel 7 Pro - IMEI: 8642...)",
            "confidence": 98.4
        },
        {
            "id": "edge-2",
            "source": "TL-10482",
            "target": "TL-10401",
            "relationship": "Shared Bank Account (HDFC ****9102)",
            "confidence": 99.1
        },
        {
            "id": "edge-3",
            "source": "TL-10482",
            "target": "TL-10417",
            "relationship": "Similar Identity Data (PAN anagram & phone proximity)",
            "confidence": 91.2
        },
        {
            "id": "edge-4",
            "source": "TL-10482",
            "target": "TL-10391",
            "relationship": "Shared IP Cluster (Subnet 103.24.81.0/24 - Commercial WiFi)",
            "confidence": 64.0
        }
    ]

    return {
        "application_id": target.id if target else "TL-10482",
        "application_number": target.application_number if target else "TL-10482",
        "network_risk": "HIGH",
        "connected_applications_count": 3,
        "potential_ring_detected": True,
        "summary": "Potential coordinated activity: 3 linked applications sharing critical biometric, device, and banking vectors.",
        "nodes": nodes,
        "edges": edges,
        "disclaimer": "Graph linkage indicates correlated metadata; manual verification required before regulatory action."
    }
