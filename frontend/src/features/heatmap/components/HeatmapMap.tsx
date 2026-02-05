"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { PortSummary } from "@/lib/api/client";

const SA_CENTER: [number, number] = [24.5, 46.5];
const SA_ZOOM = 6;

// Simplified Saudi Arabia border coordinates (GeoJSON polygon)
const SA_BORDER: [number, number][] = [
  [34.57, 32.15], [34.96, 29.50], [36.07, 29.19], [37.00, 31.51],
  [37.99, 30.51], [37.67, 30.34], [37.50, 30.00], [38.00, 28.00],
  [39.20, 27.79], [41.00, 27.00], [42.00, 27.00], [43.12, 27.85],
  [43.99, 27.00], [46.55, 29.10], [47.43, 28.99], [47.71, 28.53],
  [48.42, 28.55], [48.81, 27.69], [49.30, 27.46], [49.47, 27.11],
  [50.15, 26.69], [50.21, 26.28], [50.61, 25.88], [50.80, 24.75],
  [51.01, 24.29], [51.29, 24.24], [51.58, 24.25], [51.59, 22.93],
  [52.55, 22.93], [55.10, 22.62], [55.67, 22.00], [55.21, 20.23],
  [52.78, 19.16], [52.00, 19.00], [49.12, 18.62], [48.18, 18.17],
  [47.47, 17.12], [46.98, 16.95], [46.75, 17.28], [45.40, 17.33],
  [45.22, 17.43], [44.06, 17.41], [43.79, 17.32], [43.38, 17.58],
  [43.12, 17.09], [43.22, 16.67], [42.79, 16.38], [42.65, 16.77],
  [42.35, 17.08], [42.27, 17.47], [41.75, 17.87], [41.22, 18.67],
  [40.94, 19.49], [40.25, 20.17], [39.80, 21.00], [39.19, 21.29],
  [39.02, 22.00], [38.49, 23.69], [37.92, 24.18], [37.54, 24.29],
  [37.18, 25.08], [36.93, 25.60], [36.64, 25.83], [36.25, 26.57],
  [35.64, 27.38], [35.18, 28.06], [34.62, 28.06], [34.96, 29.36],
  [34.57, 32.15]
];

// Premium map tile providers
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

interface HeatmapMapProps {
  points: [number, number, number][];
  center: [number, number];
  ports: PortSummary[];
  selectedPortId: string | null;
  onPortSelect: (portId: string | null) => void;
}

// ZATCA Official Risk Colors
// HIGH: Warm Red #E84A41 | MEDIUM: Orange #FABB33 | LOW: Teal #4FBBBD
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

