"use client";

import { useI18n } from "@/lib/i18n/context";
import type { NationwideSummary, PortDetail } from "@/lib/api/client";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
  trend?: "up" | "down" | "stable";
}

function KpiCard({ label, value, subtitle, highlight, trend }: KpiCardProps) {
  return (
    <div className={`kpi-card ${highlight ? "kpi-card-highlight" : ""}`}>
      <span className="kpi-card-label">{label}</span>
      <span className="kpi-card-value">
        {value}
        {trend && (
          <span className={`kpi-trend kpi-trend-${trend}`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </span>
      {subtitle && <span className="kpi-card-subtitle">{subtitle}</span>}
    </div>
  );
}

interface OverlayDashboardProps {
  summary: NationwideSummary | null;
  portDetail: PortDetail | null;
  isLoading: boolean;
  selectedPortId: string | null;
}

export function OverlayDashboard({
  summary,
  portDetail,
  isLoading,
  selectedPortId,
}: OverlayDashboardProps) {
  const { t, lang } = useI18n();

  // Format time for display
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

  // Get risk level class
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
      <div className="overlay-dashboard">
        <div className="overlay-dashboard-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  // Show port-specific KPIs when a port is selected
  if (selectedPortId && portDetail) {
    return (
      <div className="overlay-dashboard overlay-dashboard-port">
        <div className="overlay-dashboard-header">
          <div className="overlay-dashboard-title-row">
            <h2 className="overlay-dashboard-title">
              {lang === "ar" ? portDetail.name_ar : portDetail.name_en}
            </h2>
            <span className={`risk-badge ${getRiskClass(portDetail.risk_level)}`}>
              {t(portDetail.risk_level)}
            </span>
          </div>
          <span className="overlay-dashboard-subtitle">{t("selectedPort")}</span>
        </div>
        <div className="kpi-grid kpi-grid-4">
          <KpiCard
            label={t("totalRiskScore")}
            value={portDetail.risk_score.toFixed(1)}
            highlight
          />
          <KpiCard
            label={t("totalInspectorsImpacted")}
            value={portDetail.unique_inspectors_count}
          />
          <KpiCard
            label={t("totalIncidents")}
            value={portDetail.incident_count}
          />
          <KpiCard
            label={t("lastIncident")}
            value={formatTime(portDetail.last_incident_at)}
          />
        </div>
      </div>
    );
  }

  // Nationwide summary
  if (!summary) return null;

  return (
    <div className="overlay-dashboard">
      <div className="overlay-dashboard-header">
        <h2 className="overlay-dashboard-title">{t("nationwide")}</h2>
        <span className="overlay-dashboard-subtitle">{t("appSubtitle")}</span>
      </div>
      <div className="kpi-grid kpi-grid-5">
        <KpiCard
          label={t("totalRiskScore")}
          value={summary.total_risk_score.toFixed(1)}
          highlight
        />
        <KpiCard
          label={t("totalInspectorsImpacted")}
          value={summary.total_inspectors_impacted}
        />
        <KpiCard
          label={t("totalIncidents")}
          value={summary.total_incidents}
        />
        <KpiCard
          label={t("totalPortsAffected")}
          value={summary.total_ports_affected}
        />
        <KpiCard
          label={t("lastIncident")}
          value={formatTime(summary.last_incident_at)}
        />
      </div>
    </div>
  );
}
