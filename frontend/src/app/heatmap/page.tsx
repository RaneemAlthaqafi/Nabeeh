"use client";

import { useMemo, useState, useCallback } from "react";
import { Header } from "@/features/heatmap/components/Header";
import { HeatmapMap } from "@/features/heatmap/components/HeatmapMap";
import { PortDetailsPanel } from "@/features/heatmap/components/PortDetailsPanel";
import { useI18n } from "@/lib/i18n/context";
import {
  useSummary,
  usePorts,
  usePortDetails,
  useHeatmap,
} from "@/features/heatmap/api/useHeatmap";
import type { FilterParams } from "@/lib/api/client";

const MAP_CENTER: [number, number] = [24.5, 46.5];

type RangeKey = "7d" | "30d";
type ViolationType = "violence" | "camera_blocking" | "camera_misuse" | "camera_shake" | "smoking" | "shouting" | "abusive_language";

function toISORange(range: RangeKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (range === "7d") from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

const VIOLATION_TYPES: ViolationType[] = [
  "violence", "camera_blocking", "camera_misuse", "camera_shake", 
  "smoking", "shouting", "abusive_language"
];

// Convert risk score to percentage
// Reference: 50 points = 100% (very high risk)
// This aligns with thresholds: HIGH >= 25 (50%), MEDIUM >= 10 (20%), LOW < 10
function riskToPercent(score: number): number {
  const MAX_REFERENCE = 50; // 50 points = 100%
  return Math.min(Math.round((score / MAX_REFERENCE) * 100), 100);
}

export default function HeatmapPage() {
  const { t } = useI18n();
  
  // Filter state
  const [timeRange, setTimeRange] = useState<RangeKey>("7d");
  const [violationType, setViolationType] = useState<ViolationType | null>(null);
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [activeKpi, setActiveKpi] = useState<string | null>(null);

  // Build filter params
  const { from, to } = useMemo(() => toISORange(timeRange), [timeRange]);
  const filterParams: FilterParams = useMemo(
    () => ({ 
      from, 
      to,
      violationType: violationType ?? undefined,
    }),
    [from, to, violationType]
  );

  // Data fetching
  const { data: summary } = useSummary(filterParams);
  const { data: ports = [] } = usePorts(filterParams);
  const { data: portDetail, isLoading: portDetailLoading } = usePortDetails(
    selectedPortId,
    filterParams
  );
  const { data: heatmapData } = useHeatmap(filterParams);

  // Derived data
  const heatmapPoints = useMemo(
    () => (heatmapData?.points ?? []) as [number, number, number][],
    [heatmapData]
  );

  // Handlers
  const handlePortSelect = useCallback((portId: string | null) => {
    setSelectedPortId(portId);
  }, []);

  const handlePortClose = useCallback(() => {
    setSelectedPortId(null);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header />

      {/* KPI Summary Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* KPI Cards */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className={`kpi-card ${activeKpi === "risk" ? "active" : ""}`}
              onClick={() => setActiveKpi(activeKpi === "risk" ? null : "risk")}
            >
              <span className="kpi-value">
                {summary ? `${riskToPercent(summary.total_risk_score)}%` : "—"}
              </span>
              <span className="kpi-label">{t("totalRiskScore")}</span>
              <span className="kpi-help">؟</span>
              <div className="kpi-tooltip">{t("totalRiskScoreDesc")}</div>
            </button>
            <button
              type="button"
              className={`kpi-card ${activeKpi === "inspectors" ? "active" : ""}`}
              onClick={() => setActiveKpi(activeKpi === "inspectors" ? null : "inspectors")}
            >
              <span className="kpi-value">{summary?.total_inspectors_impacted ?? "—"}</span>
              <span className="kpi-label">{t("totalInspectorsImpacted")}</span>
              <span className="kpi-help">؟</span>
              <div className="kpi-tooltip">{t("totalInspectorsImpactedDesc")}</div>
            </button>
            <button
              type="button"
              className={`kpi-card ${activeKpi === "incidents" ? "active" : ""}`}
              onClick={() => setActiveKpi(activeKpi === "incidents" ? null : "incidents")}
            >
              <span className="kpi-value">{summary?.total_incidents ?? "—"}</span>
              <span className="kpi-label">{t("totalIncidents")}</span>
              <span className="kpi-help">؟</span>
              <div className="kpi-tooltip">{t("totalIncidentsDesc")}</div>
            </button>
            <button
              type="button"
              className={`kpi-card ${activeKpi === "ports" ? "active" : ""}`}
              onClick={() => setActiveKpi(activeKpi === "ports" ? null : "ports")}
            >
              <span className="kpi-value">{summary?.total_ports_affected ?? "—"}</span>
              <span className="kpi-label">{t("totalPortsAffected")}</span>
              <span className="kpi-help">؟</span>
              <div className="kpi-tooltip">{t("totalPortsAffectedDesc")}</div>
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["7d", "30d"] as RangeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTimeRange(key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  timeRange === key
                    ? "bg-white text-navy shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {key === "7d" ? t("filterLast7d") : t("filterLast30d")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Violation Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setViolationType(null)}
            className={`filter-chip ${!violationType ? "active" : ""}`}
          >
            {t("allViolations")}
          </button>
          {VIOLATION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setViolationType(violationType === type ? null : type)}
              className={`filter-chip ${violationType === type ? "active" : ""}`}
            >
              {t(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative">
          <HeatmapMap
            points={heatmapPoints}
            center={MAP_CENTER}
            ports={ports}
            selectedPortId={selectedPortId}
            onPortSelect={handlePortSelect}
          />
        </div>

        {/* Side Panel */}
        {selectedPortId && (
          <div className="w-96 bg-white border-s border-gray-200 overflow-y-auto shadow-lg">
            <PortDetailsPanel
              portDetail={portDetail ?? null}
              isLoading={portDetailLoading}
              onClose={handlePortClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
