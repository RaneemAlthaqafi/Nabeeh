"""
In-memory store for MVP. Seeded at startup.
"""
from typing import List

from app.data.seed import generate_events, get_ports
from app.models import Event, Port

_ports: List[Port] = []
_events: List[Event] = []


def init_store() -> None:
    global _ports, _events
    _ports = get_ports()
    _events = generate_events()


def get_all_ports() -> List[Port]:
    return _ports


def get_all_events() -> List[Event]:
    return _events
