/**
 * English translations
 */
export const en = {
  // App
  appTitle: "Compliance Risk Alert & Monitoring System",
  appSubtitle: "Risk Monitoring Dashboard",
  langAr: "العربية",
  langEn: "English",

  // Navigation
  nationwide: "Kingdom Overview",
  selectedPort: "Selected Port",

  // Time filters
  filterLast7d: "This Week",
  filterLast30d: "This Month",

  // KPI Labels with clear descriptions
  totalRiskScore: "Risk Index",
  totalRiskScoreDesc: `0-20% Low | 20-50% Medium | 50%+ High

Calculation: Average port points ÷ 50 × 100
Example: 80 pts ÷ 4 ports = 20 ÷ 50 × 100 = 40%`,
  
  totalIncidents: "Recorded Violations",
  totalIncidentsDesc: "Total number of violations detected and recorded during the selected period. Includes all violation types and severity levels.",
  
  totalInspectorsImpacted: "Involved Inspectors",
  totalInspectorsImpactedDesc: "Number of inspectors with at least one recorded violation. If one inspector has multiple violations, they are counted only once.",
  
  totalPortsAffected: "Affected Ports",
  totalPortsAffectedDesc: "Number of border ports that witnessed violations during the selected period.",
  
  lastIncident: "Last Violation",
  incidentCount: "Violation Count",
  inspectorCount: "Inspector Count",
  uniqueInspectors: "Unique Inspectors",

  // Risk levels
  riskLevel: "Risk Level",
  riskHigh: "High Risk",
  riskMedium: "Medium Risk",
  riskLow: "Low Risk",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",

  // Violation types
  violence: "Physical Assault",
  camera_blocking: "Camera Blocking",
  camera_misuse: "Camera Tampering",
  camera_shake: "Camera Stability",
  smoking: "Smoking",
  shouting: "Raised Voice",
  abusive_language: "Verbal Abuse",

  // Violation filter labels
  allViolations: "All Violations",
  filterByViolation: "Filter by Violation Type",
  filterBySeverity: "Filter by Severity",

  // Inspector section
  inspectors: "Inspectors",
  topInspectors: "Top Violating Inspectors",
  inspectorDetails: "Inspector Details",
  inspectorId: "Inspector ID",
  inspectorRiskScore: "Inspector Risk Score",
  violationsBreakdown: "Violations by Type",
  severityBreakdown: "Violations by Severity",
  portsAffected: "Related Ports",
  inspectorsWithViolation: "Inspectors with Violations",

  // Port section
  portDetails: "Port Details",
  portName: "Port Name",
  portRiskScore: "Port Risk Score",
  selectPort: "Select a Port from Map",
  noPortSelected: "No Port Selected",
  selectPortInstruction: "Click on any point on the map to view port details",

  // Incidents
  recentIncidents: "Recent Violations",
  latestIncidents: "Latest 10 Violations",
  noIncidents: "No violations recorded",
  incidentTimeline: "Violation Timeline",

  // Map controls
  resetView: "Reset Map View",
  locateSaudiArabia: "Return to Kingdom View",
  zoomIn: "Zoom In",
  zoomOut: "Zoom Out",

  // Actions
  viewDetails: "View Details",
  close: "Close",
  back: "Back",

  // States
  loading: "Loading...",
  error: "Failed to load data",
  noData: "No data available",

  // Trend
  trend: "Trend",
  increasing: "Increasing",
  decreasing: "Decreasing",
  stable: "Stable",
};
