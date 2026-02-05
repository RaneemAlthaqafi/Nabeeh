/**
 * Nabeeh API Client
 * Handles all API communication with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// =============================================================================
// Types
// =============================================================================

export interface PortSummary {
  id: string;
  name_ar: string;
  name_en: string;
  lat: number;
  lng: number;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  incident_count: number;
  unique_inspectors_count: number;
  last_incident_at: string | null;
}

export interface NationwideSummary {
  total_risk_score: number;
  total_incidents: number;
  total_inspectors_impacted: number;
  total_ports_affected: number;
  last_incident_at: string | null;
  incidents_by_severity: Record<string, number>;
  incidents_by_violation: Record<string, number>;
}

export interface InspectorSummary {
  id: string;
  risk_level: string;
  risk_score: number;
  incident_count: number;
  last_incident_at: string | null;
}

export interface InspectorDetail {
  id: string;
  risk_score: number;
  risk_level: string;
  total_incidents: number;
  last_incident_at: string | null;
  violations_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
  ports_affected: string[];
  recent_incidents: Incident[];
}

export interface PortDetail {
  id: string;
  name_ar: string;
  name_en: string;
  lat: number;
  lng: number;
  risk_score: number;
  risk_level: string;
  incident_count: number;
  unique_inspectors_count: number;
  last_incident_at: string | null;
  violations_breakdown: Record<string, number>;
  severity_breakdown: Record<string, number>;
  top_inspectors: InspectorSummary[];
  recent_incidents: Incident[];
}

export interface Incident {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  inspector_id?: string;
  port_id?: string;
  port_name_ar?: string;
  port_name_en?: string;
  confidence: number;
}

export interface HeatmapData {
  points: [number, number, number][];
  from: string;
  to: string;
}

export interface InspectorsListResponse {
  total_unique_inspectors: number;
  inspectors: InspectorSummary[];
}

export interface FilterParams {
  from: string;
  to: string;
  violationType?: string;
  severity?: string;
  portId?: string;
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.detail?.message || error.message || "API Error");
  }
  return res.json();
}

function buildUrl(endpoint: string, params: Record<string, string | undefined>): string {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

/**
 * Get nationwide summary with KPI metrics.
 */
export async function fetchSummary(params: FilterParams): Promise<NationwideSummary> {
  const url = buildUrl("/api/summary", {
    from: params.from,
    to: params.to,
    violationType: params.violationType,
    severity: params.severity,
  });
  return fetchJson<NationwideSummary>(url);
}

/**
 * Get all ports with risk metrics.
 */
export async function fetchPorts(params: FilterParams): Promise<PortSummary[]> {
  const url = buildUrl("/api/ports", {
    from: params.from,
    to: params.to,
    violationType: params.violationType,
    severity: params.severity,
  });
  return fetchJson<PortSummary[]>(url);
}

/**
 * Get detailed port information.
 */
export async function fetchPortDetails(
  portId: string,
  params: FilterParams
): Promise<PortDetail> {
  const url = buildUrl(`/api/ports/${portId}/details`, {
    from: params.from,
    to: params.to,
    violationType: params.violationType,
    severity: params.severity,
  });
  return fetchJson<PortDetail>(url);
}

/**
 * Get inspector analytics.
 */
export async function fetchInspectorDetails(
  inspectorId: string,
  params: FilterParams
): Promise<InspectorDetail> {
  const url = buildUrl(`/api/inspectors/${inspectorId}`, {
    from: params.from,
    to: params.to,
    violationType: params.violationType,
    severity: params.severity,
    port_id: params.portId,
  });
  return fetchJson<InspectorDetail>(url);
}

/**
 * Get list of inspectors with incidents.
 */
export async function fetchInspectors(
  params: FilterParams & { limit?: number }
): Promise<InspectorsListResponse> {
  const url = buildUrl("/api/inspectors", {
    from: params.from,
    to: params.to,
    violationType: params.violationType,
    severity: params.severity,
    port_id: params.portId,
    limit: params.limit?.toString(),
  });
  return fetchJson<InspectorsListResponse>(url);
}

/**
 * Get heatmap data.
 */
export async function fetchHeatmap(params: FilterParams): Promise<HeatmapData> {
  const url = buildUrl("/api/heatmap", {
    from: params.from,
    to: params.to,
    violationType: params.violationType,
    severity: params.severity,
  });
  return fetchJson<HeatmapData>(url);
}

/**
 * Legacy: Get KPIs for a port.
 */
export async function fetchKpis(
  portId: string,
  from: string,
  to: string
): Promise<Record<string, unknown>> {
  const url = buildUrl("/api/kpis", { port_id: portId, from, to });
  return fetchJson<Record<string, unknown>>(url);
}

/**
 * Legacy: Get incidents for a port.
 */
export async function fetchIncidents(
  portId: string,
  from: string,
  to: string,
  limit: number = 50
): Promise<{ incidents: Incident[] }> {
  const url = buildUrl("/api/incidents", {
    port_id: portId,
    from,
    to,
    limit: limit.toString(),
  });
  return fetchJson<{ incidents: Incident[] }>(url);
}
