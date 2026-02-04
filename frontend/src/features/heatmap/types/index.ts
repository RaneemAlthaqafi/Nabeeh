/**
 * Heatmap feature types (aligned with API DTOs).
 * Domain types stay here; UI uses these.
 */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Port {
  id: string;
  name_ar: string;
  country: string;
  lat: number;
  lng: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface PortKpis {
  portId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  counts: Record<string, number>;
  totalEvents: number;
  lastIncidentAt: string | null;
}

export interface Incident {
  id: string;
  port_id: string;
  timestamp: string;
  source: string;
  type: string;
  severity: string;
  confidence: number;
  short_description: string | null;
}
