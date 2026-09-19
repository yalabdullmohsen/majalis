import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Lang, readLang, writeLang, langDir } from "@/lib/language-preference";
import { ar } from "@/locales/ar";
import { en } from "@/locales/en";
import type { TranslationKey } from "@/locales/ar";

type Dict = Record<TranslationKey, string>;

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
};

/** العربية والإنجليزية في entry؛ بقية القواميس كسولًا لتفريغ ميزانية الإقلاع. */
const ENTRY_DICTS: Partial<Record<Lang, Dict>> = {
  ar,
  en,
  es: en,
  de: en,
  ru: en,
  zh: en,
  hi: en,
  bn: en,
  tl: en,
  fa: en,
  sw: en,
  pt: en,
};

const LAZY_LOADERS: Partial<Record<Lang, () => Promise<Dict>>> = {
  fr: () => import("@/locales/fr").then((m) => m.fr),
  tr: () => import("@/locales/tr").then((m) => m.tr),
  ur: () => import("@/locales/ur").then((m) => m.ur),
  id: () => import("@/locales/id").then((m) => m.id),
};

const dictCache: Partial<Record<Lang, Dict>> = { ...ENTRY_DICTS };

function syncDict(lang: Lang): Dict {
  return dictCache[lang] ?? en;
}

async function ensureDict(lang: Lang): Promise<Dict> {
  const hit = dictCache[lang];
  if (hit) return hit;
  const loader = LAZY_LOADERS[lang];
  if (!loader) {
    dictCache[lang] = en;
    return en;
  }
  const dict = await loader();
  dictCache[lang] = dict;
  return dict;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  setLang: () => {},
  t: (key) => ar[key],
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const [dict, setDict] = useState<Dict>(() => syncDict(readLang()));

  const setLang = (next: Lang) => {
    writeLang(next);
    setLangState(next);
  };

  useEffect(() => {
    let cancelled = false;
    setDict(syncDict(lang));
    void ensureDict(lang).then((loaded) => {
      if (!cancelled) setDict(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const dir = langDir(lang);
  const t = (key: TranslationKey): string => dict[key] ?? ar[key];

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
