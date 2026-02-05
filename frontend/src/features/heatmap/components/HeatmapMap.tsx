"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { PortSummary } from "@/lib/api/client";

const SA_CENTER: [number, number] = [24.5, 46.5];
const SA_ZOOM = 6;

interface HeatmapMapProps {
  points: [number, number, number][];
  center: [number, number];
  ports: PortSummary[];
  selectedPortId: string | null;
  onPortSelect: (portId: string | null) => void;
}

function getRiskColor(level: string): string {
  switch (level) {
    case "HIGH": return "#ff3d5a";
    case "MEDIUM": return "#ffa726";
    default: return "#00e5a0";
  }
}

function getRiskGlow(level: string): string {
  switch (level) {
    case "HIGH": return "rgba(255, 61, 90, 0.6)";
    case "MEDIUM": return "rgba(255, 167, 38, 0.5)";
    default: return "rgba(0, 229, 160, 0.4)";
  }
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
  const heatLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

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

  // Initialize map with dark premium style
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
    });

    // Dark premium map style
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Custom attribution
    L.control.attribution({
      position: "bottomleft",
      prefix: false,
    }).addTo(map).addAttribution('© <a href="https://carto.com/">CARTO</a>');

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      setIsLoading(false);
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isLeafletReady, center]);

  // Update heat layer with stunning gradient
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (points.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(points, {
        radius: 45,
        blur: 30,
        maxZoom: 10,
        max: 1.0,
        minOpacity: 0.4,
        gradient: {
          0.0: "rgba(0, 229, 160, 0.0)",
          0.15: "rgba(0, 229, 160, 0.3)",
          0.3: "rgba(0, 200, 180, 0.5)",
          0.45: "rgba(255, 200, 50, 0.6)",
          0.6: "rgba(255, 140, 0, 0.75)",
          0.75: "rgba(255, 80, 50, 0.85)",
          0.9: "rgba(255, 40, 80, 0.95)",
          1.0: "rgba(255, 0, 60, 1)",
        },
      });
      heat.addTo(map);
      heatLayerRef.current = heat;
    }
  }, [points, isLeafletReady]);

  // Update markers with stunning animated effects
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Create new markers
    ports.forEach((port) => {
      const isSelected = port.id === selectedPortId;
      const isHovered = port.id === hoveredPortId;
      const color = getRiskColor(port.risk_level);
      const glow = getRiskGlow(port.risk_level);
      
      // Dynamic sizing
      const baseSize = 16;
      const size = isSelected ? baseSize + 10 : isHovered ? baseSize + 6 : baseSize;
      
      // Animation class based on risk
      const animationClass = port.risk_level === "HIGH" 
        ? "pulse-high" 
        : port.risk_level === "MEDIUM" 
          ? "pulse-medium" 
          : "pulse-low";

      const icon = L.divIcon({
        className: "port-marker-wrapper",
        html: `
          <div class="port-marker ${animationClass} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}">
            <!-- Outer glow ring -->
            <div class="marker-glow" style="
              background: ${glow};
              box-shadow: 0 0 ${isSelected ? '30' : '20'}px ${isSelected ? '15' : '10'}px ${glow};
            "></div>
            
            <!-- Pulse rings for high risk -->
            ${port.risk_level === "HIGH" ? `
              <div class="pulse-ring" style="border-color: ${color};"></div>
              <div class="pulse-ring delay-1" style="border-color: ${color};"></div>
            ` : ''}
            
            <!-- Main dot -->
            <div class="marker-core" style="
              width: ${size}px;
              height: ${size}px;
              background: radial-gradient(circle at 30% 30%, ${color}, ${color}dd);
              box-shadow: 
                0 0 10px ${glow},
                inset 0 -2px 6px rgba(0,0,0,0.3),
                inset 0 2px 4px rgba(255,255,255,0.4);
            "></div>
            
            <!-- Inner highlight -->
            <div class="marker-highlight" style="
              width: ${size * 0.4}px;
              height: ${size * 0.4}px;
            "></div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([port.lat, port.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : isHovered ? 500 : port.risk_level === "HIGH" ? 100 : 0,
        riseOnHover: true,
      });

      // Create elegant popup
      const popupContent = `
        <div class="port-popup-content">
          <div class="port-popup-name">${lang === "ar" ? port.name_ar : port.name_en}</div>
          <div class="port-popup-risk" style="color: ${color};">
            <span class="risk-dot" style="background: ${color};"></span>
            ${port.risk_level === "HIGH" ? (lang === "ar" ? "عالي" : "High") :
              port.risk_level === "MEDIUM" ? (lang === "ar" ? "متوسط" : "Medium") :
              (lang === "ar" ? "منخفض" : "Low")}
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        closeButton: false,
        autoClose: false,
        closeOnEscapeKey: false,
        closeOnClick: false,
        className: "stunning-popup",
        offset: [0, -5],
      });

      // Event handlers
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
            duration: 0.6,
            easeLinearity: 0.25,
          });
        }
      });

      marker.addTo(map);
      markersRef.current.set(port.id, marker);
    });
  }, [ports, selectedPortId, hoveredPortId, lang, onPortSelect, isLeafletReady]);

  // Reset view
  const resetView = useCallback(() => {
    mapRef.current?.flyTo(SA_CENTER, SA_ZOOM, { duration: 0.6 });
    onPortSelect(null);
  }, [onPortSelect]);

  return (
    <div className="heatmap-container">
      {/* Ambient gradient overlay */}
      <div className="ambient-overlay" />
      
      <div ref={containerRef} className="map-canvas" />
      
      {/* Floating controls */}
      <div className="map-controls">
        <button
          type="button"
          onClick={resetView}
          className="control-btn"
          title="Reset View"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">{lang === "ar" ? "مستوى الخطورة" : "Risk Level"}</div>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot high"></span>
            <span>{lang === "ar" ? "عالي" : "High"}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot medium"></span>
            <span>{lang === "ar" ? "متوسط" : "Medium"}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot low"></span>
            <span>{lang === "ar" ? "منخفض" : "Low"}</span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring delay"></div>
          </div>
        </div>
      )}
    </div>
  );
}
