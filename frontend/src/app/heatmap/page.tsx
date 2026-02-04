"use client";

import { useMemo, useState } from "react";
import { Header } from "@/features/heatmap/components/Header";
import { HeatmapMap } from "@/features/heatmap/components/HeatmapMap";
import { DateRangeFilters, type RangeKey } from "@/features/heatmap/components/DateRangeFilters";
import { PortDetailsPanel } from "@/features/heatmap/components/PortDetailsPanel";
import { usePorts, useHeatmap, useKpis, useIncidents } from "@/features/heatmap/api/useHeatmap";

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
  const [range, setRange] = useState<RangeKey>("24h");
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);

  const { from, to } = useMemo(() => toISORange(range), [range]);

  const { data: ports = [], isLoading: portsLoading } = usePorts();
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap(from, to);
  const { data: kpis, isLoading: isLoadingKpis } = useKpis(selectedPortId, from, to);
  const { data: incidents, isLoading: isLoadingIncidents } = useIncidents(selectedPortId, from, to, 10);

  const points = useMemo(
    () => (heatmapData?.points ?? []) as [number, number, number][],
    [heatmapData]
  );
  const selectedPort = useMemo(
    () => ports.find((p) => p.id === selectedPortId) ?? null,
    [ports, selectedPortId]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
      <Header />
      <main className="flex-1 flex flex-col p-6 gap-5">
        {/* Filters */}
        <div className="flex justify-start">
          <DateRangeFilters value={range} onChange={setRange} />
        </div>
        
        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Map section */}
          <section className="lg:col-span-2 min-h-[480px]">
            <HeatmapMap
              points={points}
              center={MAP_CENTER}
              ports={ports}
              selectedPortId={selectedPortId}
              onPortSelect={setSelectedPortId}
            />
          </section>
          
          {/* Details panel */}
          <aside className="min-h-0">
            <PortDetailsPanel
              port={selectedPort}
              kpis={kpis ?? null}
              incidents={incidents ?? null}
              isLoadingKpis={isLoadingKpis && !!selectedPortId}
              isLoadingIncidents={isLoadingIncidents && !!selectedPortId}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
