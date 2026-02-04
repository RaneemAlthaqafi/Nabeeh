"""
Seed ports and generate demo events over 30 days.
Coordinates are approximate for dashboard visualization only.
"""
import random
from datetime import datetime, timedelta, timezone
from typing import List

from app.models import Event, EventSource, Port, Severity

# -----------------------------------------------------------------------------
# Ports (approximate coordinates for visualization)
# -----------------------------------------------------------------------------
PORTS: List[Port] = [
    Port(id="port_01", name_ar="جسر الملك فهد", country="SA", lat=26.2049, lng=50.3270),
    Port(id="port_02", name_ar="منفذ البطحاء", country="SA", lat=24.0237, lng=51.5600),
    Port(id="port_03", name_ar="منفذ الحديثة", country="SA", lat=31.7333, lng=37.2500),
    Port(id="port_04", name_ar="منفذ الخفجي", country="SA", lat=28.4397, lng=48.4917),
    Port(id="port_05", name_ar="منفذ الرقعي", country="SA", lat=29.0417, lng=47.9333),
    Port(id="port_06", name_ar="منفذ سلوى", country="SA", lat=24.5933, lng=50.7489),
    Port(id="port_07", name_ar="منفذ الوديعة", country="SA", lat=17.5167, lng=47.5167),
    Port(id="port_08", name_ar="منفذ حالة عمار", country="SA", lat=29.7350, lng=36.0847),
    Port(id="port_09", name_ar="منفذ الربع الخالي", country="SA", lat=19.0000, lng=52.0000),
    Port(id="port_10", name_ar="منفذ الطوال", country="SA", lat=16.9025, lng=42.6347),
    Port(id="port_11", name_ar="منفذ علب", country="SA", lat=18.2167, lng=42.7167),
    Port(id="port_12", name_ar="منفذ الخضراء", country="SA", lat=28.8000, lng=48.0000),
]

VIOLATION_TYPES_VIDEO = ["violence", "camera_blocking", "camera_misuse", "camera_shake", "smoking"]
VIOLATION_TYPES_AUDIO = ["shouting", "abusive_language"]
ALL_TYPES = VIOLATION_TYPES_VIDEO + VIOLATION_TYPES_AUDIO

# Bias some ports to be higher risk in recent 24h for demo
HIGH_RISK_PORTS_24H = {"port_01", "port_04"}
MEDIUM_RISK_PORTS_24H = {"port_02", "port_06", "port_08"}


def _random_ts(from_ts: datetime, to_ts: datetime) -> datetime:
    delta = to_ts - from_ts
    sec = random.randint(0, int(delta.total_seconds()))
    return from_ts + timedelta(seconds=sec)


def generate_events(days_back: int = 30, seed_value: int = 42) -> List[Event]:
    """Generate demo events over the last N days. Some ports HIGH/MEDIUM in last 24h."""
    random.seed(seed_value)
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days_back)
    events: List[Event] = []
    event_id = 0

    for _ in range(1200):
        event_id += 1
        port = random.choice(PORTS)
        ts = _random_ts(start, now)
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
                timestamp=ts,
                source=source,
                type=vtype,
                severity=severity,
                confidence=confidence,
                short_description=None,
            )
        )

    return events


def get_ports() -> List[Port]:
    return PORTS.copy()
