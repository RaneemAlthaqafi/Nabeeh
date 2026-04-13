"""Smoke test: verify the core heatmap API contract is functional."""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.data.store import init_store
from app.main import app


@pytest.fixture(scope="module")
def client():
    init_store()
    with TestClient(app) as c:
        yield c


def _range(days: int = 7) -> dict:
    to = datetime.now(timezone.utc)
    from_ = to - timedelta(days=days)
    return {"from": from_.isoformat(), "to": to.isoformat()}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_summary_shape(client):
    r = client.get("/api/summary", params=_range())
    assert r.status_code == 200
    data = r.json()
    for key in (
        "total_risk_score",
        "total_incidents",
        "total_inspectors_impacted",
        "total_ports_affected",
    ):
        assert key in data, f"missing {key} in summary"


def test_ports_list(client):
    r = client.get("/api/ports", params=_range())
    assert r.status_code == 200
    ports = r.json()
    assert isinstance(ports, list)
    assert len(ports) > 0, "expected seeded ports"
    p = ports[0]
    for key in ("id", "lat", "lng", "risk_level", "name_ar", "name_en"):
        assert key in p, f"missing {key} in port summary"
    assert p["risk_level"] in ("HIGH", "MEDIUM", "LOW")


def test_heatmap_points(client):
    r = client.get("/api/heatmap", params=_range())
    assert r.status_code == 200
    data = r.json()
    assert "points" in data
    assert isinstance(data["points"], list)
    # Each point is [lat, lng, intensity] with intensity in [0, 1]
    for point in data["points"]:
        assert len(point) == 3
        lat, lng, intensity = point
        assert -90 <= lat <= 90
        assert -180 <= lng <= 180
        assert 0 <= intensity <= 1


def test_heatmap_rejects_invalid_range(client):
    to = datetime.now(timezone.utc)
    from_ = to + timedelta(days=1)
    r = client.get(
        "/api/heatmap",
        params={"from": from_.isoformat(), "to": to.isoformat()},
    )
    assert r.status_code == 400


def test_port_details(client):
    ports = client.get("/api/ports", params=_range()).json()
    assert ports, "need at least one port for this test"
    port_id = ports[0]["id"]
    r = client.get(f"/api/ports/{port_id}/details", params=_range())
    assert r.status_code == 200
    detail = r.json()
    assert detail["id"] == port_id


def test_violation_type_filter_applied(client):
    params = {**_range(), "violationType": "violence"}
    r = client.get("/api/heatmap", params=params)
    assert r.status_code == 200
    assert "points" in r.json()
