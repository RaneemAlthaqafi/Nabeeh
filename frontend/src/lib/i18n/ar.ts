/**
 * Arabic (فصحى) — default, executive tone.
 */
export const ar = {
  appTitle: "نبيه خريطة مخاطر المنافذ",
  filterLast24h: "آخر ٢٤ ساعة",
  filterLast7d: "آخر ٧ أيام",
  filterLast30d: "آخر ٣٠ يومًا",
  portDetails: "تفاصيل المنفذ",
  riskLevel: "مستوى الخطر",
  riskLow: "منخفض",
  riskMedium: "متوسط",
  riskHigh: "مرتفع",
  kpiViolence: "العنف",
  kpiCameraBlocking: "تغطية الكاميرا",
  kpiCameraMisuse: "سوء استخدام الكاميرا",
  kpiCameraShake: "اهتزاز غير طبيعي",
  kpiSmoking: "التدخين",
  kpiShouting: "ارتفاع الصوت",
  kpiAbusiveLanguage: "الألفاظ المسيئة",
  total: "الإجمالي",
  lastIncident: "آخر حادثة",
  latestIncidents: "أحدث ١٠ حوادث",
  noPortSelected: "اختر منفذًا من الخريطة",
  noIncidents: "لا توجد حوادث في الفترة المحددة",
  langAr: "العربية",
  langEn: "English",
  loading: "جاري التحميل...",
  error: "حدث خطأ",
} as const;

export type I18nKeys = keyof typeof ar;
