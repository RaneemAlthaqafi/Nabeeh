"""
Seed ports, inspectors, and generate realistic demo events over 30 days.
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

# Port risk profiles (realistic distribution)
# HIGH_TRAFFIC: More inspectors, more incidents
# MEDIUM_TRAFFIC: Moderate activity
# LOW_TRAFFIC: Few inspectors, rare incidents
PORT_PROFILES = {
    "port_01": {"traffic": "HIGH", "inspectors": (12, 18), "weekly_incidents": (8, 15)},    # جسر الملك فهد - busiest
    "port_02": {"traffic": "HIGH", "inspectors": (10, 15), "weekly_incidents": (6, 12)},    # البطحاء
    "port_06": {"traffic": "HIGH", "inspectors": (10, 14), "weekly_incidents": (5, 10)},    # سلوى
    "port_04": {"traffic": "MEDIUM", "inspectors": (6, 10), "weekly_incidents": (3, 7)},    # الخفجي
    "port_03": {"traffic": "MEDIUM", "inspectors": (6, 10), "weekly_incidents": (2, 6)},    # الحديثة
    "port_08": {"traffic": "MEDIUM", "inspectors": (5, 9), "weekly_incidents": (2, 5)},     # حالة عمار
    "port_05": {"traffic": "LOW", "inspectors": (4, 7), "weekly_incidents": (1, 3)},        # الرقعي
    "port_07": {"traffic": "LOW", "inspectors": (4, 7), "weekly_incidents": (1, 3)},        # الوديعة
    "port_10": {"traffic": "LOW", "inspectors": (3, 6), "weekly_incidents": (0, 2)},        # الطوال
    "port_11": {"traffic": "LOW", "inspectors": (3, 6), "weekly_incidents": (0, 2)},        # علب
    "port_09": {"traffic": "LOW", "inspectors": (2, 4), "weekly_incidents": (0, 1)},        # الربع الخالي
    "port_12": {"traffic": "LOW", "inspectors": (3, 5), "weekly_incidents": (0, 2)},        # الخضراء
}


def _generate_inspector_id() -> str:
    """Generate a masked inspector code like INS-A1B2C3."""
    chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"INS-{chars}"


def _random_ts_in_day(base_date: datetime) -> datetime:
    """Generate a random time during working hours (7am - 10pm)."""
    hour = random.randint(7, 22)
    minute = random.randint(0, 59)
    return base_date.replace(hour=hour, minute=minute, second=random.randint(0, 59))


def generate_inspectors(ports: List[Port], seed_value: int = 42) -> List[Inspector]:
    """Generate inspectors based on port traffic profile."""
    random.seed(seed_value)
    inspectors: List[Inspector] = []
    now = datetime.now(timezone.utc)
    
    for port in ports:
        profile = PORT_PROFILES.get(port.id, {"inspectors": (4, 8)})
        min_insp, max_insp = profile["inspectors"]
        num_inspectors = random.randint(min_insp, max_insp)
        
        for _ in range(num_inspectors):
            inspector = Inspector(
                id=_generate_inspector_id(),
                port_id=port.id,
                created_at=now - timedelta(days=random.randint(60, 365)),
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
    Generate realistic events distributed across weeks.
    - More incidents on busy days (Sunday-Thursday in Saudi)
    - Fewer on weekends (Friday-Saturday)
    - Realistic violation type distribution
    """
    random.seed(seed_value + 1)
    now = datetime.now(timezone.utc)
    events: List[Event] = []
    event_id = 0

    # Group inspectors by port
    inspectors_by_port = {}
    for inspector in inspectors:
        inspectors_by_port.setdefault(inspector.port_id, []).append(inspector)

    # Generate events day by day for realism
    for day_offset in range(days_back):
        current_date = now - timedelta(days=day_offset)
        day_of_week = current_date.weekday()  # 0=Monday, 4=Friday, 5=Saturday, 6=Sunday
        
        # Saudi work week: Sunday(6) to Thursday(3)
        # Friday(4) and Saturday(5) are weekend
        is_weekend = day_of_week in [4, 5]
        
        for port in ports:
            profile = PORT_PROFILES.get(port.id, {"weekly_incidents": (1, 3)})
            min_weekly, max_weekly = profile["weekly_incidents"]
            
            # Calculate daily incidents (weekly / 7, adjusted for weekday/weekend)
            if is_weekend:
                # 70% fewer incidents on weekends
                daily_incidents = random.randint(0, max(1, max_weekly // 10))
            else:
                # Normal distribution across 5 working days
                daily_incidents = random.randint(0, max(1, (max_weekly * 2) // 7))
            
            # Get inspectors for this port
            port_inspectors = inspectors_by_port.get(port.id, [])
            if not port_inspectors or daily_incidents == 0:
                continue
            
            for _ in range(daily_incidents):
                event_id += 1
                inspector = random.choice(port_inspectors)
                ts = _random_ts_in_day(current_date)
                
                # Violation type distribution (realistic)
                # Most common: smoking, camera issues
                # Less common: shouting
                # Rare: violence, abusive language
                violation_weights = {
                    "smoking": 25,
                    "camera_shake": 20,
                    "camera_blocking": 15,
                    "camera_misuse": 12,
                    "shouting": 15,
                    "abusive_language": 8,
                    "violence": 5,
                }
                vtype = random.choices(
                    list(violation_weights.keys()),
                    weights=list(violation_weights.values()),
                )[0]
                
                # Source based on type
                source = EventSource.AUDIO if vtype in VIOLATION_TYPES_AUDIO else EventSource.VIDEO
                
                # Severity distribution (realistic)
                # Most violations are LOW or MEDIUM
                severity = random.choices(
                    [Severity.LOW, Severity.MEDIUM, Severity.HIGH],
                    weights=[0.55, 0.35, 0.10],  # 55% low, 35% medium, 10% high
                )[0]
                
                confidence = round(random.uniform(0.70, 0.98), 2)
                
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
