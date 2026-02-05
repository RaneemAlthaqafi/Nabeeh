"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { PortSummary } from "@/lib/api/client";

const SA_CENTER: [number, number] = [24.5, 46.5];
const SA_ZOOM = 6;

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

// Risk colors optimized for both light and dark modes
function getRiskColors(level: string, isDark: boolean) {
  const colors = {
    HIGH: {
      main: "#ef4444",
      glow: isDark ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.35)",
      ring: isDark ? "rgba(239, 68, 68, 0.8)" : "rgba(239, 68, 68, 0.6)",
    },
    MEDIUM: {
      main: "#f59e0b",
      glow: isDark ? "rgba(245, 158, 11, 0.45)" : "rgba(245, 158, 11, 0.3)",
      ring: isDark ? "rgba(245, 158, 11, 0.7)" : "rgba(245, 158, 11, 0.5)",
    },
    LOW: {
      main: "#10b981",
      glow: isDark ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.25)",
      ring: isDark ? "rgba(16, 185, 129, 0.6)" : "rgba(16, 185, 129, 0.4)",
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

  // Update tile layer when theme changes
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !tileLayerRef.current) return;

    const style = MAP_STYLES[mapTheme];
    
    // Remove old layer and add new one
    map.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(style.url, {
      maxZoom: 19,
      attribution: style.attribution,
    }).addTo(map);
    tileLayerRef.current = newTileLayer;
    
    // Move tile layer to back
    newTileLayer.bringToBack();
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(points, {
        radius: 50,
        blur: 35,
        maxZoom: 12,
        max: 1.0,
        minOpacity: isDark ? 0.5 : 0.4,
        gradient: isDark ? {
          0.0: "rgba(16, 185, 129, 0.0)",
          0.2: "rgba(16, 185, 129, 0.4)",
          0.4: "rgba(52, 211, 153, 0.55)",
          0.5: "rgba(251, 191, 36, 0.65)",
          0.65: "rgba(245, 158, 11, 0.75)",
          0.8: "rgba(239, 68, 68, 0.85)",
          1.0: "rgba(220, 38, 38, 1)",
        } : {
          0.0: "rgba(16, 185, 129, 0.0)",
          0.2: "rgba(16, 185, 129, 0.3)",
          0.4: "rgba(52, 211, 153, 0.45)",
          0.5: "rgba(251, 191, 36, 0.55)",
          0.65: "rgba(245, 158, 11, 0.65)",
          0.8: "rgba(239, 68, 68, 0.75)",
          1.0: "rgba(185, 28, 28, 0.9)",
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
      
      // Dynamic sizing
      const baseSize = 14;
      const size = isSelected ? 24 : isHovered ? 18 : baseSize;
      
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
              --glow-size: ${isSelected ? '35px' : isHovered ? '28px' : '22px'};
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
            <span>{lang === "ar" ? "منخفض" : "Low"}</span>
            <span>{lang === "ar" ? "عالي" : "High"}</span>
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
