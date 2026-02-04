"""
Ports API.
"""
from fastapi import APIRouter

from app.data.store import get_all_ports

router = APIRouter(prefix="/api", tags=["ports"])


@router.get("/ports")
def list_ports():
    return [p.model_dump(mode="json") for p in get_all_ports()]
