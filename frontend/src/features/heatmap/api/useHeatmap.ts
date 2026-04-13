/**
 * React Query hooks for Nabeeh API.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchSummary,
  fetchPorts,
  fetchPortDetails,
  fetchInspectorDetails,
  fetchInspectors,
  fetchHeatmap,
  type FilterParams,
  type NationwideSummary,
  type PortSummary,
  type PortDetail,
  type InspectorDetail,
  type InspectorsListResponse,
  type HeatmapData,
} from "@/lib/api/client";

const DEFAULTS = {
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  placeholderData: keepPreviousData,
  refetchOnWindowFocus: false,
} as const;

export function useSummary(params: FilterParams) {
  return useQuery<NationwideSummary>({
    queryKey: ["summary", params],
    queryFn: () => fetchSummary(params),
    ...DEFAULTS,
  });
}

export function usePorts(params: FilterParams) {
  return useQuery<PortSummary[]>({
    queryKey: ["ports", params],
    queryFn: () => fetchPorts(params),
    ...DEFAULTS,
  });
}

export function usePortDetails(portId: string | null, params: FilterParams) {
  return useQuery<PortDetail>({
    queryKey: ["portDetails", portId, params],
    queryFn: () => fetchPortDetails(portId!, params),
    enabled: !!portId,
    ...DEFAULTS,
  });
}

export function useInspectorDetails(
  inspectorId: string | null,
  params: FilterParams
) {
  return useQuery<InspectorDetail>({
    queryKey: ["inspectorDetails", inspectorId, params],
    queryFn: () => fetchInspectorDetails(inspectorId!, params),
    enabled: !!inspectorId,
    ...DEFAULTS,
  });
}

export function useInspectors(params: FilterParams & { limit?: number }) {
  return useQuery<InspectorsListResponse>({
    queryKey: ["inspectors", params],
    queryFn: () => fetchInspectors(params),
    ...DEFAULTS,
  });
}

export function useHeatmap(params: FilterParams) {
  return useQuery<HeatmapData>({
    queryKey: ["heatmap", params],
    queryFn: () => fetchHeatmap(params),
    ...DEFAULTS,
  });
}
