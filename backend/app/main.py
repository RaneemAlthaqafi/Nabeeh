"""
Nabeeh API — Risk Awareness & Decision Support.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.data.store import init_store
from app.routes import analytics, ports


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_store()
    yield


app = FastAPI(
    title="Nabeeh API",
    description="Risk Awareness & Decision Support for ZATCA border ports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
        "http://127.0.0.1:3005",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ports.router)
app.include_router(analytics.router)


@app.get("/health")
def health():
    return {"status": "ok"}
