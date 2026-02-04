"use client";

import { ar, type I18nKeys } from "./ar";
import { en } from "./en";

export type Lang = "ar" | "en";

const dictionaries: Record<Lang, Record<I18nKeys, string>> = {
  ar: { ...ar },
  en,
};

let currentLang: Lang = "ar";

export function setLanguage(lang: Lang): void {
  currentLang = lang;
}

export function getLanguage(): Lang {
  return currentLang;
}

export function t(key: I18nKeys): string {
  return dictionaries[currentLang][key] ?? key;
}

export { ar, en };
export type { I18nKeys };
