"use client";

import { useMemo, useState, useCallback } from "react";
import { Header } from "@/features/heatmap/components/Header";
import { HeatmapMap } from "@/features/heatmap/components/HeatmapMap";
import { OverlayDashboard } from "@/features/heatmap/components/OverlayDashboard";
import { FiltersBar, type RangeKey, type ViolationType } from "@/features/heatmap/components/FiltersBar";
import { PortOverlay } from "@/features/heatmap/components/PortOverlay";
import { InspectorDrawer } from "@/features/heatmap/components/InspectorDrawer";
import {
  useSummary,
  usePorts,
  usePortDetails,
  useInspectorDetails,
  useHeatmap,
} from "@/features/heatmap/api/useHeatmap";
import type { FilterParams } from "@/lib/api/client";

const MAP_CENTER: [number, number] = [24.5, 46.5];

function toISORange(range: RangeKey): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (range === "24h") from.setHours(from.getHours() - 24);
  else if (range === "7d") from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function HeatmapPage() {
  // Filter state
  const [timeRange, setTimeRange] = useState<RangeKey>("24h");
  const [violationType, setViolationType] = useState<ViolationType | null>(null);
  const [severity, setSeverity] = useState<string | null>(null);

  // Selection state
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(null);
  const [isInspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);

  // Build filter params
  const { from, to } = useMemo(() => toISORange(timeRange), [timeRange]);
  const filterParams: FilterParams = useMemo(
    () => ({
      from,
      to,
      violationType: violationType ?? undefined,
      severity: severity ?? undefined,
    }),
    [from, to, violationType, severity]
  );

  // Data fetching
  const { data: summary, isLoading: summaryLoading } = useSummary(filterParams);
  const { data: ports = [], isLoading: portsLoading } = usePorts(filterParams);
  const { data: portDetail, isLoading: portDetailLoading } = usePortDetails(
    selectedPortId,
    filterParams
  );
  const { data: inspectorDetail, isLoading: inspectorLoading } = useInspectorDetails(
    selectedInspectorId,
    { ...filterParams, portId: selectedPortId ?? undefined }
  );
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap(filterParams);

  // Derived data
  const heatmapPoints = useMemo(
    () => (heatmapData?.points ?? []) as [number, number, number][],
    [heatmapData]
  );

  // Handlers
  const handlePortSelect = useCallback((portId: string | null) => {
    setSelectedPortId(portId);
    setSelectedInspectorId(null);
    setInspectorDrawerOpen(false);
  }, []);

  const handlePortClose = useCallback(() => {
    setSelectedPortId(null);
  }, []);

  const handleInspectorClick = useCallback((inspectorId: string) => {
    setSelectedInspectorId(inspectorId);
    setInspectorDrawerOpen(true);
  }, []);

  const handleInspectorDrawerClose = useCallback(() => {
    setInspectorDrawerOpen(false);
    setSelectedInspectorId(null);
  }, []);

  return (
    <div className="dashboard-root">
      <Header />

      {/* Main Canvas - Map with overlays */}
      <main className="dashboard-main">
        {/* Map (full canvas) */}
        <div className="map-canvas">
          <HeatmapMap
            points={heatmapPoints}
            center={MAP_CENTER}
            ports={ports}
            selectedPortId={selectedPortId}
            onPortSelect={handlePortSelect}
            dimUnselected={!!selectedPortId}
          />
        </div>

        {/* Overlay Dashboard (floating above map) */}
        <div className="overlay-container overlay-top">
          <OverlayDashboard
            summary={summary ?? null}
            portDetail={portDetail ?? null}
            isLoading={summaryLoading || (!!selectedPortId && portDetailLoading)}
            selectedPortId={selectedPortId}
          />
        </div>

        {/* Filters Bar (floating below dashboard) */}
        <div className="overlay-container overlay-filters">
          <FiltersBar
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            violationType={violationType}
            onViolationTypeChange={setViolationType}
            severity={severity}
            onSeverityChange={setSeverity}
          />
        </div>

        {/* Port Detail Overlay (right side when selected) */}
        {selectedPortId && (
          <div className="overlay-container overlay-right">
            <PortOverlay
              portDetail={portDetail ?? null}
              isLoading={portDetailLoading}
              onClose={handlePortClose}
              onInspectorClick={handleInspectorClick}
            />
          </div>
        )}

        {/* Inspector Drawer */}
        <InspectorDrawer
          inspector={inspectorDetail ?? null}
          isLoading={inspectorLoading}
          isOpen={isInspectorDrawerOpen}
          onClose={handleInspectorDrawerClose}
        />
      </main>
    </div>
  );
}
