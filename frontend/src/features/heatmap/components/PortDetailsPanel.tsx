"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { PortDetail } from "@/lib/api/client";

interface PortDetailsPanelProps {
  portDetail: PortDetail | null;
  isLoading: boolean;
  onClose: () => void;
}

// Violation weights (same as backend)
const VIOLATION_WEIGHTS: Record<string, number> = {
  violence: 5,
  abusive_language: 4,
  camera_blocking: 3,
  camera_misuse: 3,
  camera_shake: 2,
  smoking: 2,
  shouting: 2,
};

// Convert risk score to percentage
// Reference: 50 points = 100% (very high risk)
// This aligns with thresholds: HIGH >= 25 (50%), MEDIUM >= 10 (20%), LOW < 10
const MAX_REFERENCE = 50;
function riskToPercent(score: number): number {
  return Math.min(Math.round((score / MAX_REFERENCE) * 100), 100);
}

export function PortDetailsPanel({
  portDetail,
  isLoading,
  onClose,
}: PortDetailsPanelProps) {
  const { t, lang } = useI18n();
  const [showRiskExplanation, setShowRiskExplanation] = useState(false);

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

  // Build explanation based on actual violations
  const buildRiskExplanation = (detail: PortDetail): string => {
    const lines: string[] = [];
    const isAr = lang === "ar";
    const actualScore = detail.risk_score;
    const percent = riskToPercent(actualScore);
    
    if (isAr) {
      lines.push("كيف حُسبت هذه النسبة؟");
      lines.push("");
      lines.push(`النقاط الفعلية: ${actualScore.toFixed(1)} نقطة`);
      lines.push(`الحد المرجعي: ${MAX_REFERENCE} نقطة = 100%`);
      lines.push(`النسبة: ${actualScore.toFixed(1)} ÷ ${MAX_REFERENCE} = ${percent}%`);
      lines.push("");
      lines.push("تصنيف الخطورة:");
      lines.push("• 0-20% = منخفضة (أقل من 10 نقاط)");
      lines.push("• 20-50% = متوسطة (10-25 نقطة)");
      lines.push("• 50-100% = عالية (أكثر من 25 نقطة)");
    } else {
      lines.push("How was this calculated?");
      lines.push("");
      lines.push(`Actual points: ${actualScore.toFixed(1)}`);
      lines.push(`Reference max: ${MAX_REFERENCE} points = 100%`);
      lines.push(`Percentage: ${actualScore.toFixed(1)} ÷ ${MAX_REFERENCE} = ${percent}%`);
      lines.push("");
      lines.push("Risk classification:");
      lines.push("• 0-20% = Low (under 10 points)");
      lines.push("• 20-50% = Medium (10-25 points)");
      lines.push("• 50-100% = High (over 25 points)");
    }
    
    return lines.join("\n");
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
        {/* Risk Score - Clickable */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRiskExplanation(!showRiskExplanation)}
            className="w-full text-center py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="text-4xl font-bold text-navy">{riskToPercent(portDetail.risk_score)}%</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
              {t("totalRiskScore")}
              <span className="w-4 h-4 bg-gray-200 rounded-full text-xs flex items-center justify-center text-gray-500">؟</span>
            </div>
          </button>
          
          {/* Explanation Tooltip */}
          {showRiskExplanation && (
            <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-navy text-white text-sm rounded-lg shadow-lg z-10 whitespace-pre-line">
              <button
                type="button"
                onClick={() => setShowRiskExplanation(false)}
                className="absolute top-2 left-2 text-white/60 hover:text-white text-xs"
              >
                ✕
              </button>
              {buildRiskExplanation(portDetail)}
            </div>
          )}
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
