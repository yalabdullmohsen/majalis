import { useCallback, useEffect, useState } from "react";

export type QuranFontId = "uthmani" | "naskh" | "amiri";

export type QuranPreferences = {
  fontScale: number;
  fontId: QuranFontId;
  showAyahNumbers: boolean;
  nightMode: boolean;
};

const KEY = "mj-quran-prefs-v3";

const DEFAULTS: QuranPreferences = {
  fontScale: 26,
  fontId: "uthmani",
  showAyahNumbers: true,
  nightMode: false,
};

function load(): QuranPreferences {
  try {
    const raw = localStorage.getItem(KEY);
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
