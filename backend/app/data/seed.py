"""
Seed ports, inspectors, and generate demo events over 30 days.
Coordinates are approximate for dashboard visualization only.
"""
import random
import string
from datetime import datetime, timedelta, timezone
from typing import List, Tuple

from app.models import Event, EventSource, Inspector, Port, Severity

# -----------------------------------------------------------------------------
# Ports (approximate coordinates for visualization)
# -----------------------------------------------------------------------------
PORTS: List[Port] = [
    Port(id="port_01", name_ar="جسر الملك فهد", name_en="King Fahd Causeway", country="SA", lat=26.2049, lng=50.3270),
    Port(id="port_02", name_ar="منفذ البطحاء", name_en="Al Batha Port", country="SA", lat=24.0237, lng=51.5600),
    Port(id="port_03", name_ar="منفذ الحديثة", name_en="Al Haditha Port", country="SA", lat=31.7333, lng=37.2500),
    Port(id="port_04", name_ar="منفذ الخفجي", name_en="Al Khafji Port", country="SA", lat=28.4397, lng=48.4917),
    Port(id="port_05", name_ar="منفذ الرقعي", name_en="Al Ruqi Port", country="SA", lat=29.0417, lng=47.9333),
    Port(id="port_06", name_ar="منفذ سلوى", name_en="Salwa Port", country="SA", lat=24.5933, lng=50.7489),
    Port(id="port_07", name_ar="منفذ الوديعة", name_en="Al Wadiah Port", country="SA", lat=17.5167, lng=47.5167),
    Port(id="port_08", name_ar="منفذ حالة عمار", name_en="Halat Ammar Port", country="SA", lat=29.7350, lng=36.0847),
    Port(id="port_09", name_ar="منفذ الربع الخالي", name_en="Empty Quarter Port", country="SA", lat=19.0000, lng=52.0000),
    Port(id="port_10", name_ar="منفذ الطوال", name_en="Al Tuwal Port", country="SA", lat=16.9025, lng=42.6347),
    Port(id="port_11", name_ar="منفذ علب", name_en="Alb Port", country="SA", lat=18.2167, lng=42.7167),
    Port(id="port_12", name_ar="منفذ الخضراء", name_en="Al Khadra Port", country="SA", lat=28.8000, lng=48.0000),
]

VIOLATION_TYPES_VIDEO = ["violence", "camera_blocking", "camera_misuse", "camera_shake", "smoking"]
VIOLATION_TYPES_AUDIO = ["shouting", "abusive_language"]
ALL_TYPES = VIOLATION_TYPES_VIDEO + VIOLATION_TYPES_AUDIO

# Bias some ports to be higher risk in recent 24h for demo
HIGH_RISK_PORTS_24H = {"port_01", "port_04"}
MEDIUM_RISK_PORTS_24H = {"port_02", "port_06", "port_08"}


def _generate_inspector_id() -> str:
    """Generate a masked inspector code like INS-A1B2C3."""
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"INS-{chars}"


def _random_ts(from_ts: datetime, to_ts: datetime) -> datetime:
    delta = to_ts - from_ts
    sec = random.randint(0, int(delta.total_seconds()))
    return from_ts + timedelta(seconds=sec)


def generate_inspectors(ports: List[Port], seed_value: int = 42) -> List[Inspector]:
    """Generate ~8-15 inspectors per port."""
    random.seed(seed_value)
    inspectors: List[Inspector] = []
    now = datetime.now(timezone.utc)
    
    for port in ports:
        num_inspectors = random.randint(8, 15)
        for _ in range(num_inspectors):
            inspector = Inspector(
                id=_generate_inspector_id(),
                port_id=port.id,
                created_at=now - timedelta(days=random.randint(30, 365)),
            )
            inspectors.append(inspector)
    
    return inspectors


def generate_events(
    ports: List[Port],
    inspectors: List[Inspector],
    days_back: int = 30,
    seed_value: int = 42,
) -> List[Event]:
    """
    Generate demo events over the last N days.
    Each event is tied to an inspector at that port.
    Some ports are HIGH/MEDIUM risk in last 24h for demo purposes.
    """
    random.seed(seed_value + 1)  # Different seed for events
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days_back)
    events: List[Event] = []
    event_id = 0

    # Group inspectors by port
    inspectors_by_port = {}
    for inspector in inspectors:
        inspectors_by_port.setdefault(inspector.port_id, []).append(inspector)

    for _ in range(2500):  # More events for richer data
        event_id += 1
        port = random.choice(ports)
        ts = _random_ts(start, now)
        
        # Get random inspector from this port
        port_inspectors = inspectors_by_port.get(port.id, [])
        if not port_inspectors:
            continue
        inspector = random.choice(port_inspectors)

        is_video = random.random() > 0.35
        if is_video:
            vtype = random.choice(VIOLATION_TYPES_VIDEO)
            source = EventSource.VIDEO
        else:
            vtype = random.choice(VIOLATION_TYPES_AUDIO)
            source = EventSource.AUDIO

        # Last 24h: boost count for HIGH/MEDIUM demo ports
        last_24h = now - timedelta(hours=24)
        if ts >= last_24h:
            if port.id in HIGH_RISK_PORTS_24H and random.random() < 0.7:
                pass  # keep event
            elif port.id in MEDIUM_RISK_PORTS_24H and random.random() < 0.5:
                pass
            elif port.id not in HIGH_RISK_PORTS_24H and port.id not in MEDIUM_RISK_PORTS_24H and random.random() < 0.15:
                pass  # fewer events for others in 24h
            else:
                if port.id not in HIGH_RISK_PORTS_24H and port.id not in MEDIUM_RISK_PORTS_24H:
                    continue

        severity = random.choices(
            [Severity.LOW, Severity.MEDIUM, Severity.HIGH],
            weights=[0.5, 0.35, 0.15],
        )[0]
        confidence = round(random.uniform(0.6, 1.0), 2)

        events.append(
            Event(
                id=f"evt_{event_id}",
                port_id=port.id,
                inspector_id=inspector.id,
                timestamp=ts,
                source=source,
                type=vtype,
                severity=severity,
                confidence=confidence,
                short_description=None,
            )
        )

    return events


def seed_all(days_back: int = 30, seed_value: int = 42) -> Tuple[List[Port], List[Inspector], List[Event]]:
    """Generate all seed data."""
    ports = PORTS.copy()
    inspectors = generate_inspectors(ports, seed_value)
    events = generate_events(ports, inspectors, days_back, seed_value)
    return ports, inspectors, events


def get_ports() -> List[Port]:
    return PORTS.copy()
