"use client";

import { useI18n } from "@/lib/i18n/context";
import type { PortDetail } from "@/lib/api/client";

interface PortDetailsPanelProps {
  portDetail: PortDetail | null;
  isLoading: boolean;
  onClose: () => void;
}

export function PortDetailsPanel({
  portDetail,
  isLoading,
  onClose,
}: PortDetailsPanelProps) {
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
        return "bg-red-100 text-red-700";
      case "MEDIUM":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-teal-100 text-teal-700";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!portDetail) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">
            {lang === "ar" ? portDetail.name_ar : portDetail.name_en}
          </h2>
          <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${getRiskClass(portDetail.risk_level)}`}>
            {t(portDetail.risk_level)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Risk Score */}
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <div className="text-4xl font-bold text-navy">{portDetail.risk_score.toFixed(1)}</div>
          <div className="text-sm text-gray-500 mt-1">{t("totalRiskScore")}</div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-navy">{portDetail.unique_inspectors_count}</div>
            <div className="text-xs text-gray-500">{t("totalInspectorsImpacted")}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-navy">{portDetail.incident_count}</div>
            <div className="text-xs text-gray-500">{t("totalIncidents")}</div>
          </div>
        </div>

        {/* Violations Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("violationsBreakdown")}</h3>
          <div className="space-y-2">
            {Object.entries(portDetail.violations_breakdown).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{t(type)}</span>
                <span className="text-sm font-semibold text-navy">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Inspectors */}
        {portDetail.top_inspectors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("topInspectors")}</h3>
            <div className="space-y-2">
              {portDetail.top_inspectors.slice(0, 5).map((inspector) => (
                <div key={inspector.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-navy">{inspector.id}</span>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getRiskClass(inspector.risk_level)}`}>
                      {t(inspector.risk_level)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{inspector.incident_count} {t("totalIncidents")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Incidents */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t("latestIncidents")}</h3>
          {portDetail.recent_incidents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t("noIncidents")}</p>
          ) : (
            <div className="space-y-2">
              {portDetail.recent_incidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      incident.severity === "HIGH" ? "bg-red-500" :
                      incident.severity === "MEDIUM" ? "bg-orange-500" : "bg-teal-500"
                    }`} />
                    <span className="text-sm text-gray-700">{t(incident.type)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTime(incident.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
