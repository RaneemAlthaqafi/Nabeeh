"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HeatPoint = [number, number, number];

interface Port {
  id: string;
  name_ar: string;
  lat: number;
  lng: number;
}

interface HeatmapMapProps {
  points: HeatPoint[];
  center: [number, number];
  onPortSelect?: (portId: string) => void;
  selectedPortId?: string | null;
  ports?: Port[];
}

/**
 * Intelligent, government-grade interactive map for Nabeeh.
 * 
 * Design principles:
 * - Deliberate, smooth responses
 * - Progressive information disclosure
 * - Calm, institutional tone
 * - No decorative animations
 */
export function HeatmapMap({ 
  points, 
  center, 
  onPortSelect, 
  selectedPortId,
  ports = [] 
}: HeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mounted, setMounted] = useState(false);
  const [hoveredPortId, setHoveredPortId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPointsRef = useRef<HeatPoint[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize map with refined settings
  useEffect(() => {
    if (!mounted || !containerRef.current || typeof window === "undefined") return;

    const L = require("leaflet");
    require("leaflet.heat");

    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
      // Smooth interactions
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      zoomAnimationThreshold: 4,
      // Refined zoom behavior
      wheelDebounceTime: 80,
      wheelPxPerZoomLevel: 120,
      // Smooth panning
      inertia: true,
      inertiaDeceleration: 2000,
      inertiaMaxSpeed: 1500,
      easeLinearity: 0.25,
    });

    // Custom zoom control position
    L.control.zoom({
      position: "bottomright",
    }).addTo(map);

    // Minimal attribution
    L.control.attribution({
      position: "bottomleft",
      prefix: false,
    }).addTo(map);

    // Refined tile layer with smooth loading
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO",
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    mapRef.current = map;

    // Delayed size calculation for proper rendering
    const resizeTimer = setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 150);

    // Handle window resize gracefully
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: true, duration: 0.3 });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
      heatLayerRef.current = null;
      markersRef.current.clear();
    };
  }, [mounted, center]);

  // Animated heatmap transitions
  useEffect(() => {
    if (!mounted || !mapRef.current || typeof window === "undefined") return;
    const L = require("leaflet");
    const map = mapRef.current;

    // Signal transition state
    setIsTransitioning(true);

    // Fade out existing layer smoothly
    const oldLayer = heatLayerRef.current;
    if (oldLayer) {
      const container = (oldLayer as unknown as { _canvas?: HTMLCanvasElement })._canvas;
      if (container) {
        container.style.transition = "opacity 0.3s ease-out";
        container.style.opacity = "0";
      }
      setTimeout(() => {
        try {
          map.removeLayer(oldLayer);
        } catch { /* layer might already be removed */ }
      }, 300);
    }

    // Create new heat layer with refined settings
    const heatLayer = (L as unknown as { 
      heatLayer: (points: HeatPoint[], options?: object) => L.Layer 
    }).heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.4,
      gradient: {
        0.0: "rgba(79, 187, 189, 0)",      // Transparent teal
        0.25: "rgba(79, 187, 189, 0.6)",   // Teal (LOW)
        0.5: "rgba(250, 187, 51, 0.75)",   // Orange (MEDIUM)
        0.75: "rgba(232, 74, 65, 0.85)",   // Warm Red (HIGH)
        1.0: "rgba(232, 74, 65, 1)",       // Full Red (CRITICAL)
      },
    });

    // Add with fade-in effect
    heatLayer.addTo(map);
    const newContainer = (heatLayer as unknown as { _canvas?: HTMLCanvasElement })._canvas;
    if (newContainer) {
      newContainer.style.opacity = "0";
      newContainer.style.transition = "opacity 0.4s ease-in";
      requestAnimationFrame(() => {
        newContainer.style.opacity = "1";
      });
    }

    heatLayerRef.current = heatLayer;
    prevPointsRef.current = points;

    // Clear transition state
    setTimeout(() => setIsTransitioning(false), 400);

  }, [mounted, points]);

  const handlePortSelect = useCallback(
    (portId: string) => {
      onPortSelect?.(portId);
    },
    [onPortSelect]
  );

  // Create intelligent port markers with interaction states
  useEffect(() => {
    if (!mounted || !mapRef.current || !ports.length || typeof window === "undefined") return;
    const L = require("leaflet");
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    ports.forEach((port) => {
      const isSelected = selectedPortId === port.id;
      const isHovered = hoveredPortId === port.id;

      // Create dynamic icon based on state
      const icon = createPortIcon(L, { isSelected, isHovered });

      const marker = L.marker([port.lat, port.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : isHovered ? 800 : 500,
        riseOnHover: true,
        riseOffset: 250,
      });

      // Popup above marker on hover (more reliable than tooltip)
      const popup = L.popup({
        closeButton: false,
        autoClose: false,
        closeOnEscapeKey: false,
        closeOnClick: false,
        className: "nabeeh-popup",
        offset: [0, -8],
      }).setContent(`<span>${port.name_ar}</span>`);
      
      marker.bindPopup(popup);

      // Interaction handlers
      marker.on("click", () => {
        handlePortSelect(port.id);
        // Smooth pan to selected port
        map.panTo([port.lat, port.lng], {
          animate: true,
          duration: 0.4,
          easeLinearity: 0.25,
        });
      });

      marker.on("mouseover", () => {
        setHoveredPortId(port.id);
        marker.openPopup();
      });

      marker.on("mouseout", () => {
        setHoveredPortId(null);
        marker.closePopup();
      });

      marker.addTo(map);
      markersRef.current.set(port.id, marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
    };
  }, [mounted, ports, handlePortSelect, selectedPortId, hoveredPortId]);

  // Update marker icons when selection/hover changes
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const L = require("leaflet");

    markersRef.current.forEach((marker, portId) => {
      const isSelected = selectedPortId === portId;
      const isHovered = hoveredPortId === portId;
      const newIcon = createPortIcon(L, { isSelected, isHovered });
      marker.setIcon(newIcon);
      marker.setZIndexOffset(isSelected ? 1000 : isHovered ? 800 : 500);
    });
  }, [mounted, selectedPortId, hoveredPortId]);

  // Smooth fly to selected port
  useEffect(() => {
    if (!mounted || !mapRef.current || !selectedPortId) return;
    const selectedPort = ports.find((p) => p.id === selectedPortId);
    if (selectedPort) {
      mapRef.current.flyTo([selectedPort.lat, selectedPort.lng], 7, {
        animate: true,
        duration: 0.6,
        easeLinearity: 0.25,
      });
    }
  }, [mounted, selectedPortId, ports]);

  if (!mounted) {
    return (
      <div className="nabeeh-map-container nabeeh-map-loading">
        <div className="nabeeh-map-loader">
          <div className="nabeeh-map-loader-ring" />
          <span>جاري تحميل الخريطة...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`nabeeh-map-container ${isTransitioning ? "nabeeh-map-transitioning" : ""}`}>
      <div ref={containerRef} className="nabeeh-map-canvas" />
      {/* Subtle vignette overlay for depth */}
      <div className="nabeeh-map-vignette" />
    </div>
  );
}

