"use client";

import { useI18n } from "@/lib/i18n/context";

export type RangeKey = "24h" | "7d" | "30d";

interface DateRangeFiltersProps {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
}

/**
 * Time range filter - Government style.
 * Minimal, clear, instant feedback.
 */
export function DateRangeFilters({ value, onChange }: DateRangeFiltersProps) {
  const { t } = useI18n();
  
  const options: { key: RangeKey; labelKey: "filterLast24h" | "filterLast7d" | "filterLast30d" }[] = [
    { key: "24h", labelKey: "filterLast24h" },
    { key: "7d", labelKey: "filterLast7d" },
    { key: "30d", labelKey: "filterLast30d" },
  ];

  return (
    <div className="nabeeh-time-filter" role="tablist" aria-label="Time range">
      {options.map(({ key, labelKey }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={`nabeeh-time-filter-btn ${value === key ? "nabeeh-time-filter-btn-active" : ""}`}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
