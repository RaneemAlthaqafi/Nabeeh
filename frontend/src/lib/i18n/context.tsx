"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import type { Lang } from "./index";
import { getLanguage, setLanguage, t, type I18nKeys } from "./index";

type LangContextValue = { lang: Lang; setLang: (l: Lang) => void; t: (key: I18nKeys) => string };

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLanguage());

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setLanguage(l);
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useI18n(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useI18n must be used within LangProvider");
  return ctx;
}