export function HeatmapMap({
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
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [mapTheme, setMapTheme] = useState<"light" | "dark">("light");

  // Load Leaflet dynamically (client-side only)
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

  // Initialize map
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
    });

    // Initial tile layer
    const style = MAP_STYLES[mapTheme];
    const tileLayer = L.tileLayer(style.url, {
      maxZoom: 19,
      attribution: style.attribution,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Add Saudi Arabia border
    const borderCoords = SA_BORDER.map(([lng, lat]) => [lat, lng] as [number, number]);
    const isDark = mapTheme === "dark";
    const borderLayer = L.polygon(borderCoords, {
      color: isDark ? "#4FBBBD" : "#1D3761",
      weight: 2,
      opacity: isDark ? 0.6 : 0.5,
      fillColor: isDark ? "#1D3761" : "#4FBBBD",
      fillOpacity: isDark ? 0.08 : 0.05,
      dashArray: "5, 5",
    }).addTo(map);
    borderLayerRef.current = borderLayer;

    // Add zoom control
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Attribution
    L.control.attribution({
      position: "bottomleft",
      prefix: false,
    }).addTo(map).addAttribution(style.attribution);

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      setIsLoading(false);
    }, 150);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, [isLeafletReady, center]);

  // Update tile layer and border when theme changes
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !tileLayerRef.current) return;

    const style = MAP_STYLES[mapTheme];
    const isDark = mapTheme === "dark";
    
    // Remove old tile layer and add new one
    map.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(style.url, {
      maxZoom: 19,
      attribution: style.attribution,
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();

    // Update border style
    if (borderLayerRef.current) {
      borderLayerRef.current.setStyle({
        color: isDark ? "#4FBBBD" : "#1D3761",
        opacity: isDark ? 0.6 : 0.5,
        fillColor: isDark ? "#1D3761" : "#4FBBBD",
        fillOpacity: isDark ? 0.08 : 0.05,
      });
    }
  }, [mapTheme, isLeafletReady]);

  // Update heat layer
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (points.length > 0) {
      const isDark = mapTheme === "dark";
      // ZATCA Colors: Teal #4FBBBD → Orange #FABB33 → Warm Red #E84A41
      // Smaller radius, less blur for tighter regions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 14,
        max: 1.0,
        minOpacity: isDark ? 0.65 : 0.55,
        gradient: isDark ? {
          0.0: "rgba(79, 187, 189, 0.0)",    // Teal transparent
          0.2: "rgba(79, 187, 189, 0.6)",    // Teal
          0.4: "rgba(79, 187, 189, 0.8)",    // Teal stronger
          0.55: "rgba(250, 187, 51, 0.85)",  // Orange
          0.7: "rgba(250, 187, 51, 0.9)",    // Orange stronger
          0.85: "rgba(232, 74, 65, 0.95)",   // Warm Red
          1.0: "rgba(232, 74, 65, 1)",       // Warm Red full
        } : {
          0.0: "rgba(79, 187, 189, 0.0)",    // Teal transparent
          0.2: "rgba(79, 187, 189, 0.5)",    // Teal
          0.4: "rgba(79, 187, 189, 0.7)",    // Teal stronger
          0.55: "rgba(250, 187, 51, 0.75)",  // Orange
          0.7: "rgba(250, 187, 51, 0.85)",   // Orange stronger
          0.85: "rgba(232, 74, 65, 0.9)",    // Warm Red
          1.0: "rgba(232, 74, 65, 1)",       // Warm Red full
        },
      });
      heat.addTo(map);
      heatLayerRef.current = heat;
    }
  }, [points, isLeafletReady, mapTheme]);

  // Update markers
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const isDark = mapTheme === "dark";

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Create markers
    ports.forEach((port) => {
      const isSelected = port.id === selectedPortId;
      const isHovered = port.id === hoveredPortId;
      const colors = getRiskColors(port.risk_level, isDark);
      
      // Dynamic sizing - compact
      const baseSize = 8;
      const size = isSelected ? 14 : isHovered ? 11 : baseSize;
      
      // Risk-based animation intensity
      const riskClass = port.risk_level === "HIGH" 
        ? "risk-high" 
        : port.risk_level === "MEDIUM" 
          ? "risk-medium" 
          : "risk-low";

      const icon = L.divIcon({
        className: "marker-wrapper",
        html: `
          <div class="marker-container ${riskClass} ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}" data-theme="${mapTheme}">
            <!-- Beacon pulse rings -->
            ${port.risk_level === "HIGH" ? `
              <div class="beacon-ring" style="--ring-color: ${colors.ring}; --delay: 0s;"></div>
              <div class="beacon-ring" style="--ring-color: ${colors.ring}; --delay: 0.8s;"></div>
              <div class="beacon-ring" style="--ring-color: ${colors.ring}; --delay: 1.6s;"></div>
            ` : port.risk_level === "MEDIUM" ? `
              <div class="beacon-ring slow" style="--ring-color: ${colors.ring}; --delay: 0s;"></div>
              <div class="beacon-ring slow" style="--ring-color: ${colors.ring}; --delay: 1.5s;"></div>
            ` : ''}
            
            <!-- Glow layer -->
            <div class="marker-glow" style="
              --glow-color: ${colors.glow};
              --glow-size: ${isSelected ? '22px' : isHovered ? '16px' : '12px'};
            "></div>
            
            <!-- Core marker -->
            <div class="marker-core" style="
              --marker-size: ${size}px;
              --marker-color: ${colors.main};
              --shadow-color: ${colors.glow};
            ">
              <div class="marker-shine"></div>
            </div>
          </div>
        `,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
        popupAnchor: [0, -25],
      });

      const marker = L.marker([port.lat, port.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : isHovered ? 500 : port.risk_level === "HIGH" ? 100 : 0,
        riseOnHover: true,
      });

      // Popup content
      const popupContent = `
        <div class="popup-card" data-theme="${mapTheme}">
          <div class="popup-header">
            <span class="popup-indicator" style="background: ${colors.main}; box-shadow: 0 0 8px ${colors.glow};"></span>
            <span class="popup-name">${lang === "ar" ? port.name_ar : port.name_en}</span>
          </div>
          <div class="popup-badge" style="background: ${colors.main}20; color: ${colors.main}; border: 1px solid ${colors.main}40;">
            ${port.risk_level === "HIGH" ? (lang === "ar" ? "خطورة عالية" : "High Risk") :
              port.risk_level === "MEDIUM" ? (lang === "ar" ? "خطورة متوسطة" : "Medium Risk") :
              (lang === "ar" ? "خطورة منخفضة" : "Low Risk")}
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        closeButton: false,
        autoClose: false,
        closeOnEscapeKey: false,
        closeOnClick: false,
        className: `premium-popup ${mapTheme}`,
        offset: [0, -8],
      });

      // Events
      marker.on("mouseover", () => {
        setHoveredPortId(port.id);
        marker.openPopup();
      });

      marker.on("mouseout", () => {
        setHoveredPortId(null);
        marker.closePopup();
      });

      marker.on("click", () => {
        if (selectedPortId === port.id) {
          onPortSelect(null);
        } else {
          onPortSelect(port.id);
          map.flyTo([port.lat, port.lng], Math.max(map.getZoom(), 8), {
            duration: 0.5,
            easeLinearity: 0.25,
          });
        }
      });

      marker.addTo(map);
      markersRef.current.set(port.id, marker);
    });
  }, [ports, selectedPortId, hoveredPortId, lang, onPortSelect, isLeafletReady, mapTheme]);

  // Reset view
  const resetView = useCallback(() => {
    mapRef.current?.flyTo(SA_CENTER, SA_ZOOM, { duration: 0.5 });
    onPortSelect(null);
  }, [onPortSelect]);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setMapTheme(prev => prev === "light" ? "dark" : "light");
  }, []);

  return (
    <div className={`heatmap-wrapper ${mapTheme}`}>
      <div ref={containerRef} className="map-container" />
      
      {/* Floating Controls */}
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

      {/* Legend */}
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

      {/* Loading */}
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
