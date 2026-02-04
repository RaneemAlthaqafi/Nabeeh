/**
 * API client for Nabeeh backend.
 * Base URL from env; defaults to localhost:8000.
 */
const API_BASE = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") : "";

export async function fetchPorts(): Promise<PortDto[]> {
  const r = await fetch(`${API_BASE}/api/ports`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchHeatmap(from: string, to: string): Promise<HeatmapDto> {
  const params = new URLSearchParams({ from, to });
  const r = await fetch(`${API_BASE}/api/heatmap?${params}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchKpis(portId: string, from: string, to: string): Promise<KpisDto> {
  const params = new URLSearchParams({ port_id: portId, from, to });
  const r = await fetch(`${API_BASE}/api/kpis?${params}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchIncidents(portId: string, from: string, to: string, limit = 10): Promise<IncidentsDto> {
  const params = new URLSearchParams({ port_id: portId, from, to, limit: String(limit) });
  const r = await fetch(`${API_BASE}/api/incidents?${params}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export interface PortDto {
  id: string;
  name_ar: string;
  country: string;
  lat: number;
  lng: number;
}

export interface HeatmapDto {
  points: [number, number, number][];
  from: string;
  to: string;
}

export interface KpisDto {
  port_id: string;
  from: string;
  to: string;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  counts: Record<string, number>;
  total_events: number;
  last_incident_at: string | null;
}

export interface IncidentDto {
  id: string;
  port_id: string;
  timestamp: string;
  source: string;
  type: string;
  severity: string;
  confidence: number;
  short_description: string | null;
}

export interface IncidentsDto {
  port_id: string;
  from: string;
  to: string;
  incidents: IncidentDto[];
}
