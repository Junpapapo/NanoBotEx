import React, { createContext, useContext, useState, useEffect } from "react";
import { UserSettings } from "../../chatbot-types";

// Static json imports (CORS 및 비동기 로딩 이슈 배제)
import enDict from "../../locales/en.json";
import koDict from "../../locales/ko.json";
import jaDict from "../../locales/ja.json";
import languages from "../../locales/languages.json";

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, defaultValue?: string) => string;
  languages: Record<string, string>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const DICTIONARIES: Record<string, any> = {
  en: enDict,
  ko: koDict,
  ja: jaDict
};

export function I18nProvider({
  children,
  settings,
  updateSettings,
  isSettingsLoaded
}: {
  children: React.ReactNode;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  isSettingsLoaded?: boolean;
}) {
  const [locale, setLocaleState] = useState<string>("ko");

  useEffect(() => {
    if (isSettingsLoaded === false) return;
    if (!settings) return;

    const savedLocale = settings.nano_locale;
    if (savedLocale && savedLocale.trim() !== "") {
      setLocaleState(savedLocale);
    } else {
      const browserLang = navigator.language || (navigator as any).userLanguage || "ko";
      const lang = browserLang.toLowerCase();
      const detectedLocale = lang.startsWith("ko") ? "ko" : lang.startsWith("ja") ? "ja" : "en";
      setLocaleState(detectedLocale);
      updateSettings({ nano_locale: detectedLocale });
    }
  }, [settings?.nano_locale, isSettingsLoaded]);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    updateSettings({ nano_locale: newLocale });
  };

  const resolveKey = (obj: any, path: string): string | undefined => {
    if (!obj) return undefined;
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return typeof current === "string" ? current : undefined;
  };

  const t = (key: string, defaultValue?: string): string => {
    const currentDict = DICTIONARIES[locale] || DICTIONARIES.ko;
    let val = resolveKey(currentDict, key);
    if (val !== undefined) return val;

    val = resolveKey(koDict, key);
    if (val !== undefined) return val;

    return defaultValue !== undefined ? defaultValue : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
