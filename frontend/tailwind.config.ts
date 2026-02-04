import type { Config } from "tailwindcss";
import { zatcaTheme } from "./src/lib/theme/zatca";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        somar: ["var(--font-somar)", "sans-serif"],
      },
      colors: {
        zatca: zatcaTheme.colors.zatca,
        risk: zatcaTheme.colors.risk,
      },
    },
  },
  plugins: [],
};

export default config;
