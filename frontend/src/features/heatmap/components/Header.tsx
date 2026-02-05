"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

const LOGOS = {
  zatca: "/logos/zatca-logo.png",
  nabeeh: "/logos/nabeeh-logo.png",
};

export function Header() {
  const { t, lang, setLang } = useI18n();
  const [zatcaLogoError, setZatcaLogoError] = useState(false);
  const [nabeehLogoError, setNabeehLogoError] = useState(false);

  return (
    <header className="nabeeh-header">
      <div className="nabeeh-header-inner">
        {/* Left: Logos and title */}
        <div className="nabeeh-header-brand">
          {!zatcaLogoError && (
            <div className="nabeeh-header-logo">
              <img
                src={LOGOS.zatca}
                alt="ZATCA"
                onError={() => setZatcaLogoError(true)}
                draggable={false}
              />
            </div>
          )}
          
          {!zatcaLogoError && !nabeehLogoError && (
            <div className="nabeeh-header-divider" />
          )}
          
          {!nabeehLogoError && (
            <div className="nabeeh-header-logo">
              <img
                src={LOGOS.nabeeh}
                alt="Nabeeh"
                onError={() => setNabeehLogoError(true)}
                draggable={false}
              />
            </div>
          )}
          
          <h1 className="nabeeh-header-title">{t("appTitle")}</h1>
        </div>

        {/* Right: Language toggle */}
        <nav className="nabeeh-header-nav">
          <div className="nabeeh-lang-toggle">
            <button
              type="button"
              onClick={() => setLang("ar")}
              className={`nabeeh-lang-btn ${lang === "ar" ? "nabeeh-lang-btn-active" : ""}`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`nabeeh-lang-btn ${lang === "en" ? "nabeeh-lang-btn-active" : ""}`}
            >
              English
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
