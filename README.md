# Nabeeh (نبيه) — Ports Risk Heatmap MVP

**Nabeeh** is a **Risk Awareness & Decision Support System** that visualizes behavioral and compliance violations detected from bodycams across Saudi border ports. It is aligned with ZATCA (Zakat, Tax and Customs Authority) context and is intended for senior stakeholders. This is **not** a media viewer; it is a **decision dashboard**.

## Run with Docker (one command)

```bash
docker compose up --build
```

Then open **http://localhost:3000/heatmap** in your browser.

- Backend API: http://localhost:8000  
- API docs: http://localhost:8000/docs  

## Run locally (without Docker)

### Backend

**Recommended:** Python 3.11 or 3.12. (Python 3.14 can require Rust to build `pydantic-core` if no wheel is available.)

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000/heatmap. Set `NEXT_PUBLIC_API_URL=http://localhost:8000` if the API runs elsewhere (see `.env.example`).

## Coordinates

Port coordinates used in the dashboard are **approximate** and for **visualization only**. They do not represent exact geographic positions for operational use.

## Features

- **Heatmap**: Risk intensity overlay on a map of Saudi border ports.
- **Filters**: Last 24h, Last 7 days, Last 30 days.
- **Port details panel**: Risk level badge, KPI counts per violation type, total events, last incident time, and latest 10 incidents when a port is selected.
- **Arabic-first UI** with clear فصحى labels; **English** translations and **language toggle (AR/EN)** in the top bar. RTL layout when Arabic is active.

## Tech stack

- **Frontend**: Next.js 14 (App Router), TypeScript (strict), Tailwind CSS, TanStack Query, Leaflet + leaflet.heat, Zod. ZATCA brand: SOMAR typography and official color palette.
- **Backend**: FastAPI, Pydantic, in-memory store (MVP), OpenAPI.
- **DevOps**: Dockerfile for frontend and backend, docker-compose, CORS for http://localhost:3000.

## Documentation

- **Root README**: This file — how to run with Docker, note on approximate coordinates, Nabeeh as Risk Awareness System, and language toggle.
- **Backend**: Domain logic (risk weights, severity multipliers, thresholds) lives in `backend/app/services/risk.py`. API contract: `GET /api/ports`, `GET /api/heatmap?from=&to=`, `GET /api/kpis?port_id=&from=&to=`, `GET /api/incidents?port_id=&from=&to=&limit=50`, `GET /health`.

No secrets are committed; use `.env.example` as a template and do not commit `.env`.

## Logos (شعارات)

ضع شعار الهيئة وشعار نبيه في المجلد `frontend/public/logos/`:

| الملف | الوصف |
|--------|--------|
| `zatca-logo.png` | شعار هيئة الزكاة والضريبة والجمارك |
| `nabeeh-logo.png` | شعار نبيه |

المسار الكامل للمجلد: `frontend/public/logos/`  
إذا لم ترفع الملفات، الهيدر يظهر بدون الشعارين (العنوان فقط).

## Fonts (ZATCA SOMAR)

Place the SOMAR font files in `frontend/public/fonts/`:

- `Somar-Regular.woff2`
- `Somar-Medium.woff2`
- `Somar-Bold.woff2`

If these are missing, the app will fall back to the system sans-serif font.
