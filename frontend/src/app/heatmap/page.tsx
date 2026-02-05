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

type RangeKey = "24h" | "7d" | "30d";
type ViolationType = "violence" | "camera_blocking" | "camera_misuse" | "camera_shake" | "smoking" | "shouting" | "abusive_language";

function toISORange(range: RangeKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (range === "24h") from.setHours(from.getHours() - 24);
  else if (range === "7d") from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

const VIOLATION_TYPES: ViolationType[] = [
  "violence", "camera_blocking", "camera_misuse", "camera_shake", 
  "smoking", "shouting", "abusive_language"
];

export default function HeatmapPage() {
  const { t } = useI18n();
  
  // Filter state
  const [timeRange, setTimeRange] = useState<RangeKey>("24h");
  const [violationType, setViolationType] = useState<ViolationType | null>(null);
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);

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
            <div className="kpi-card">
              <span className="kpi-value">{summary?.total_risk_score.toFixed(1) ?? "—"}</span>
              <span className="kpi-label">{t("totalRiskScore")}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-value">{summary?.total_inspectors_impacted ?? "—"}</span>
              <span className="kpi-label">{t("totalInspectorsImpacted")}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-value">{summary?.total_incidents ?? "—"}</span>
              <span className="kpi-label">{t("totalIncidents")}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-value">{summary?.total_ports_affected ?? "—"}</span>
              <span className="kpi-label">{t("totalPortsAffected")}</span>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["24h", "7d", "30d"] as RangeKey[]).map((key) => (
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
                {key === "24h" ? t("filterLast24h") : key === "7d" ? t("filterLast7d") : t("filterLast30d")}
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
