"""
Analytics API: Summary, Ports, Port Details, Inspectors.
Implements proper KPI semantics: unique inspectors vs incident counts.
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Query

from app.data.store import (
    get_all_events,
    get_all_ports,
    get_all_inspectors,
    get_port_by_id,
    get_inspector_by_id,
    get_ports_map,
)
from app.models import (
    Event,
    NationwideSummary,
    PortSummary,
    PortDetail,
    InspectorSummary,
    InspectorDetail,
    ALL_VIOLATION_TYPES,
)
from app.services.risk import compute_risk_score, risk_level

router = APIRouter(prefix="/api", tags=["analytics"])


def _parse_dt(s: str) -> datetime:
    """Parse ISO date string to datetime."""
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_date", "message": str(e)}
        )


def _filter_events(
    events: List[Event],
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    port_id: Optional[str] = None,
    violation_type: Optional[str] = None,
    severity: Optional[str] = None,
    inspector_id: Optional[str] = None,
) -> List[Event]:
    """Filter events by multiple criteria."""
    result = events
    
    if from_ts:
        result = [e for e in result if e.timestamp >= from_ts]
    if to_ts:
        result = [e for e in result if e.timestamp <= to_ts]
    if port_id:
        result = [e for e in result if e.port_id == port_id]
    if violation_type:
        result = [e for e in result if e.type == violation_type]
    if severity:
        result = [e for e in result if e.severity.value == severity]
    if inspector_id:
        result = [e for e in result if e.inspector_id == inspector_id]
    
    return result


def _get_unique_inspectors(events: List[Event]) -> set:
    """Get set of unique inspector IDs from events."""
    return {e.inspector_id for e in events}


def _get_violations_breakdown(events: List[Event]) -> dict:
    """Count events by violation type."""
    counts = {}
    for e in events:
        counts[e.type] = counts.get(e.type, 0) + 1
    return counts


def _get_severity_breakdown(events: List[Event]) -> dict:
    """Count events by severity."""
    counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for e in events:
        counts[e.severity.value] = counts.get(e.severity.value, 0) + 1
    return counts


def _get_last_incident_at(events: List[Event]) -> Optional[str]:
    """Get timestamp of most recent event."""
    if not events:
        return None
    return max(e.timestamp for e in events).isoformat()


# =============================================================================
# GET /api/summary - Nationwide aggregates
# =============================================================================
@router.get("/summary", response_model=NationwideSummary)
def get_summary(
    from_: str = Query(..., alias="from", description="ISO date"),
    to: str = Query(..., description="ISO date"),
    violation_type: Optional[str] = Query(None, alias="violationType"),
    severity: Optional[str] = Query(None),
):
    """
    Get nationwide summary with proper KPI semantics.
    Returns: total risk, incident count, UNIQUE inspectors impacted.
    """
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"}
        )
    
    events = get_all_events()
    filtered = _filter_events(
        events,
        from_ts=from_ts,
        to_ts=to_ts,
        violation_type=violation_type,
        severity=severity,
    )
    
    unique_inspectors = _get_unique_inspectors(filtered)
    ports_affected = {e.port_id for e in filtered}
    total_score = compute_risk_score(filtered)
    
    return NationwideSummary(
        total_risk_score=round(total_score, 2),
        total_incidents=len(filtered),
        total_inspectors_impacted=len(unique_inspectors),
        total_ports_affected=len(ports_affected),
        last_incident_at=_get_last_incident_at(filtered),
        incidents_by_severity=_get_severity_breakdown(filtered),
        incidents_by_violation=_get_violations_breakdown(filtered),
    )


# =============================================================================
# GET /api/ports - List ports with risk metrics
# =============================================================================
@router.get("/ports", response_model=List[PortSummary])
def get_ports_list(
    from_: str = Query(..., alias="from", description="ISO date"),
    to: str = Query(..., description="ISO date"),
    violation_type: Optional[str] = Query(None, alias="violationType"),
    severity: Optional[str] = Query(None),
):
    """
    Get all ports with risk scores and UNIQUE inspector counts.
    """
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"}
        )
    
    ports = get_all_ports()
    all_events = get_all_events()
    
    result = []
    for port in ports:
        port_events = _filter_events(
            all_events,
            from_ts=from_ts,
            to_ts=to_ts,
            port_id=port.id,
            violation_type=violation_type,
            severity=severity,
        )
        
        unique_inspectors = _get_unique_inspectors(port_events)
        score = compute_risk_score(port_events)
        level = risk_level(score)
        
        result.append(PortSummary(
            id=port.id,
            name_ar=port.name_ar,
            name_en=port.name_en,
            lat=port.lat,
            lng=port.lng,
            risk_score=round(score, 2),
            risk_level=level,
            incident_count=len(port_events),
            unique_inspectors_count=len(unique_inspectors),
            last_incident_at=_get_last_incident_at(port_events),
        ))
    
    return result


# =============================================================================
# GET /api/ports/{port_id}/details - Port detail with inspectors
# =============================================================================
@router.get("/ports/{port_id}/details", response_model=PortDetail)
def get_port_details(
    port_id: str,
    from_: str = Query(..., alias="from", description="ISO date"),
    to: str = Query(..., description="ISO date"),
    violation_type: Optional[str] = Query(None, alias="violationType"),
    severity: Optional[str] = Query(None),
):
    """
    Get detailed port info with top inspectors and recent incidents.
    """
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"}
        )
    
    port = get_port_by_id(port_id)
    if not port:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"Port {port_id} not found"}
        )
    
    all_events = get_all_events()
    port_events = _filter_events(
        all_events,
        from_ts=from_ts,
        to_ts=to_ts,
        port_id=port_id,
        violation_type=violation_type,
        severity=severity,
    )
    
    unique_inspectors = _get_unique_inspectors(port_events)
    score = compute_risk_score(port_events)
    level = risk_level(score)
    
    # Build top inspectors list (by incident count)
    inspector_incidents = {}
    for e in port_events:
        inspector_incidents.setdefault(e.inspector_id, []).append(e)
    
    top_inspectors = []
    for insp_id, insp_events in sorted(
        inspector_incidents.items(),
        key=lambda x: len(x[1]),
        reverse=True
    )[:10]:
        insp_score = compute_risk_score(insp_events)
        top_inspectors.append(InspectorSummary(
            id=insp_id,
            risk_level=risk_level(insp_score),
            risk_score=round(insp_score, 2),
            incident_count=len(insp_events),
            last_incident_at=_get_last_incident_at(insp_events),
        ))
    
    # Recent incidents
    sorted_events = sorted(port_events, key=lambda e: e.timestamp, reverse=True)[:10]
    recent_incidents = [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "type": e.type,
            "severity": e.severity.value,
            "inspector_id": e.inspector_id,
            "confidence": e.confidence,
        }
        for e in sorted_events
    ]
    
    return PortDetail(
        id=port.id,
        name_ar=port.name_ar,
        name_en=port.name_en,
        lat=port.lat,
        lng=port.lng,
        risk_score=round(score, 2),
        risk_level=level,
        incident_count=len(port_events),
        unique_inspectors_count=len(unique_inspectors),
        last_incident_at=_get_last_incident_at(port_events),
        violations_breakdown=_get_violations_breakdown(port_events),
        severity_breakdown=_get_severity_breakdown(port_events),
        top_inspectors=top_inspectors,
        recent_incidents=recent_incidents,
    )


# =============================================================================
# GET /api/inspectors/{inspector_id} - Inspector analytics
# =============================================================================
@router.get("/inspectors/{inspector_id}", response_model=InspectorDetail)
def get_inspector_details(
    inspector_id: str,
    from_: str = Query(..., alias="from", description="ISO date"),
    to: str = Query(..., description="ISO date"),
    port_id: Optional[str] = Query(None),
    violation_type: Optional[str] = Query(None, alias="violationType"),
    severity: Optional[str] = Query(None),
):
    """
    Get inspector analytics with violation breakdown and recent incidents.
    """
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"}
        )
    
    inspector = get_inspector_by_id(inspector_id)
    if not inspector:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"Inspector {inspector_id} not found"}
        )
    
    all_events = get_all_events()
    insp_events = _filter_events(
        all_events,
        from_ts=from_ts,
        to_ts=to_ts,
        inspector_id=inspector_id,
        port_id=port_id,
        violation_type=violation_type,
        severity=severity,
    )
    
    score = compute_risk_score(insp_events)
    level = risk_level(score)
    ports_affected = list({e.port_id for e in insp_events})
    
    # Recent incidents
    sorted_events = sorted(insp_events, key=lambda e: e.timestamp, reverse=True)[:20]
    ports_map = get_ports_map()
    recent_incidents = [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "type": e.type,
            "severity": e.severity.value,
            "port_id": e.port_id,
            "port_name_ar": ports_map.get(e.port_id, {}).name_ar if ports_map.get(e.port_id) else "",
            "port_name_en": ports_map.get(e.port_id, {}).name_en if ports_map.get(e.port_id) else "",
            "confidence": e.confidence,
        }
        for e in sorted_events
    ]
    
    return InspectorDetail(
        id=inspector_id,
        risk_score=round(score, 2),
        risk_level=level,
        total_incidents=len(insp_events),
        last_incident_at=_get_last_incident_at(insp_events),
        violations_breakdown=_get_violations_breakdown(insp_events),
        severity_breakdown=_get_severity_breakdown(insp_events),
        ports_affected=ports_affected,
        recent_incidents=recent_incidents,
    )


# =============================================================================
# GET /api/inspectors - List inspectors (filtered)
# =============================================================================
@router.get("/inspectors")
def get_inspectors_list(
    from_: str = Query(..., alias="from", description="ISO date"),
    to: str = Query(..., description="ISO date"),
    port_id: Optional[str] = Query(None),
    violation_type: Optional[str] = Query(None, alias="violationType"),
    severity: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """
    Get list of inspectors with incidents in the given filters.
    Returns UNIQUE inspectors who have at least one incident.
    """
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"}
        )
    
    all_events = get_all_events()
    filtered = _filter_events(
        all_events,
        from_ts=from_ts,
        to_ts=to_ts,
        port_id=port_id,
        violation_type=violation_type,
        severity=severity,
    )
    
    # Group by inspector
    inspector_events = {}
    for e in filtered:
        inspector_events.setdefault(e.inspector_id, []).append(e)
    
    # Build summaries sorted by incident count
    inspectors = []
    for insp_id, events in sorted(
        inspector_events.items(),
        key=lambda x: len(x[1]),
        reverse=True
    )[:limit]:
        score = compute_risk_score(events)
        inspectors.append({
            "id": insp_id,
            "risk_score": round(score, 2),
            "risk_level": risk_level(score),
            "incident_count": len(events),
            "last_incident_at": _get_last_incident_at(events),
        })
    
    return {
        "total_unique_inspectors": len(inspector_events),
        "inspectors": inspectors,
    }


# =============================================================================
# Legacy endpoints for backward compatibility
# =============================================================================
@router.get("/heatmap")
def get_heatmap(
    from_: str = Query(..., alias="from", description="ISO date"),
    to: str = Query(..., description="ISO date"),
    violation_type: Optional[str] = Query(None, alias="violationType"),
    severity: Optional[str] = Query(None),
):
    """Generate heatmap points with risk intensity."""
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"}
        )
    
    ports = get_all_ports()
    all_events = get_all_events()
    
    heat_points = []
    for port in ports:
        port_events = _filter_events(
            all_events,
            from_ts=from_ts,
            to_ts=to_ts,
            port_id=port.id,
            violation_type=violation_type,
            severity=severity,
        )
        score = compute_risk_score(port_events)
        # intensity 0-1 for leaflet.heat; normalize by 50 for demo
        intensity = min(1.0, score / 50.0) if score else 0
        heat_points.append([port.lat, port.lng, intensity])
    
    return {
        "points": heat_points,
        "from": from_ts.isoformat(),
        "to": to_ts.isoformat(),
    }


@router.get("/kpis")
def get_kpis(
    port_id: str = Query(..., description="Port ID"),
    from_: str = Query(..., alias="from"),
    to: str = Query(...),
    violation_type: Optional[str] = Query(None, alias="violationType"),
    severity: Optional[str] = Query(None),
):
    """Get KPIs for a specific port."""
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"}
        )
    
    port = get_port_by_id(port_id)
    if not port:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"Port {port_id} not found"}
        )
    
    all_events = get_all_events()
    events = _filter_events(
        all_events,
        from_ts=from_ts,
        to_ts=to_ts,
        port_id=port_id,
        violation_type=violation_type,
        severity=severity,
    )
    
    unique_inspectors = _get_unique_inspectors(events)
    score = compute_risk_score(events)
    level = risk_level(score)
    
    return {
        "port_id": port_id,
        "from": from_ts.isoformat(),
        "to": to_ts.isoformat(),
        "risk_score": round(score, 2),
        "risk_level": level,
        "counts": _get_violations_breakdown(events),
        "total_events": len(events),
        "unique_inspectors": len(unique_inspectors),
        "last_incident_at": _get_last_incident_at(events),
    }


@router.get("/incidents")
def get_incidents(
    port_id: str = Query(..., description="Port ID"),
    from_: str = Query(..., alias="from"),
    to: str = Query(...),
    violation_type: Optional[str] = Query(None, alias="violationType"),
    severity: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
):
    """Get incidents for a port."""
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"}
        )
    
    port = get_port_by_id(port_id)
    if not port:
        raise HTTPException(
            status_code=404,
            detail={"error": "not_found", "message": f"Port {port_id} not found"}
        )
    
    all_events = get_all_events()
    events = _filter_events(
        all_events,
        from_ts=from_ts,
        to_ts=to_ts,
        port_id=port_id,
        violation_type=violation_type,
        severity=severity,
    )
    
    sorted_events = sorted(events, key=lambda e: e.timestamp, reverse=True)[:limit]
    
    return {
        "port_id": port_id,
        "from": from_ts.isoformat(),
        "to": to_ts.isoformat(),
        "incidents": [e.model_dump(mode="json") for e in sorted_events],
    }
