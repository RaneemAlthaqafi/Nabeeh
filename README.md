# Nabeeh (نبيه) — Ports Risk Heatmap

Risk awareness and decision support dashboard for visualizing behavioral and compliance violations detected from bodycams across Saudi border ports (ZATCA context).

## Quick start (Docker)

```bash
docker compose up --build
```

Open **http://localhost:3000/heatmap** — API at http://localhost:8000 (docs `/docs`).

## Run locally

**Backend** (Python 3.11/3.12 recommended):
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend**:
```bash
cd frontend
npm install && npm run dev
```

Set `NEXT_PUBLIC_API_URL` if the API runs elsewhere (see `.env.example`).

## Features

- Risk heatmap over Saudi border ports with 24h / 7d / 30d filters
- Port details: risk badge, KPIs per violation type, latest incidents
- Arabic-first UI with AR/EN toggle and RTL support

## Tech stack

- **Frontend**: Next.js 14, TypeScript, Tailwind, TanStack Query, Leaflet + leaflet.heat
- **Backend**: FastAPI, Pydantic, in-memory store (MVP)
- **API**: `GET /api/ports`, `/api/heatmap`, `/api/kpis`, `/api/incidents`, `/health`

Risk logic: `backend/app/services/risk.py`. Port coordinates are approximate (visualization only).

## Assets

Place in `frontend/public/`:
- `logos/zatca-logo.png`, `logos/nabeeh-logo.png`
- `fonts/Somar-Regular.woff2`, `Somar-Medium.woff2`, `Somar-Bold.woff2`

Missing assets fall back gracefully. Never commit `.env` — use `.env.example`.
