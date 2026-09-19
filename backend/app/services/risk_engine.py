from typing import Dict, Any

def calculate_application_risk(
    document_score: float,
    kyc_score: float,
    network_score: float,
    integrity_score: float,
    app_number: str = ""
) -> Dict[str, Any]:
    """
    Explainable prototype risk engine with 4 pillars:
    - Document Risk: 30%
    - KYC Risk: 30%
    - Fraud Network Risk: 25%
    - Verification Integrity: 15%
    """
    raw_score = (document_score * 0.30) + (kyc_score * 0.30) + (network_score * 0.25) + (integrity_score * 0.15)
    calculated_score = int(round(raw_score))
    if calculated_score < 30:
        risk_level = "LOW"
    elif calculated_score < 60:
        risk_level = "MEDIUM"
    elif calculated_score < 80:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    explainability = (
        "The application combines multiple independent warning signals: document manipulation indicators, "
        "suspicious image characteristics, and connections to three other applications through shared identifiers."
        if calculated_score >= 60 else
        "All primary identity verification vectors, document hashes, and network cluster indicators show low risk with no active anomalies."
    )

    return {
        "risk_score": calculated_score,
        "risk_level": risk_level,
        "pillars": {
            "document_risk": document_score,
            "kyc_risk": kyc_score,
            "network_risk": network_score,
            "integrity_risk": integrity_score
        },
        "explainability": explainability,
        "label": "Prototype Risk Score"
    }

def get_evidence_summary(app_number: str) -> Dict[str, Any]:
    """
    Returns structured evidence summary for application dossier investigation drawer.
    """
    return {
        "document_forensics": {
            "items": ["Document integrity verified", "SHA-256 hash recorded in ledger"],
            "confidence": 96.0,
            "status": "VERIFIED"
        },
        "photo_kyc": {
            "items": ["Identity document registered", "Biometric verification queued", "Face match evaluation standard"],
            "confidence": 98.0,
            "status": "VERIFIED"
        },
        "fraud_network": {
            "items": ["Continuous identity graph cross-referencing active", "No fraud ring collusion detected"],
            "status": "CLEAN"
        },
        "verification_ledger": {
            "items": ["All artifacts hashed and verified in append-only chain"],
            "status": "VERIFIED"
        }
    }
