import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  getStoredLocale,
  localeDir,
  setStoredLocale,
  translate,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  const setLocale = (next: Locale) => {
    setStoredLocale(next);
    setLocaleState(next);
  };

  useEffect(() => {
    const dir = localeDir(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t: (key) => translate(locale, key),
        dir: localeDir(locale),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE as Locale,
      setLocale: () => undefined,
      t: (key: TranslationKey) => translate(DEFAULT_LOCALE, key),
      dir: "rtl" as const,
    };
  }
  return ctx;
}
