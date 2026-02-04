"""
Heatmap, KPIs, and incidents API.
Validates from/to (ISO) and port_id.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.data.store import get_all_events, get_all_ports
from app.models import Port
from app.services.risk import compute_risk_score, risk_level

router = APIRouter(prefix="/api", tags=["analytics"])


def _parse_dt(s: str) -> datetime:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=400, detail={"error": "invalid_date", "message": str(e)})


def _events_in_range(
    from_ts: datetime,
    to_ts: datetime,
    port_id: Optional[str] = None,
):
    events = get_all_events()
    if port_id is not None:
        events = [e for e in events if e.port_id == port_id]
    return [e for e in events if from_ts <= e.timestamp <= to_ts]


@router.get("/heatmap")
def get_heatmap(
    from_: str = Query(..., alias="from", description="ISO date"),
    to: str = Query(..., description="ISO date"),
):
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    if from_ts > to_ts:
        raise HTTPException(
            status_code=400,
            detail={"error": "invalid_range", "message": "from must be before to"},
        )
    ports = get_all_ports()
    events = _events_in_range(from_ts, to_ts)
    # Points for heat layer: [lat, lng, intensity]
    port_events: dict[str, list] = {}
    for e in events:
        port_events.setdefault(e.port_id, []).append(e)
    heat_points = []
    for p in ports:
        es = port_events.get(p.id, [])
        score = compute_risk_score(es)
        # intensity 0-1 for leaflet.heat; normalize by 50 for demo
        intensity = min(1.0, score / 50.0) if score else 0
        heat_points.append([p.lat, p.lng, intensity])
    return {"points": heat_points, "from": from_ts.isoformat(), "to": to_ts.isoformat()}


@router.get("/kpis")
def get_kpis(
    port_id: str = Query(..., description="Port ID"),
    from_: str = Query(..., alias="from"),
    to: str = Query(...),
):
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    if from_ts > to_ts:
        raise HTTPException(status_code=400, detail={"error": "invalid_range", "message": "from must be before to"})
    ports = {p.id: p for p in get_all_ports()}
    if port_id not in ports:
        raise HTTPException(status_code=400, detail={"error": "invalid_port_id", "message": f"Unknown port_id: {port_id}"})
    events = _events_in_range(from_ts, to_ts, port_id)
    counts: dict[str, int] = {}
    for e in events:
        counts[e.type] = counts.get(e.type, 0) + 1
    score = compute_risk_score(events)
    level = risk_level(score)
    return {
        "port_id": port_id,
        "from": from_ts.isoformat(),
        "to": to_ts.isoformat(),
        "risk_score": round(score, 2),
        "risk_level": level,
        "counts": counts,
        "total_events": len(events),
        "last_incident_at": (max(e.timestamp for e in events).isoformat() if events else None),
    }


@router.get("/incidents")
def get_incidents(
    port_id: str = Query(..., description="Port ID"),
    from_: str = Query(..., alias="from"),
    to: str = Query(...),
    limit: int = Query(50, ge=1, le=100),
):
    from_ts = _parse_dt(from_)
    to_ts = _parse_dt(to)
    if from_ts > to_ts:
        raise HTTPException(status_code=400, detail={"error": "invalid_range", "message": "from must be before to"})
    ports = {p.id: p for p in get_all_ports()}
    if port_id not in ports:
        raise HTTPException(status_code=400, detail={"error": "invalid_port_id", "message": f"Unknown port_id: {port_id}"})
    events = _events_in_range(from_ts, to_ts, port_id)
    sorted_events = sorted(events, key=lambda e: e.timestamp, reverse=True)[:limit]
    return {
        "port_id": port_id,
        "from": from_ts.isoformat(),
        "to": to_ts.isoformat(),
        "incidents": [e.model_dump(mode="json") for e in sorted_events],
    }
