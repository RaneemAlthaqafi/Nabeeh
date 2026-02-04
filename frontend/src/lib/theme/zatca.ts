/**
 * ZATCA brand identity — official palette and risk mapping.
 * Extend Tailwind using only these values.
 */
export const colors = {
  zatca: {
    green: "#62B34F",
    teal: "#4FBBBD",
    blue293: "#2053A4",
    navy: "#1D3761",
    lightBlue: "#0996D4",
    darkGray: "#575756",
    lime: "#AEC90B",
    warmRed: "#E84A41",
    coolGray: "#BCBCBB",
    purple: "#50368B",
    orange: "#FABB33",
    deepTeal: "#007C8A",
    blue: "#006DA2",
  },
};

/** Risk level → Tailwind/ZATCA color. LOW: Teal or Dark Gray; MEDIUM: Orange; HIGH: Warm Red */
export const riskColors = {
  LOW: "#4FBBBD",
  MEDIUM: "#FABB33",
  HIGH: "#E84A41",
} as const;

export const typographyScale = {
  title: "font-somar font-bold",
  section: "font-somar font-medium",
  body: "font-somar font-normal",
} as const;

/** For Tailwind theme.extend.colors */
export const zatcaTheme = {
  colors: {
    zatca: colors.zatca,
    risk: riskColors,
  },
  riskColors,
  typographyScale,
};
