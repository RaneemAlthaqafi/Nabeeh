"""
Nabeeh risk and KPI logic.
All weights, severity multipliers, and thresholds live here.
Domain logic is separate from UI; safe against requirement changes.
"""
from typing import Dict

from app.models import Event, Severity

# -----------------------------------------------------------------------------
# Weights per violation type (higher = more impact on risk score)
# -----------------------------------------------------------------------------
VIOLATION_WEIGHTS: Dict[str, float] = {
    "violence": 5.0,
    "abusive_language": 4.0,
    "camera_blocking": 3.0,
    "camera_misuse": 3.0,
    "camera_shake": 2.0,
    "smoking": 2.0,
    "shouting": 2.0,
}

# -----------------------------------------------------------------------------
# Severity multipliers (applied to weighted contribution)
# -----------------------------------------------------------------------------
SEVERITY_MULTIPLIERS: Dict[Severity, float] = {
    Severity.HIGH: 1.0,
    Severity.MEDIUM: 0.6,
    Severity.LOW: 0.3,
}

# -----------------------------------------------------------------------------
# Risk level thresholds (composite score)
# HIGH >= 25, MEDIUM 10--24.9, LOW < 10
# -----------------------------------------------------------------------------
RISK_THRESHOLD_HIGH = 25.0
RISK_THRESHOLD_MEDIUM_LOW = 10.0


def event_contribution(event: Event) -> float:
    """Single event contribution to risk score: weight * severity_mult * confidence."""
    w = VIOLATION_WEIGHTS.get(event.type, 1.0)
    m = SEVERITY_MULTIPLIERS.get(event.severity, 0.3)
    return w * m * event.confidence


def compute_risk_score(events: list[Event]) -> float:
    """Sum contributions of all events to get raw risk score."""
    return sum(event_contribution(e) for e in events)


def risk_level(score: float) -> str:
    """Map numeric score to LOW | MEDIUM | HIGH."""
    if score >= RISK_THRESHOLD_HIGH:
        return "HIGH"
    if score >= RISK_THRESHOLD_MEDIUM_LOW:
        return "MEDIUM"
    return "LOW"
