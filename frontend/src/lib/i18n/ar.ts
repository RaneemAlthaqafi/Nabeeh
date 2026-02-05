/**
 * Arabic translations (Primary language - Formal/Fusha)
 * ترجمات عربية فصحى واضحة وبليغة
 */
export const ar = {
  // App
  appTitle: "نظام تنبيه ورصد لمخاطر الامتثال عبر المنافذ",
  appSubtitle: "لوحة رصد المخاطر",
  langAr: "العربية",
  langEn: "English",

  // Navigation
  nationwide: "نظرة شاملة على المملكة",
  selectedPort: "المنفذ المختار",
  
  // Time filters
  filterLast24h: "اليوم",
  filterLast7d: "الأسبوع",
  filterLast30d: "الشهر",

  // KPI Labels with clear descriptions
  totalRiskScore: "مؤشر الخطورة",
  totalRiskScoreDesc: `نسبة الخطورة من 100%
• 0-25% = وضع آمن
• 25-50% = يحتاج متابعة
• 50-75% = خطورة ملحوظة
• 75-100% = خطورة عالية جداً

كيف تُحسب النسبة؟
تُجمع نقاط المخالفات ثم تُحوّل لنسبة مئوية.

نقاط كل مخالفة:
اعتداء=5 | إساءة لفظية=4 | كاميرا=3 | أخرى=2

مثال: 46 مخالفة متوسطة الشدة ≈ 58%`,
  
  totalIncidents: "المخالفات المرصودة",
  totalIncidentsDesc: "العدد الكلي للمخالفات التي تم رصدها وتسجيلها خلال الفترة المحددة. تشمل جميع أنواع المخالفات بمختلف درجاتها.",
  
  totalInspectorsImpacted: "المفتشون المعنيون",
  totalInspectorsImpactedDesc: "عدد المفتشين الذين سُجّلت عليهم مخالفة واحدة على الأقل. إذا ارتكب مفتش واحد عدة مخالفات، يُحسب مرة واحدة فقط.",
  
  totalPortsAffected: "المنافذ المتأثرة",
  totalPortsAffectedDesc: "عدد المنافذ الحدودية التي شهدت مخالفات خلال الفترة المحددة.",
  
  lastIncident: "آخر مخالفة",
  incidentCount: "عدد المخالفات",
  inspectorCount: "عدد المفتشين",
  uniqueInspectors: "مفتشون فريدون",

  // Risk levels
  riskLevel: "درجة الخطورة",
  riskHigh: "خطورة عالية",
  riskMedium: "خطورة متوسطة",
  riskLow: "خطورة منخفضة",
  HIGH: "عالية",
  MEDIUM: "متوسطة",
  LOW: "منخفضة",

  // Violation types (Arabic) - clear and formal
  violence: "الاعتداء الجسدي",
  camera_blocking: "حجب الكاميرا",
  camera_misuse: "العبث بالكاميرا",
  camera_shake: "ثبات الكاميرا",
  smoking: "التدخين",
  shouting: "رفع الصوت",
  abusive_language: "الإساءة اللفظية",

  // Violation filter labels
  allViolations: "جميع المخالفات",
  filterByViolation: "تصفية حسب نوع المخالفة",
  filterBySeverity: "تصفية حسب درجة الخطورة",

  // Inspector section
  inspectors: "المفتشون",
  topInspectors: "المفتشون الأكثر مخالفات",
  inspectorDetails: "بيانات المفتش",
  inspectorId: "الرقم التعريفي",
  inspectorRiskScore: "مؤشر خطورة المفتش",
  violationsBreakdown: "توزيع المخالفات حسب النوع",
  severityBreakdown: "توزيع المخالفات حسب الخطورة",
  portsAffected: "المنافذ ذات الصلة",
  inspectorsWithViolation: "مفتشون عليهم مخالفات",

  // Port section
  portDetails: "تفاصيل المنفذ",
  portName: "اسم المنفذ",
  portRiskScore: "مؤشر خطورة المنفذ",
  selectPort: "اختر منفذاً من الخريطة",
  noPortSelected: "لم يُختر أي منفذ",
  selectPortInstruction: "انقر على أي نقطة في الخريطة لعرض تفاصيل المنفذ",

  // Incidents
  recentIncidents: "آخر المخالفات المسجلة",
  latestIncidents: "أحدث ١٠ مخالفات",
  noIncidents: "لا توجد مخالفات مسجلة",
  incidentTimeline: "السجل الزمني للمخالفات",

  // Map controls
  resetView: "إعادة ضبط الخريطة",
  locateSaudiArabia: "العودة لنظرة المملكة",
  zoomIn: "تكبير",
  zoomOut: "تصغير",

  // Actions
  viewDetails: "عرض التفاصيل",
  close: "إغلاق",
  back: "رجوع",

  // States
  loading: "جارٍ التحميل...",
  error: "تعذّر تحميل البيانات",
  noData: "لا تتوفر بيانات للعرض",

  // Trend
  trend: "الاتجاه",
  increasing: "في ازدياد",
  decreasing: "في انخفاض",
  stable: "مستقر",
};
