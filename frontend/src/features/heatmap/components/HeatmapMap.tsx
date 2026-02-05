"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet.heat";
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
    case "HIGH": return "#C62828";
    case "MEDIUM": return "#F57C00";
    default: return "#00897B";
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
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      zoomAnimation: true,
      fadeAnimation: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapRef.current = map;

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

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

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
      const color = getRiskColor(port.risk_level);
      const size = isSelected ? 22 : isHovered ? 18 : 14;

      const icon = L.divIcon({
        className: "port-marker-icon",
        html: `
          <div class="port-dot" style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3)${isSelected ? ", 0 0 0 4px rgba(29,55,97,0.3)" : ""};
            transition: all 0.15s ease;
          "></div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)], // Popup appears directly above the marker
      });

      const marker = L.marker([port.lat, port.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : isHovered ? 500 : 0,
        riseOnHover: true,
      });

      // Create popup that appears directly above marker
      const popupContent = `<div class="port-name-popup">${lang === "ar" ? port.name_ar : port.name_en}</div>`;
      
      marker.bindPopup(popupContent, {
        closeButton: false,
        autoClose: false,
        closeOnEscapeKey: false,
        closeOnClick: false,
        className: "port-popup",
        offset: [0, 0], // No extra offset - popupAnchor handles it
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
          map.flyTo([port.lat, port.lng], Math.max(map.getZoom(), 7), {
            duration: 0.4,
          });
        }
      });

      marker.addTo(map);
      markersRef.current.set(port.id, marker);
    });
  }, [ports, selectedPortId, hoveredPortId, lang, onPortSelect]);

  // Reset view
  const resetView = useCallback(() => {
    mapRef.current?.flyTo(SA_CENTER, SA_ZOOM, { duration: 0.4 });
    onPortSelect(null);
  }, [onPortSelect]);

  return (
    <div className="w-full h-full relative bg-gray-100">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Reset View Button */}
      <button
        type="button"
        onClick={resetView}
        className="absolute top-4 right-14 z-[500] bg-white rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-gray-50 transition-colors"
        title="Reset View"
      >
        ↺
      </button>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-[1000]">
          <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
