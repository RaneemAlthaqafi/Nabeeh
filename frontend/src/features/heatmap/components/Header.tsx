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
        {/* Left section: Logos and title */}
        <div className="nabeeh-header-brand">
          {!zatcaLogoError && (
            <a href="/" className="nabeeh-header-logo">
              <img
                src={LOGOS.zatca}
                alt="ZATCA"
                onError={() => setZatcaLogoError(true)}
                draggable={false}
              />
            </a>
          )}
          
          {!zatcaLogoError && !nabeehLogoError && (
            <div className="nabeeh-header-divider" aria-hidden="true" />
          )}
          
          {!nabeehLogoError && (
            <a href="/" className="nabeeh-header-logo nabeeh-header-logo-nabeeh">
              <img
                src={LOGOS.nabeeh}
                alt="Nabeeh"
                onError={() => setNabeehLogoError(true)}
                draggable={false}
              />
            </a>
          )}
          
          <h1 className="nabeeh-header-title">{t("appTitle")}</h1>
        </div>

        {/* Right section: Language toggle - Apple segmented control */}
        <nav className="nabeeh-header-nav" aria-label="Language">
          <div className="nabeeh-lang-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={lang === "ar"}
              onClick={() => setLang("ar")}
              className={`nabeeh-lang-btn ${lang === "ar" ? "nabeeh-lang-btn-active" : ""}`}
            >
              العربية
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={lang === "en"}
              onClick={() => setLang("en")}
              className={`nabeeh-lang-btn ${lang === "en" ? "nabeeh-lang-btn-active" : ""}`}
            >
              English
            </button>
            {/* Sliding background indicator */}
            <div 
              className="nabeeh-lang-indicator"
              style={{
                transform: lang === "en" ? "translateX(100%)" : "translateX(0)",
              }}
              aria-hidden="true"
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
