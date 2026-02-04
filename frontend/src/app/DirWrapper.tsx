"use client";

import { useI18n } from "@/lib/i18n/context";

export function DirWrapper({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <div dir={dir} className="min-h-screen" lang={lang}>
      {children}
    </div>
  );
}
