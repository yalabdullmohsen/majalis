import { useCallback, useEffect, useState } from "react";

export type QuranFontId = "uthmani" | "naskh" | "amiri";

/** وضع القراءة — "عادي" أبيض عاجي، "ليلي"/"دافئ" مبنيان مسبقًا في quran.css (.quran-shell--night/--warm)، "عالي التباين" جديد. */
export type QuranReadingTheme = "standard" | "night" | "warm" | "high-contrast";

/** لون إطار صفحة المصحف — يُطبَّق كمتغيرات CSS على .qs-mushaf-frame، لا كتصميم منفصل مكرَّر. */
export type QuranFrameStyle = "emerald" | "gold-classic" | "paper" | "minimal" | "none";

/** نمط تمييز الآية المختارة في وضع الصفحة. */
export type QuranHighlightStyle = "wash" | "border" | "underline" | "text-color" | "spotlight" | "side-indicator";

export type QuranPreferences = {
  fontScale: number;
  fontId: QuranFontId;
  showAyahNumbers: boolean;
  nightMode: boolean;
  readingTheme: QuranReadingTheme;
  frameStyle: QuranFrameStyle;
  highlightStyle: QuranHighlightStyle;
};

const KEY = "mj-quran-prefs-v4";
const LEGACY_KEY = "mj-quran-prefs-v3";

const DEFAULTS: QuranPreferences = {
  fontScale: 26,
  fontId: "uthmani",
  showAyahNumbers: true,
  nightMode: false,
  readingTheme: "standard",
  frameStyle: "emerald",
  highlightStyle: "wash",
};

function load(): QuranPreferences {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useQuranPreferences() {
  const [prefs, setPrefsState] = useState<QuranPreferences>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  const setPref = useCallback(<K extends keyof QuranPreferences>(key: K, value: QuranPreferences[K]) => {
    setPrefsState((p) => ({ ...p, [key]: value }));
  }, []);

  const bumpFont = useCallback((delta: number) => {
    setPrefsState((p) => ({ ...p, fontScale: Math.min(42, Math.max(18, p.fontScale + delta)) }));
  }, []);

  return { prefs, setPref, bumpFont };
}
