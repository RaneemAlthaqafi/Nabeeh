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

# Port risk profiles with distinct risk levels
# risk_bias: HIGH = more severe violations, MEDIUM = mixed, LOW = mostly minor
PORT_PROFILES = {
    # HIGH RISK PORTS - more incidents, more severe violations
    "port_01": {"traffic": "HIGH", "inspectors": (12, 18), "weekly_incidents": (12, 20), "risk_bias": "HIGH"},     # جسر الملك فهد - busiest, highest risk
    "port_02": {"traffic": "HIGH", "inspectors": (10, 15), "weekly_incidents": (10, 16), "risk_bias": "HIGH"},     # البطحاء - high risk
    
    # MEDIUM-HIGH RISK PORTS
    "port_06": {"traffic": "HIGH", "inspectors": (10, 14), "weekly_incidents": (7, 12), "risk_bias": "MEDIUM_HIGH"},  # سلوى
    "port_04": {"traffic": "MEDIUM", "inspectors": (6, 10), "weekly_incidents": (5, 9), "risk_bias": "MEDIUM_HIGH"},  # الخفجي
    
    # MEDIUM RISK PORTS
    "port_03": {"traffic": "MEDIUM", "inspectors": (6, 10), "weekly_incidents": (3, 6), "risk_bias": "MEDIUM"},    # الحديثة
    "port_08": {"traffic": "MEDIUM", "inspectors": (5, 9), "weekly_incidents": (3, 5), "risk_bias": "MEDIUM"},     # حالة عمار
    
    # LOW-MEDIUM RISK PORTS
    "port_05": {"traffic": "LOW", "inspectors": (4, 7), "weekly_incidents": (2, 4), "risk_bias": "LOW_MEDIUM"},    # الرقعي
    "port_07": {"traffic": "LOW", "inspectors": (4, 7), "weekly_incidents": (1, 3), "risk_bias": "LOW_MEDIUM"},    # الوديعة
    
    # LOW RISK PORTS - few incidents, mostly minor
    "port_10": {"traffic": "LOW", "inspectors": (3, 6), "weekly_incidents": (0, 2), "risk_bias": "LOW"},           # الطوال
    "port_11": {"traffic": "LOW", "inspectors": (3, 6), "weekly_incidents": (0, 2), "risk_bias": "LOW"},           # علب
    "port_09": {"traffic": "LOW", "inspectors": (2, 4), "weekly_incidents": (0, 1), "risk_bias": "LOW"},           # الربع الخالي
    "port_12": {"traffic": "LOW", "inspectors": (3, 5), "weekly_incidents": (0, 1), "risk_bias": "LOW"},           # الخضراء
}

# Severity weights based on risk bias
SEVERITY_WEIGHTS = {
    "HIGH": [0.20, 0.45, 0.35],         # 20% LOW, 45% MEDIUM, 35% HIGH
    "MEDIUM_HIGH": [0.35, 0.40, 0.25],  # 35% LOW, 40% MEDIUM, 25% HIGH
    "MEDIUM": [0.50, 0.35, 0.15],       # 50% LOW, 35% MEDIUM, 15% HIGH
    "LOW_MEDIUM": [0.60, 0.30, 0.10],   # 60% LOW, 30% MEDIUM, 10% HIGH
    "LOW": [0.75, 0.20, 0.05],          # 75% LOW, 20% MEDIUM, 5% HIGH
}

# Violation weights based on risk bias (more severe violations for high risk)
VIOLATION_WEIGHTS_BY_BIAS = {
    "HIGH": {
        "violence": 12, "abusive_language": 15, "camera_blocking": 18,
        "camera_misuse": 15, "smoking": 20, "camera_shake": 12, "shouting": 18,
    },
    "MEDIUM_HIGH": {
        "violence": 8, "abusive_language": 12, "camera_blocking": 16,
        "camera_misuse": 14, "smoking": 22, "camera_shake": 15, "shouting": 15,
    },
    "MEDIUM": {
        "violence": 5, "abusive_language": 8, "camera_blocking": 15,
        "camera_misuse": 12, "smoking": 25, "camera_shake": 20, "shouting": 15,
    },
    "LOW_MEDIUM": {
        "violence": 3, "abusive_language": 5, "camera_blocking": 12,
        "camera_misuse": 10, "smoking": 30, "camera_shake": 25, "shouting": 15,
    },
    "LOW": {
        "violence": 1, "abusive_language": 3, "camera_blocking": 10,
        "camera_misuse": 8, "smoking": 35, "camera_shake": 30, "shouting": 13,
    },
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
            
            # Get risk bias for this port
            risk_bias = profile.get("risk_bias", "MEDIUM")
            violation_weights = VIOLATION_WEIGHTS_BY_BIAS.get(risk_bias, VIOLATION_WEIGHTS_BY_BIAS["MEDIUM"])
            severity_weights = SEVERITY_WEIGHTS.get(risk_bias, SEVERITY_WEIGHTS["MEDIUM"])
            
            for _ in range(daily_incidents):
                event_id += 1
                inspector = random.choice(port_inspectors)
                ts = _random_ts_in_day(current_date)
                
                # Violation type based on port's risk bias
                vtype = random.choices(
                    list(violation_weights.keys()),
                    weights=list(violation_weights.values()),
                )[0]
                
                # Source based on type
                source = EventSource.AUDIO if vtype in VIOLATION_TYPES_AUDIO else EventSource.VIDEO
                
                # Severity based on port's risk bias
                severity = random.choices(
                    [Severity.LOW, Severity.MEDIUM, Severity.HIGH],
                    weights=severity_weights,
                )[0]
                
                # Confidence also varies by risk bias (higher risk = higher confidence detections)
                if risk_bias in ["HIGH", "MEDIUM_HIGH"]:
                    confidence = round(random.uniform(0.80, 0.98), 2)
                else:
                    confidence = round(random.uniform(0.70, 0.95), 2)
                
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
