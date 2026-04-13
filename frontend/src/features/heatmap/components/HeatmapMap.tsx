"use client";

import { memo, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { PortSummary } from "@/lib/api/client";

const SA_CENTER: [number, number] = [24.5, 46.5];
const SA_ZOOM = 6;

const SA_BORDER: [number, number][] = [
  [34.95, 29.36], [36.07, 29.19], [37.00, 29.50], [37.50, 29.30],
  [38.79, 29.37], [39.20, 29.37], [40.00, 29.00], [41.19, 28.29],
  [42.07, 28.29], [43.12, 28.00], [44.71, 29.20], [46.55, 29.10],
  [47.43, 28.99], [47.97, 28.99], [48.42, 28.55],
  [48.81, 27.69], [49.30, 27.46], [49.47, 27.11], [50.04, 26.68],
  [50.21, 26.11], [50.55, 25.94], [50.80, 24.75],
  [51.01, 24.29], [51.22, 24.00], [51.39, 24.48], [51.58, 24.25],
  [51.59, 22.93], [52.55, 22.93], [55.10, 22.62], [55.67, 22.00],
  [55.21, 20.00], [52.78, 19.16], [52.00, 19.00],
  [49.12, 18.62], [48.18, 18.17], [47.47, 17.12], [46.98, 16.95],
  [46.75, 17.28], [45.40, 17.33], [45.22, 17.43], [44.06, 17.41],
  [43.79, 17.32], [43.38, 17.58], [43.12, 17.09], [43.22, 16.67],
  [42.79, 16.38], [42.65, 16.77], [42.35, 17.08], [42.27, 17.47],
  [41.75, 17.87], [41.22, 18.67], [40.94, 19.49], [40.25, 20.17],
  [39.80, 21.00], [39.19, 21.29], [39.02, 22.00],
  [38.49, 23.69], [37.92, 24.18], [37.54, 24.29], [37.18, 25.08],
  [36.93, 25.60], [36.64, 25.83], [36.25, 26.57], [35.64, 27.38],
  [35.18, 28.06], [34.62, 28.06],
  [34.95, 29.36],
];

const MAP_STYLES = {
  light: {
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia</a>',
  },
  dark: {
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia</a>',
  },
};

const HEAT_GRADIENT_DARK = {
  0.0: "rgba(79, 187, 189, 0.0)",
  0.2: "rgba(79, 187, 189, 0.6)",
  0.4: "rgba(79, 187, 189, 0.85)",
  0.55: "rgba(250, 187, 51, 0.9)",
  0.7: "rgba(250, 187, 51, 0.95)",
  0.85: "rgba(232, 74, 65, 0.95)",
  1.0: "rgba(232, 74, 65, 1)",
};
const HEAT_GRADIENT_LIGHT = {
  0.0: "rgba(79, 187, 189, 0.0)",
  0.2: "rgba(79, 187, 189, 0.5)",
  0.4: "rgba(79, 187, 189, 0.75)",
  0.55: "rgba(250, 187, 51, 0.8)",
  0.7: "rgba(250, 187, 51, 0.9)",
  0.85: "rgba(232, 74, 65, 0.92)",
  1.0: "rgba(232, 74, 65, 1)",
};

interface HeatmapMapProps {
  points: [number, number, number][];
  center: [number, number];
  ports: PortSummary[];
  selectedPortId: string | null;
  onPortSelect: (portId: string | null) => void;
}

function getRiskColors(level: string, isDark: boolean) {
  const colors = {
    HIGH: {
      main: "#E84A41",
      glow: isDark ? "rgba(232, 74, 65, 0.6)" : "rgba(232, 74, 65, 0.4)",
      ring: isDark ? "rgba(232, 74, 65, 0.9)" : "rgba(232, 74, 65, 0.7)",
    },
    MEDIUM: {
      main: "#FABB33",
      glow: isDark ? "rgba(250, 187, 51, 0.55)" : "rgba(250, 187, 51, 0.4)",
      ring: isDark ? "rgba(250, 187, 51, 0.85)" : "rgba(250, 187, 51, 0.65)",
    },
    LOW: {
      main: "#4FBBBD",
      glow: isDark ? "rgba(79, 187, 189, 0.5)" : "rgba(79, 187, 189, 0.35)",
      ring: isDark ? "rgba(79, 187, 189, 0.75)" : "rgba(79, 187, 189, 0.55)",
    },
  };
  return colors[level as keyof typeof colors] || colors.LOW;
}

// Build marker HTML once per (port, state) — pure function, no side effects.
function buildMarkerHtml(
  port: PortSummary,
  isDark: boolean,
  isSelected: boolean,
  isHovered: boolean,
  mapTheme: "light" | "dark"
): string {
  const colors = getRiskColors(port.risk_level, isDark);
  const baseSize = 8;
  const size = isSelected ? 14 : isHovered ? 11 : baseSize;
  const riskClass =
    port.risk_level === "HIGH"
      ? "risk-high"
      : port.risk_level === "MEDIUM"
      ? "risk-medium"
      : "risk-low";

  // Single beacon ring for HIGH, none for others — much cheaper than 3 rings.
  const beacon =
    port.risk_level === "HIGH"
      ? `<div class="beacon-ring" style="--ring-color: ${colors.ring}; --delay: 0s;"></div>`
      : "";

  return `
    <div class="marker-container ${riskClass} ${isSelected ? "is-selected" : ""} ${
    isHovered ? "is-hovered" : ""
  }" data-theme="${mapTheme}">
      ${beacon}
      <div class="marker-glow" style="
        --glow-color: ${colors.glow};
        --glow-size: ${isSelected ? "22px" : isHovered ? "16px" : "12px"};
      "></div>
      <div class="marker-core" style="
        --marker-size: ${size}px;
        --marker-color: ${colors.main};
        --shadow-color: ${colors.glow};
      ">
        <div class="marker-shine"></div>
      </div>
    </div>
  `;
}

function buildPopupHtml(
  port: PortSummary,
  isDark: boolean,
  mapTheme: "light" | "dark",
  lang: "ar" | "en"
): string {
  const colors = getRiskColors(port.risk_level, isDark);
  const label =
    port.risk_level === "HIGH"
      ? lang === "ar"
        ? "خطورة عالية"
        : "High Risk"
      : port.risk_level === "MEDIUM"
      ? lang === "ar"
        ? "خطورة متوسطة"
        : "Medium Risk"
      : lang === "ar"
      ? "خطورة منخفضة"
      : "Low Risk";
  return `
    <div class="popup-card" data-theme="${mapTheme}">
      <div class="popup-header">
        <span class="popup-indicator" style="background: ${colors.main}; box-shadow: 0 0 8px ${colors.glow};"></span>
        <span class="popup-name">${lang === "ar" ? port.name_ar : port.name_en}</span>
      </div>
      <div class="popup-badge" style="background: ${colors.main}20; color: ${colors.main}; border: 1px solid ${colors.main}40;">
        ${label}
      </div>
    </div>
  `;
}

function HeatmapMapInner({
  points,
  center,
  ports,
  selectedPortId,
  onPortSelect,
}: HeatmapMapProps) {
  const { lang } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const borderLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const portsRef = useRef<PortSummary[]>([]);
  const selectedRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const lastSelectedRef = useRef<string | null>(null);
  const mapDrivenSelectRef = useRef(false);

  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [mapTheme, setMapTheme] = useState<"light" | "dark">("light");
  const [zoom, setZoom] = useState(SA_ZOOM);

  const isDark = mapTheme === "dark";

  // Keep refs in sync so marker event handlers always see latest state without rebuilding.
  useEffect(() => {
    selectedRef.current = selectedPortId;
  }, [selectedPortId]);
  useEffect(() => {
    hoveredRef.current = hoveredPortId;
  }, [hoveredPortId]);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadLeaflet = async () => {
      const L = await import("leaflet");
      await import("leaflet.heat");
      leafletRef.current = L.default || L;
      setIsLeafletReady(true);
    };
    loadLeaflet();
  }, []);

  // Initialize map (once)
  useEffect(() => {
    if (!isLeafletReady || !containerRef.current || mapRef.current) return;
    const L = leafletRef.current;
    if (!L) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: SA_ZOOM,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      preferCanvas: true,
      worldCopyJump: false,
      minZoom: 5,
      maxZoom: 12,
    });

    const style = MAP_STYLES[mapTheme];
    const tileLayer = L.tileLayer(style.url, {
      maxZoom: 19,
      attribution: style.attribution,
      updateWhenIdle: true,
      keepBuffer: 4,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const borderCoords = SA_BORDER.map(([lng, lat]) => [lat, lng] as [number, number]);
    const borderLayer = L.polygon(borderCoords, {
      color: isDark ? "#4FBBBD" : "#1D3761",
      weight: 2,
      opacity: isDark ? 0.6 : 0.5,
      fillColor: isDark ? "#1D3761" : "#4FBBBD",
      fillOpacity: isDark ? 0.08 : 0.05,
      dashArray: "5, 5",
      interactive: false,
    }).addTo(map);
    borderLayerRef.current = borderLayer;

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control
      .attribution({ position: "bottomleft", prefix: false })
      .addTo(map)
      .addAttribution(style.attribution);

    map.on("zoomend", () => setZoom(map.getZoom()));

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      setIsLoading(false);
    }, 150);

    // Keep Leaflet in sync with container size changes (side panel open/close,
    // window resize, etc.). Without this, flyTo uses a stale size and the map
    // visibly snaps back after the animation completes.
    let resizeObserver: ResizeObserver | null = null;
    const el = containerRef.current;
    if (el && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        // pan: false prevents the map from re-centering and causing a jump
        map.invalidateSize({ pan: false, debounceMoveend: true });
      });
      resizeObserver.observe(el);
    }

    return () => {
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      heatLayerRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeafletReady]);

  // Theme change: swap tile layer and restyle border
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !tileLayerRef.current) return;

    const style = MAP_STYLES[mapTheme];
    map.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(style.url, {
      maxZoom: 19,
      attribution: style.attribution,
      updateWhenIdle: true,
      keepBuffer: 4,
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();

    if (borderLayerRef.current) {
      borderLayerRef.current.setStyle({
        color: isDark ? "#4FBBBD" : "#1D3761",
        opacity: isDark ? 0.6 : 0.5,
        fillColor: isDark ? "#1D3761" : "#4FBBBD",
        fillOpacity: isDark ? 0.08 : 0.05,
      });
    }
  }, [mapTheme, isLeafletReady, isDark]);

  // Heat layer: update in place when data changes (no remove/recreate unless first time)
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Radius/blur scale with zoom for a cleaner look at different levels
    const radius = Math.max(22, Math.min(42, 18 + (zoom - 5) * 6));
    const blur = Math.max(14, Math.min(28, 12 + (zoom - 5) * 3));

    if (!heatLayerRef.current) {
      if (points.length === 0) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(points, {
        radius,
        blur,
        maxZoom: 14,
        max: 1.0,
        minOpacity: isDark ? 0.65 : 0.55,
        gradient: isDark ? HEAT_GRADIENT_DARK : HEAT_GRADIENT_LIGHT,
      });
      heat.addTo(map);
      heatLayerRef.current = heat;
      return;
    }

    // Update in place — avoids the flicker / cost of full remove+add
    const heat = heatLayerRef.current;
    heat.setOptions({
      radius,
      blur,
      minOpacity: isDark ? 0.65 : 0.55,
      gradient: isDark ? HEAT_GRADIENT_DARK : HEAT_GRADIENT_LIGHT,
    });
    heat.setLatLngs(points);
  }, [points, isLeafletReady, mapTheme, zoom, isDark]);

  // Stable click handler (uses refs so it never goes stale)
  const handleMarkerClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (port: PortSummary, _marker: any) => {
      const map = mapRef.current;
      if (!map) return;
      if (selectedRef.current === port.id) {
        onPortSelect(null);
      } else {
        // Mark that the upcoming selection change is map-driven so the
        // selection effect won't start a second flyTo on top of this one.
        mapDrivenSelectRef.current = true;
        onPortSelect(port.id);
        map.flyTo([port.lat, port.lng], Math.max(map.getZoom(), 8), {
          duration: 0.5,
          easeLinearity: 0.25,
        });
      }
    },
    [onPortSelect]
  );

  // Markers: build once per unique port set, then update icons in place on hover/select.
  // This avoids the costly rebuild-all-markers-on-every-hover pattern.
  const portsKey = useMemo(
    () => ports.map((p) => `${p.id}:${p.risk_level}:${p.lat},${p.lng}`).join("|"),
    [ports]
  );

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    portsRef.current = ports;

    // Diff: remove markers for ports that are gone
    const currentIds = new Set(ports.map((p) => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    ports.forEach((port) => {
      const isSelected = port.id === selectedRef.current;
      const isHovered = port.id === hoveredRef.current;

      const html = buildMarkerHtml(port, isDark, isSelected, isHovered, mapTheme);
      const icon = L.divIcon({
        className: "marker-wrapper",
        html,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
        popupAnchor: [0, -25],
      });

      let marker = markersRef.current.get(port.id);
      if (!marker) {
        marker = L.marker([port.lat, port.lng], {
          icon,
          zIndexOffset: isSelected ? 1000 : isHovered ? 500 : port.risk_level === "HIGH" ? 100 : 0,
          riseOnHover: true,
        });
        marker.bindPopup(buildPopupHtml(port, isDark, mapTheme, lang), {
          closeButton: false,
          autoClose: false,
          closeOnEscapeKey: false,
          closeOnClick: false,
          className: `premium-popup ${mapTheme}`,
          offset: [0, -8],
        });
        marker.on("mouseover", () => {
          setHoveredPortId(port.id);
          marker.openPopup();
        });
        marker.on("mouseout", () => {
          setHoveredPortId(null);
          marker.closePopup();
        });
        marker.on("click", () => handleMarkerClick(port, marker));
        marker.addTo(map);
        markersRef.current.set(port.id, marker);
      } else {
        // Existing marker: update position if it moved, and refresh icon/popup
        const latLng = marker.getLatLng();
        if (latLng.lat !== port.lat || latLng.lng !== port.lng) {
          marker.setLatLng([port.lat, port.lng]);
        }
        marker.setIcon(icon);
        marker.setPopupContent(buildPopupHtml(port, isDark, mapTheme, lang));
        marker.setZIndexOffset(
          isSelected ? 1000 : isHovered ? 500 : port.risk_level === "HIGH" ? 100 : 0
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portsKey, isLeafletReady, mapTheme, lang, isDark, handleMarkerClick]);

  // Hover/select-only updates: swap only the affected marker icons, not all of them.
  useEffect(() => {
    const L = leafletRef.current;
    if (!L) return;
    portsRef.current.forEach((port) => {
      const marker = markersRef.current.get(port.id);
      if (!marker) return;
      const isSelected = port.id === selectedPortId;
      const isHovered = port.id === hoveredPortId;
      const html = buildMarkerHtml(port, isDark, isSelected, isHovered, mapTheme);
      marker.setIcon(
        L.divIcon({
          className: "marker-wrapper",
          html,
          iconSize: [60, 60],
          iconAnchor: [30, 30],
          popupAnchor: [0, -25],
        })
      );
      marker.setZIndexOffset(
        isSelected ? 1000 : isHovered ? 500 : port.risk_level === "HIGH" ? 100 : 0
      );
    });
  }, [selectedPortId, hoveredPortId, isDark, mapTheme]);

  // Auto-fit bounds when ports change materially (first load / filter that drops ports)
  const didFitRef = useRef(false);
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || ports.length === 0 || didFitRef.current) return;
    const bounds = L.latLngBounds(ports.map((p) => [p.lat, p.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 7, animate: false });
      didFitRef.current = true;
    }
  }, [ports, isLeafletReady]);

  // Fly to selected port only when selection was driven from OUTSIDE the map
  // (e.g., side panel). Marker clicks already flyTo inside handleMarkerClick,
  // so we skip to avoid a duplicate flight that causes a "snap back" effect.
  useEffect(() => {
    const map = mapRef.current;
    const prev = lastSelectedRef.current;
    lastSelectedRef.current = selectedPortId;

    if (!map) return;
    // Marker click already handled the flyTo — consume the flag and bail.
    if (mapDrivenSelectRef.current) {
      mapDrivenSelectRef.current = false;
      return;
    }
    // Deselected (including via reset): don't fly anywhere here.
    if (!selectedPortId) return;
    // Same id as last render — nothing to do.
    if (selectedPortId === prev) return;

    const port = portsRef.current.find((p) => p.id === selectedPortId);
    if (!port) return;
    map.flyTo([port.lat, port.lng], Math.max(map.getZoom(), 8), { duration: 0.5 });
  }, [selectedPortId]);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    // Stop any in-flight pan/zoom so the reset animation isn't overridden.
    map.stop();
    // Clear selection BEFORE starting the reset animation so the
    // selection-change effect doesn't interfere.
    onPortSelect(null);
    // Wait for the side panel to unmount and the flex layout to settle,
    // then invalidate size and fly — otherwise Leaflet uses the pre-close
    // container width and the map appears to snap back after the fly.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
        map.flyTo(SA_CENTER, SA_ZOOM, { duration: 0.5 });
      });
    });
  }, [onPortSelect]);

  const toggleTheme = useCallback(() => {
    setMapTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const fitToPorts = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || portsRef.current.length === 0) return;
    const bounds = L.latLngBounds(portsRef.current.map((p) => [p.lat, p.lng]));
    if (bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 7, duration: 0.6 });
    }
  }, []);

  return (
    <div className={`heatmap-wrapper ${mapTheme}`}>
      <div ref={containerRef} className="map-container" />

      <div className="floating-controls top-right">
        <button
          type="button"
          onClick={resetView}
          className="map-btn"
          title={lang === "ar" ? "إعادة العرض" : "Reset View"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={fitToPorts}
          className="map-btn"
          title={lang === "ar" ? "احتواء المنافذ" : "Fit Ports"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 4 20 10 20" />
            <polyline points="20 10 20 4 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="map-btn"
          title={lang === "ar" ? "تبديل السمة" : "Toggle Theme"}
        >
          {mapTheme === "light" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
      </div>

      <div className="map-legend-panel">
        <div className="legend-header">{lang === "ar" ? "مستوى الخطورة" : "Risk Level"}</div>
        <div className="legend-items">
          <div className="legend-row">
            <span className="legend-marker high"></span>
            <span className="legend-label">{lang === "ar" ? "عالي" : "High"}</span>
          </div>
          <div className="legend-row">
            <span className="legend-marker medium"></span>
            <span className="legend-label">{lang === "ar" ? "متوسط" : "Medium"}</span>
          </div>
          <div className="legend-row">
            <span className="legend-marker low"></span>
            <span className="legend-label">{lang === "ar" ? "منخفض" : "Low"}</span>
          </div>
        </div>
        <div className="legend-gradient">
          <div className="gradient-bar"></div>
          <div className="gradient-labels">
            {lang === "ar" ? (
              <>
                <span>عالي</span>
                <span>منخفض</span>
              </>
            ) : (
              <>
                <span>Low</span>
                <span>High</span>
              </>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading-screen">
          <div className="loader">
            <div className="loader-ring"></div>
            <div className="loader-ring inner"></div>
            <div className="loader-dot"></div>
          </div>
          <span className="loader-text">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</span>
        </div>
      )}
    </div>
  );
}

export const HeatmapMap = memo(HeatmapMapInner);
