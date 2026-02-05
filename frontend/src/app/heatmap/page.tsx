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

function toISORange(range: RangeKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (range === "24h") from.setHours(from.getHours() - 24);
  else if (range === "7d") from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function HeatmapPage() {
  const { t } = useI18n();
  
  // Filter state
  const [timeRange, setTimeRange] = useState<RangeKey>("24h");
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);

  // Build filter params
  const { from, to } = useMemo(() => toISORange(timeRange), [timeRange]);
  const filterParams: FilterParams = useMemo(
    () => ({ from, to }),
    [from, to]
  );

  // Data fetching
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

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
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
          <div className="w-96 bg-white border-s border-gray-200 overflow-y-auto">
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
