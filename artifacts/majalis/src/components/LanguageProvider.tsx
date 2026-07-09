import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Lang, readLang, writeLang } from "@/lib/language-preference";
import { ar } from "@/locales/ar";
import { en } from "@/locales/en";
import type { TranslationKey } from "@/locales/ar";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  setLang: () => {},
  t: (key) => ar[key],
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  const setLang = (next: Lang) => {
    writeLang(next);
    setLangState(next);
  };

  const dict = lang === "en" ? en : ar;
  const t = (key: TranslationKey): string => dict[key];
  const dir: "rtl" | "ltr" = lang === "en" ? "ltr" : "rtl";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
