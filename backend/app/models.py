"""
Nabeeh domain models.
Ports, events, and violation taxonomy.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class EventSource(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Port(BaseModel):
    id: str
    name_ar: str
    country: str
    lat: float
    lng: float


class Event(BaseModel):
    id: str
    port_id: str
    timestamp: datetime
    source: EventSource
    type: str  # violation type from taxonomy
    severity: Severity
    confidence: float = Field(ge=0, le=1)
    short_description: Optional[str] = None


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
