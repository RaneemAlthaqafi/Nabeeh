"use client";

import { useI18n } from "@/lib/i18n/context";

export type RangeKey = "24h" | "7d" | "30d";
export type ViolationType =
  | "violence"
  | "camera_blocking"
  | "camera_misuse"
  | "camera_shake"
  | "smoking"
  | "shouting"
  | "abusive_language";

interface FiltersBarProps {
  timeRange: RangeKey;
  onTimeRangeChange: (range: RangeKey) => void;
  violationType: ViolationType | null;
  onViolationTypeChange: (type: ViolationType | null) => void;
  severity: string | null;
  onSeverityChange: (severity: string | null) => void;
}

const TIME_RANGES: { key: RangeKey; labelKey: string }[] = [
  { key: "24h", labelKey: "filterLast24h" },
  { key: "7d", labelKey: "filterLast7d" },
  { key: "30d", labelKey: "filterLast30d" },
];

const VIOLATION_TYPES: ViolationType[] = [
  "violence",
  "camera_blocking",
  "camera_misuse",
  "camera_shake",
  "smoking",
  "shouting",
  "abusive_language",
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

export function FiltersBar({
  timeRange,
  onTimeRangeChange,
  violationType,
  onViolationTypeChange,
  severity,
  onSeverityChange,
}: FiltersBarProps) {
  const { t } = useI18n();

  return (
    <div className="filters-bar">
      {/* Time Range */}
      <div className="filter-group">
        <div className="filter-segment">
          {TIME_RANGES.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              className={`filter-segment-btn ${timeRange === key ? "active" : ""}`}
              onClick={() => onTimeRangeChange(key)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Violation Type Chips */}
      <div className="filter-group filter-chips">
        <button
          type="button"
          className={`filter-chip ${!violationType ? "active" : ""}`}
          onClick={() => onViolationTypeChange(null)}
        >
          {t("allViolations")}
        </button>
        {VIOLATION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`filter-chip ${violationType === type ? "active" : ""}`}
            onClick={() =>
              onViolationTypeChange(violationType === type ? null : type)
            }
          >
            {t(type)}
          </button>
        ))}
      </div>

      {/* Severity Filter */}
      <div className="filter-group">
        <div className="filter-segment filter-segment-severity">
          <button
            type="button"
            className={`filter-segment-btn ${!severity ? "active" : ""}`}
            onClick={() => onSeverityChange(null)}
          >
            {t("allViolations")}
          </button>
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              type="button"
              className={`filter-segment-btn filter-sev-${sev.toLowerCase()} ${
                severity === sev ? "active" : ""
              }`}
              onClick={() => onSeverityChange(severity === sev ? null : sev)}
            >
              {t(sev)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
