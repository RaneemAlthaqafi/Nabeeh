"use client";

import { useI18n } from "@/lib/i18n/context";
import type { PortDto, KpisDto, IncidentsDto } from "@/lib/api/client";

type KpiLabelKey = "kpiViolence" | "kpiCameraBlocking" | "kpiCameraMisuse" | "kpiCameraShake" | "kpiSmoking" | "kpiShouting" | "kpiAbusiveLanguage";
type RiskLabelKey = "riskLow" | "riskMedium" | "riskHigh";

const KPI_KEYS: { key: string; labelKey: KpiLabelKey }[] = [
  { key: "violence", labelKey: "kpiViolence" },
  { key: "camera_blocking", labelKey: "kpiCameraBlocking" },
  { key: "camera_misuse", labelKey: "kpiCameraMisuse" },
  { key: "camera_shake", labelKey: "kpiCameraShake" },
  { key: "smoking", labelKey: "kpiSmoking" },
  { key: "shouting", labelKey: "kpiShouting" },
  { key: "abusive_language", labelKey: "kpiAbusiveLanguage" },
];

const TYPE_TO_LABEL: Record<string, KpiLabelKey> = Object.fromEntries(KPI_KEYS.map((k) => [k.key, k.labelKey]));

function getSeverityLabelKey(severity: string): RiskLabelKey {
  if (severity === "HIGH") return "riskHigh";
  if (severity === "MEDIUM") return "riskMedium";
  return "riskLow";
}

function getSeverityClass(severity: string): string {
  if (severity === "HIGH") return "nabeeh-risk-badge-high";
  if (severity === "MEDIUM") return "nabeeh-risk-badge-medium";
  return "nabeeh-risk-badge-low";
}

interface PortDetailsPanelProps {
  port: PortDto | null;
  kpis: KpisDto | null | undefined;
  incidents: IncidentsDto | null | undefined;
  isLoadingKpis: boolean;
  isLoadingIncidents: boolean;
}

function formatTime(iso: string | null, locale?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale ?? undefined, { 
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Port details panel with refined, institutional design.
 * Displays KPIs, risk level, and recent incidents.
 */
export function PortDetailsPanel({ 
  port, 
  kpis, 
  incidents, 
  isLoadingKpis, 
  isLoadingIncidents 
}: PortDetailsPanelProps) {
  const { t, lang } = useI18n();
  const dateLocale = lang === "ar" ? "ar-SA" : "en-US";

  // Empty state - no port selected
  if (!port) {
    return (
      <div className="nabeeh-panel">
        <div className="nabeeh-empty-state">
          <svg className="nabeeh-empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <p className="nabeeh-empty-state-text">{t("noPortSelected")}</p>
        </div>
      </div>
    );
  }

  const riskLevel = kpis?.risk_level ?? null;
  const riskClass = riskLevel ? getSeverityClass(riskLevel) : "nabeeh-risk-badge-low";

  return (
    <div className="nabeeh-panel font-somar">
      {/* Header with port name */}
      <div className="nabeeh-panel-header">
        <div className="flex items-center justify-between gap-3">
          <h3 className="nabeeh-panel-title truncate">{port.name_ar}</h3>
          {riskLevel && (
            <span className={`nabeeh-risk-badge ${riskClass}`}>
              {t(getSeverityLabelKey(riskLevel))}
            </span>
          )}
        </div>
      </div>

      <div className="nabeeh-panel-body">
        {/* Loading state */}
        {isLoadingKpis ? (
          <div className="nabeeh-empty-state">
            <div className="nabeeh-map-loader-ring" />
          </div>
        ) : kpis ? (
          <>
            {/* Risk Score Section */}
            <div className="nabeeh-panel-section">
              <div className="nabeeh-panel-section-title">{t("riskLevel")}</div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-zatca-navy">{kpis.risk_score.toFixed(1)}</span>
                <span className={`nabeeh-risk-badge ${riskClass}`}>
                  {t(getSeverityLabelKey(kpis.risk_level))}
                </span>
              </div>
            </div>

            {/* KPI Breakdown */}
            <div className="nabeeh-panel-section">
              <div className="nabeeh-panel-section-title">{t("total")}</div>
              <div className="nabeeh-kpi-list">
                {KPI_KEYS.map(({ key, labelKey }) => (
                  <div key={key} className="nabeeh-kpi-row">
                    <span className="nabeeh-kpi-label">{t(labelKey)}</span>
                    <span className="nabeeh-kpi-value">{kpis.counts[key] ?? 0}</span>
                  </div>
                ))}
                <div className="nabeeh-kpi-row nabeeh-kpi-total">
                  <span className="nabeeh-kpi-label">{t("total")}</span>
                  <span className="nabeeh-kpi-value">{kpis.total_events}</span>
                </div>
              </div>
            </div>

            {/* Last Incident */}
            {kpis.last_incident_at && (
              <div className="nabeeh-panel-section">
                <div className="nabeeh-panel-section-title">{t("lastIncident")}</div>
                <p className="text-sm text-zatca-navy font-medium">
                  {formatTime(kpis.last_incident_at, dateLocale)}
                </p>
              </div>
            )}
          </>
        ) : null}

        {/* Latest Incidents */}
        <div className="nabeeh-panel-section">
          <div className="nabeeh-panel-section-title">{t("latestIncidents")}</div>
          {isLoadingIncidents ? (
            <div className="nabeeh-empty-state" style={{ padding: "1rem" }}>
              <div className="nabeeh-map-loader-ring" />
            </div>
          ) : incidents?.incidents?.length ? (
            <div className="nabeeh-incident-list">
              {incidents.incidents.slice(0, 10).map((inc) => (
                <div key={inc.id} className="nabeeh-incident-item">
                  <span className="nabeeh-incident-time">
                    {formatTime(inc.timestamp, dateLocale)}
                  </span>
                  <span className="nabeeh-incident-type">
                    {TYPE_TO_LABEL[inc.type] ? t(TYPE_TO_LABEL[inc.type]) : inc.type}
                  </span>
                  <span className={`nabeeh-incident-severity ${getSeverityClass(inc.severity)}`}>
                    {t(getSeverityLabelKey(inc.severity))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zatca-darkGray">{t("noIncidents")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
