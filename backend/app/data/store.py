"""
In-memory data store for Nabeeh MVP.
Initialized at startup from seed data.
"""
from typing import List, Optional, Dict

from app.data.seed import seed_all
from app.models import Event, Inspector, Port

_ports: List[Port] = []
_inspectors: List[Inspector] = []
_events: List[Event] = []
_initialized: bool = False


def init_store(days_back: int = 30, seed_value: int = 42) -> None:
    """Initialize the store with seed data."""
    global _ports, _inspectors, _events, _initialized
    if _initialized:
        return
    _ports, _inspectors, _events = seed_all(days_back, seed_value)
    _initialized = True


def get_all_ports() -> List[Port]:
    return _ports.copy()


def get_port_by_id(port_id: str) -> Optional[Port]:
    for p in _ports:
        if p.id == port_id:
            return p
    return None


def get_all_inspectors() -> List[Inspector]:
    return _inspectors.copy()


def get_inspector_by_id(inspector_id: str) -> Optional[Inspector]:
    for i in _inspectors:
        if i.id == inspector_id:
            return i
    return None


def get_inspectors_by_port(port_id: str) -> List[Inspector]:
    return [i for i in _inspectors if i.port_id == port_id]


def get_all_events() -> List[Event]:
    return _events.copy()


def get_events_by_port(port_id: str) -> List[Event]:
    return [e for e in _events if e.port_id == port_id]


def get_events_by_inspector(inspector_id: str) -> List[Event]:
    return [e for e in _events if e.inspector_id == inspector_id]


def get_ports_map() -> Dict[str, Port]:
    return {p.id: p for p in _ports}


def get_inspectors_map() -> Dict[str, Inspector]:
    return {i.id: i for i in _inspectors}
