"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHeatmap, fetchIncidents, fetchKpis, fetchPorts } from "@/lib/api/client";

export function usePorts() {
  return useQuery({ queryKey: ["ports"], queryFn: fetchPorts });
}

export function useHeatmap(from: string, to: string) {
  return useQuery({
    queryKey: ["heatmap", from, to],
    queryFn: () => fetchHeatmap(from, to),
    enabled: !!from && !!to,
  });
}

export function useKpis(portId: string | null, from: string, to: string) {
  return useQuery({
    queryKey: ["kpis", portId, from, to],
    queryFn: () => (portId ? fetchKpis(portId, from, to) : Promise.reject(new Error("no port"))),
    enabled: !!portId && !!from && !!to,
  });
}

export function useIncidents(portId: string | null, from: string, to: string, limit = 10) {
  return useQuery({
    queryKey: ["incidents", portId, from, to, limit],
    queryFn: () => (portId ? fetchIncidents(portId, from, to, limit) : Promise.reject(new Error("no port"))),
    enabled: !!portId && !!from && !!to,
  });
}
