"""
Nabeeh domain models.
Ports, events, inspectors, and violation taxonomy.
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, Field


class EventSource(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ViolationType(str, Enum):
    VIOLENCE = "violence"
    CAMERA_BLOCKING = "camera_blocking"
    CAMERA_MISUSE = "camera_misuse"
    CAMERA_SHAKE = "camera_shake"
    SMOKING = "smoking"
    SHOUTING = "shouting"
    ABUSIVE_LANGUAGE = "abusive_language"


class Port(BaseModel):
    id: str
    name_ar: str
    name_en: str = ""
    country: str
    lat: float
    lng: float


class Event(BaseModel):
    """
    Incident/event record.
    Each event is tied to an inspector (inspector_id).
    """
    id: str
    port_id: str
    inspector_id: str  # NEW: links event to an inspector
    timestamp: datetime
    source: EventSource
    type: str  # violation type from taxonomy
    severity: Severity
    confidence: float = Field(ge=0, le=1)
    short_description: Optional[str] = None


class Inspector(BaseModel):
    """
    Inspector entity (masked for privacy).
    """
    id: str  # masked code e.g. "INS-A1B2C3"
    port_id: str  # primary assigned port
    created_at: datetime


# Response models for API
class PortSummary(BaseModel):
    id: str
    name_ar: str
    name_en: str
    lat: float
    lng: float
    risk_score: float
    risk_level: str
    incident_count: int
    unique_inspectors_count: int
    last_incident_at: Optional[str] = None


class NationwideSummary(BaseModel):
    total_risk_score: float
    total_incidents: int
    total_inspectors_impacted: int
    total_ports_affected: int
    last_incident_at: Optional[str] = None
    incidents_by_severity: dict
    incidents_by_violation: dict


class InspectorSummary(BaseModel):
    id: str
    risk_level: str
    risk_score: float
    incident_count: int
    last_incident_at: Optional[str] = None


class InspectorDetail(BaseModel):
    id: str
    risk_score: float
    risk_level: str
    total_incidents: int
    last_incident_at: Optional[str] = None
    violations_breakdown: dict  # type -> count
    severity_breakdown: dict  # severity -> count
    ports_affected: List[str]
    recent_incidents: List[dict]


class PortDetail(BaseModel):
    id: str
    name_ar: str
    name_en: str
    lat: float
    lng: float
    risk_score: float
    risk_level: str
    incident_count: int
    unique_inspectors_count: int
    last_incident_at: Optional[str] = None
    violations_breakdown: dict
    severity_breakdown: dict
    top_inspectors: List[InspectorSummary]
    recent_incidents: List[dict]


# Violation taxonomy (video + audio)
VIDEO_VIOLATIONS = frozenset({
    "violence",
    "camera_blocking",
    "camera_misuse",
    "camera_shake",
    "smoking",
})
AUDIO_VIOLATIONS = frozenset({
    "shouting",
    "abusive_language",
})
ALL_VIOLATION_TYPES = VIDEO_VIOLATIONS | AUDIO_VIOLATIONS
