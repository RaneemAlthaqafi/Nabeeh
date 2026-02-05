/**
 * React Query hooks for Nabeeh API.
 */
import { useQuery } from "@tanstack/react-query";
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

/**
 * Hook for nationwide summary KPIs.
 */
export function useSummary(params: FilterParams) {
  return useQuery<NationwideSummary>({
    queryKey: ["summary", params],
    queryFn: () => fetchSummary(params),
    staleTime: 30_000,
  });
}

/**
 * Hook for ports list with risk metrics.
 */
export function usePorts(params: FilterParams) {
  return useQuery<PortSummary[]>({
    queryKey: ["ports", params],
    queryFn: () => fetchPorts(params),
    staleTime: 30_000,
  });
}

/**
 * Hook for port details.
 */
export function usePortDetails(portId: string | null, params: FilterParams) {
  return useQuery<PortDetail>({
    queryKey: ["portDetails", portId, params],
    queryFn: () => fetchPortDetails(portId!, params),
    enabled: !!portId,
    staleTime: 30_000,
  });
}

/**
 * Hook for inspector details.
 */
export function useInspectorDetails(
  inspectorId: string | null,
  params: FilterParams
) {
  return useQuery<InspectorDetail>({
    queryKey: ["inspectorDetails", inspectorId, params],
    queryFn: () => fetchInspectorDetails(inspectorId!, params),
    enabled: !!inspectorId,
    staleTime: 30_000,
  });
}

/**
 * Hook for inspectors list.
 */
export function useInspectors(params: FilterParams & { limit?: number }) {
  return useQuery<InspectorsListResponse>({
    queryKey: ["inspectors", params],
    queryFn: () => fetchInspectors(params),
    staleTime: 30_000,
  });
}

/**
 * Hook for heatmap data.
 */
export function useHeatmap(params: FilterParams) {
  return useQuery<HeatmapData>({
    queryKey: ["heatmap", params],
    queryFn: () => fetchHeatmap(params),
    staleTime: 30_000,
  });
}
