import type { Metadata } from "next";
import { Providers } from "@/app/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nabeeh — Ports Risk Heatmap",
  description: "Risk Awareness & Decision Support for ZATCA border ports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
