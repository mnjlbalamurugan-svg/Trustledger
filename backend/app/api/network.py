from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Application, FraudLink, User
from ..schemas import NetworkGraphResponse, NetworkNode, NetworkEdge
from ..security import get_current_user

router = APIRouter(prefix="/api/network", tags=["Fraud Network"])

@router.get("", response_model=NetworkGraphResponse)
@router.get("/{app_id_or_number}", response_model=NetworkGraphResponse)
def get_network_graph(
    app_id_or_number: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    if not apps:
        return NetworkGraphResponse(
            application_id=None,
            application_number=None,
            network_risk="CLEAN",
            connected_applications_count=0,
            potential_ring_detected=False,
            summary="No fraud relationships detected yet. Applications will appear here as you add and analyze lending requests.",
            nodes=[],
            edges=[],
            disclaimer="Dynamic fraud network graph calculates entity collisions in real-time."
        )

    # Find target application if specified
    target = None
    if app_id_or_number:
        target = db.query(Application).filter(
            Application.user_id == current_user.id,
            (Application.id == app_id_or_number) | (Application.application_number == app_id_or_number)
        ).first()

    if not target:
        # Default to first high-risk application or first application
        target = next((a for a in apps if a.risk_level in ["HIGH", "CRITICAL"]), apps[0])

    # Fetch fraud links for this user
    links = db.query(FraudLink).filter(FraudLink.user_id == current_user.id).all()

    # Find relevant applications connected by links or target
    connected_app_ids = set()
    connected_app_ids.add(target.id)
    for l in links:
        if l.source_application_id == target.id:
            connected_app_ids.add(l.target_application_id)
        elif l.target_application_id == target.id:
            connected_app_ids.add(l.source_application_id)

    # If there are no links, just show all user applications (up to 5)
    if len(connected_app_ids) == 1 and len(apps) > 1:
        for a in apps[:5]:
            connected_app_ids.add(a.id)

    nodes = []
    for a in apps:
        if a.id in connected_app_ids:
            nodes.append(NetworkNode(
                id=a.application_number,
                label=a.application_number,
                applicant_name=a.applicant.name if a.applicant else "Applicant",
                risk_score=a.risk_score,
                risk_level=a.risk_level,
                is_central=(a.id == target.id),
                status=a.status.replace("_", " "),
                loan_amount=f"₹{a.requested_amount:,.0f}"
            ))

    edges = []
    for l in links:
        src = db.query(Application).filter(Application.id == l.source_application_id).first()
        tgt = db.query(Application).filter(Application.id == l.target_application_id).first()
        if src and tgt and src.id in connected_app_ids and tgt.id in connected_app_ids:
            edges.append(NetworkEdge(
                id=l.id,
                source=src.application_number,
                target=tgt.application_number,
                relationship=l.relationship_type,
                confidence=l.confidence
            ))

    is_ring = len(edges) >= 2 or any(l.relationship_type in ["Shared Bank Account", "Shared Device"] for l in links)
    risk_level = "HIGH" if is_ring else "MEDIUM" if edges else "CLEAN"
    summary = (
        f"Detected {len(edges)} cross-application link(s) across {len(nodes)} applicant(s)."
        if edges else "No cross-application fraud relationships identified among active applications."
    )

    return NetworkGraphResponse(
        application_id=target.id,
        application_number=target.application_number,
        network_risk=risk_level,
        connected_applications_count=len(nodes) - 1 if len(nodes) > 1 else 0,
        potential_ring_detected=is_ring,
        summary=summary,
        nodes=nodes,
        edges=edges,
        disclaimer="Graph linkage indicates correlated metadata across applications in your tenant."
    )
