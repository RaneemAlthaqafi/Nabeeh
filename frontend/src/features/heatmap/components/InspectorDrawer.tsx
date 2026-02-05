"use client";

import { useI18n } from "@/lib/i18n/context";
import type { InspectorDetail } from "@/lib/api/client";

interface InspectorDrawerProps {
  inspector: InspectorDetail | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function InspectorDrawer({
  inspector,
  isLoading,
  isOpen,
  onClose,
}: InspectorDrawerProps) {
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />
      
      {/* Drawer */}
      <div className={`inspector-drawer ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="drawer-header">
          <button
            type="button"
            className="drawer-back"
            onClick={onClose}
            aria-label={t("back")}
          >
            ← {t("back")}
          </button>
          <h2 className="drawer-title">{t("inspectorDetails")}</h2>
        </div>

        {isLoading ? (
          <div className="drawer-loading">
            <div className="loading-spinner" />
          </div>
        ) : inspector ? (
          <div className="drawer-content">
            {/* Inspector ID & Risk */}
            <div className="inspector-header">
              <div className="inspector-id-large">{inspector.id}</div>
              <div className="inspector-risk-row">
                <span className={`risk-badge-lg ${getRiskClass(inspector.risk_level)}`}>
                  {t(inspector.risk_level)}
                </span>
                <span className="inspector-score">
                  {inspector.risk_score.toFixed(1)} {t("totalRiskScore")}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="inspector-stats">
              <div className="inspector-stat">
                <span className="stat-value-lg">{inspector.total_incidents}</span>
                <span className="stat-label">{t("totalIncidents")}</span>
              </div>
              <div className="inspector-stat">
                <span className="stat-value-lg">{inspector.ports_affected.length}</span>
                <span className="stat-label">{t("portsAffected")}</span>
              </div>
              <div className="inspector-stat">
                <span className="stat-value-lg">{formatTime(inspector.last_incident_at)}</span>
                <span className="stat-label">{t("lastIncident")}</span>
              </div>
            </div>

            {/* Violations Breakdown */}
            <div className="drawer-section">
              <h3 className="drawer-section-title">{t("violationsBreakdown")}</h3>
              <div className="breakdown-bars">
                {Object.entries(inspector.violations_breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const max = Math.max(...Object.values(inspector.violations_breakdown));
                    const percent = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div key={type} className="breakdown-bar-row">
                        <span className="breakdown-label">{t(type)}</span>
                        <div className="breakdown-bar-container">
                          <div
                            className="breakdown-bar"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="breakdown-count">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="drawer-section">
              <h3 className="drawer-section-title">{t("severityBreakdown")}</h3>
              <div className="severity-breakdown">
                {Object.entries(inspector.severity_breakdown).map(([sev, count]) => (
                  <div key={sev} className={`severity-card severity-card-${sev.toLowerCase()}`}>
                    <span className="severity-card-value">{count}</span>
                    <span className="severity-card-label">{t(sev)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Incidents */}
            <div className="drawer-section">
              <h3 className="drawer-section-title">{t("recentIncidents")}</h3>
              <div className="incidents-timeline">
                {inspector.recent_incidents.length === 0 ? (
                  <p className="empty-state">{t("noIncidents")}</p>
                ) : (
                  inspector.recent_incidents.map((incident, idx) => (
                    <div key={incident.id} className="timeline-item">
                      <div className="timeline-marker">
                        <span className={`severity-dot severity-${incident.severity.toLowerCase()}`} />
                        {idx < inspector.recent_incidents.length - 1 && (
                          <span className="timeline-line" />
                        )}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-type">{t(incident.type)}</span>
                          <span className={`severity-tag severity-tag-${incident.severity.toLowerCase()}`}>
                            {t(incident.severity)}
                          </span>
                        </div>
                        <div className="timeline-meta">
                          <span>{formatTime(incident.timestamp)}</span>
                          {incident.port_name_ar && (
                            <span className="timeline-port">
                              {lang === "ar" ? incident.port_name_ar : incident.port_name_en}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="drawer-empty">
            <p>{t("noData")}</p>
          </div>
        )}
      </div>
    </>
  );
}
