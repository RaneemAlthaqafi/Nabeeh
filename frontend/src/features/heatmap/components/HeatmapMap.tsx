"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet.heat";
import { useI18n } from "@/lib/i18n/context";
import type { PortSummary } from "@/lib/api/client";

// Saudi Arabia center
const SA_CENTER: [number, number] = [24.5, 46.5];
const SA_ZOOM = 6;

interface HeatmapMapProps {
  points: [number, number, number][];
  center: [number, number];
  ports: PortSummary[];
  selectedPortId: string | null;
  onPortSelect: (portId: string | null) => void;
  dimUnselected?: boolean;
}

// Risk color mapping
function getRiskColor(level: string): string {
  switch (level) {
    case "HIGH":
      return "#C62828";
    case "MEDIUM":
      return "#F57C00";
    default:
      return "#00897B";
  }
}

// Create custom marker icon
function createMarkerIcon(
  port: PortSummary,
  isSelected: boolean,
  isHovered: boolean
): L.DivIcon {
  const baseSize = isSelected ? 24 : isHovered ? 20 : 16;
  const color = getRiskColor(port.risk_level);
  const borderWidth = isSelected ? 3 : 2;
  const opacity = 1;

  return L.divIcon({
    className: `port-marker ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`,
    html: `
      <div style="
        width: ${baseSize}px;
        height: ${baseSize}px;
        background: ${color};
        border: ${borderWidth}px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3)${isSelected ? ", 0 0 0 4px rgba(29,55,97,0.3)" : ""};
        opacity: ${opacity};
        transition: all 0.2s ease;
        transform: ${isHovered && !isSelected ? "scale(1.15)" : "scale(1)"};
      "></div>
    `,
    iconSize: [baseSize, baseSize],
    iconAnchor: [baseSize / 2, baseSize / 2],
  });
}

export function HeatmapMap({
  points,
  center,
  ports,
  selectedPortId,
  onPortSelect,
  dimUnselected = false,
}: HeatmapMapProps) {
  const { lang } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: SA_ZOOM,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      dragging: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    // Add zoom control to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Use CARTO light tiles for clean look
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

    // Fix map size after render
    setTimeout(() => {
      map.invalidateSize();
      setIsLoading(false);
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center]);

  // Update heat layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Create new heat layer
    if (points.length > 0) {
      const heat = (L as any).heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.0: "rgba(0, 137, 123, 0.1)",
          0.3: "rgba(0, 137, 123, 0.4)",
          0.5: "rgba(245, 124, 0, 0.6)",
          0.7: "rgba(230, 81, 0, 0.8)",
          1.0: "rgba(198, 40, 40, 1)",
        },
      });
      heat.addTo(map);
      heatLayerRef.current = heat;
    }
  }, [points]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Create new markers
    ports.forEach((port) => {
      const isSelected = port.id === selectedPortId;
      const isHovered = port.id === hoveredPortId;

      const marker = L.marker([port.lat, port.lng], {
        icon: createMarkerIcon(port, isSelected, isHovered),
        zIndexOffset: isSelected ? 1000 : isHovered ? 500 : 0,
        riseOnHover: true,
      });

      // Popup for port name
      const popup = L.popup({
        closeButton: false,
        autoClose: false,
        closeOnEscapeKey: false,
        closeOnClick: false,
        className: "nabeeh-popup",
        offset: [0, -8],
      }).setContent(`<span>${lang === "ar" ? port.name_ar : port.name_en}</span>`);

      marker.bindPopup(popup);

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
          // Smooth pan to selected port
          map.flyTo([port.lat, port.lng], Math.max(map.getZoom(), 7), {
            duration: 0.5,
          });
        }
      });

      marker.addTo(map);
      markersRef.current.set(port.id, marker);
    });

    // Update marker icons when selection/hover changes
    return () => {};
  }, [ports, lang, onPortSelect, selectedPortId]);

  // Update marker icons on hover/selection change
  useEffect(() => {
    markersRef.current.forEach((marker, portId) => {
      const port = ports.find((p) => p.id === portId);
      if (!port) return;

      const isSelected = portId === selectedPortId;
      const isHovered = portId === hoveredPortId;

      marker.setIcon(createMarkerIcon(port, isSelected, isHovered));
      marker.setZIndexOffset(isSelected ? 1000 : isHovered ? 500 : 0);

      // Apply dimming via opacity
      if (dimUnselected && selectedPortId && !isSelected) {
        marker.setOpacity(0.4);
      } else {
        marker.setOpacity(1);
      }
    });
  }, [selectedPortId, hoveredPortId, dimUnselected, ports]);

  // Reset view function
  const resetView = useCallback(() => {
    mapRef.current?.flyTo(SA_CENTER, SA_ZOOM, { duration: 0.5 });
    onPortSelect(null);
  }, [onPortSelect]);

  return (
    <div className="nabeeh-map-container">
      <div ref={containerRef} className="nabeeh-map-canvas" />
      
      {/* Map Controls */}
      <div className="map-controls">
        <button
          type="button"
          className="map-control-btn"
          onClick={resetView}
          title="Reset View"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {isLoading && (
        <div className="map-loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
}
