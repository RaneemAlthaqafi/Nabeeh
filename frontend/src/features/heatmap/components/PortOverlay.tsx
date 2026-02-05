"use client";

import { useI18n } from "@/lib/i18n/context";
import type { PortDetail, InspectorSummary } from "@/lib/api/client";

interface PortOverlayProps {
  portDetail: PortDetail | null;
  isLoading: boolean;
  onClose: () => void;
  onInspectorClick: (inspectorId: string) => void;
}

export function PortOverlay({
  portDetail,
  isLoading,
  onClose,
  onInspectorClick,
}: PortOverlayProps) {
  const { t, lang } = useI18n();

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskClass = (level: string) => {
    switch (level) {
      case "HIGH":
        return "risk-high";
      case "MEDIUM":
        return "risk-medium";
      default:
        return "risk-low";
    }
  };

  if (isLoading) {
    return (
      <div className="port-overlay">
        <div className="port-overlay-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!portDetail) return null;

  return (
    <div className="port-overlay">
      {/* Header */}
      <div className="port-overlay-header">
        <div className="port-overlay-title-row">
          <h3 className="port-overlay-title">
            {lang === "ar" ? portDetail.name_ar : portDetail.name_en}
          </h3>
          <span className={`risk-badge ${getRiskClass(portDetail.risk_level)}`}>
            {t(portDetail.risk_level)}
          </span>
        </div>
        <button
          type="button"
          className="port-overlay-close"
          onClick={onClose}
          aria-label={t("close")}
        >
          ✕
        </button>
      </div>

      {/* Risk Score */}
      <div className="port-overlay-score">
        <span className="port-overlay-score-value">
          {portDetail.risk_score.toFixed(1)}
        </span>
        <span className="port-overlay-score-label">{t("totalRiskScore")}</span>
      </div>

      {/* Quick Stats */}
      <div className="port-overlay-stats">
        <div className="port-overlay-stat">
          <span className="stat-value">{portDetail.unique_inspectors_count}</span>
          <span className="stat-label">{t("totalInspectorsImpacted")}</span>
        </div>
        <div className="port-overlay-stat">
          <span className="stat-value">{portDetail.incident_count}</span>
          <span className="stat-label">{t("totalIncidents")}</span>
        </div>
      </div>

      {/* Violations Breakdown */}
      <div className="port-overlay-section">
        <h4 className="port-overlay-section-title">{t("violationsBreakdown")}</h4>
        <div className="violations-grid">
          {Object.entries(portDetail.violations_breakdown).map(([type, count]) => (
            <div key={type} className="violation-item">
              <span className="violation-label">{t(type)}</span>
              <span className="violation-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Inspectors */}
      <div className="port-overlay-section">
        <h4 className="port-overlay-section-title">{t("topInspectors")}</h4>
        <div className="inspectors-list">
          {portDetail.top_inspectors.length === 0 ? (
            <p className="empty-state">{t("noData")}</p>
          ) : (
            portDetail.top_inspectors.slice(0, 5).map((inspector) => (
              <button
                key={inspector.id}
                type="button"
                className="inspector-row"
                onClick={() => onInspectorClick(inspector.id)}
              >
                <div className="inspector-row-main">
                  <span className="inspector-id">{inspector.id}</span>
                  <span className={`risk-badge-sm ${getRiskClass(inspector.risk_level)}`}>
                    {t(inspector.risk_level)}
                  </span>
                </div>
                <div className="inspector-row-meta">
                  <span>{inspector.incident_count} {t("totalIncidents")}</span>
                  <span className="inspector-chevron">→</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="port-overlay-section">
        <h4 className="port-overlay-section-title">{t("latestIncidents")}</h4>
        <div className="incidents-list">
          {portDetail.recent_incidents.length === 0 ? (
            <p className="empty-state">{t("noIncidents")}</p>
          ) : (
            portDetail.recent_incidents.map((incident) => (
              <div key={incident.id} className="incident-row">
                <div className="incident-row-main">
                  <span className={`severity-dot severity-${incident.severity.toLowerCase()}`} />
                  <span className="incident-type">{t(incident.type)}</span>
                </div>
                <span className="incident-time">{formatTime(incident.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