/** 
 * Create port marker icon with state-aware styling.
 * Visual hierarchy: Selected > Hovered > Default
 */
function createPortIcon(
  L: typeof import("leaflet"),
  state: { isSelected: boolean; isHovered: boolean }
): L.DivIcon {
  const { isSelected, isHovered } = state;

  // Size and styling based on state
  const size = isSelected ? 20 : isHovered ? 16 : 12;
  const borderWidth = isSelected ? 3 : 2;
  const bgColor = isSelected ? "#2053A4" : "#1D3761";
  const borderColor = isSelected ? "#fff" : isHovered ? "#fff" : "rgba(255,255,255,0.9)";
  const shadow = isSelected
    ? "0 0 0 4px rgba(32, 83, 164, 0.25), 0 2px 8px rgba(0,0,0,0.3)"
    : isHovered
    ? "0 0 0 3px rgba(29, 55, 97, 0.2), 0 2px 6px rgba(0,0,0,0.25)"
    : "0 1px 4px rgba(0,0,0,0.2)";
  const transform = isHovered && !isSelected ? "scale(1.1)" : "scale(1)";

  const totalSize = size + borderWidth * 2;
  
  return L.divIcon({
    className: "nabeeh-port-marker",
    html: `
      <span class="nabeeh-port-marker-inner" style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bgColor};
        border: ${borderWidth}px solid ${borderColor};
        display: block;
        box-shadow: ${shadow};
        transform: ${transform};
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      "></span>
    `,
    iconSize: [totalSize, totalSize],
    iconAnchor: [totalSize / 2, totalSize / 2],
    tooltipAnchor: [0, -(totalSize / 2)],
  });
}
