import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Lang, readLang, writeLang, langDir } from "@/lib/language-preference";
import { ar } from "@/locales/ar";
import { en } from "@/locales/en";
import { fr } from "@/locales/fr";
import { tr } from "@/locales/tr";
import { ur } from "@/locales/ur";
import { id } from "@/locales/id";
import type { TranslationKey } from "@/locales/ar";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
};

const DICTS: Record<Lang, Record<TranslationKey, string>> = { ar, en, fr, tr, ur, id };

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

  const dir = langDir(lang);
  const dict = DICTS[lang] ?? ar;
  const t = (key: TranslationKey): string => dict[key] ?? ar[key];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir  = dir;
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
