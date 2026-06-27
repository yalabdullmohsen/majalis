import { useCallback, useEffect, useState } from "react";

export type QuranFontId = "uthmani" | "naskh" | "amiri";

export type QuranPreferences = {
  fontScale: number;
  fontId: QuranFontId;
  showAyahNumbers: boolean;
  showWaqf: boolean;
  readingMode: boolean;
  hideTashkeel: boolean;
  nightMode: boolean;
};

const STORAGE_KEY = "majalis-quran-prefs-v2";

const DEFAULTS: QuranPreferences = {
  fontScale: 26,
  fontId: "uthmani",
  showAyahNumbers: true,
  showWaqf: false,
  readingMode: false,
  hideTashkeel: false,
  nightMode: false,
};

function loadPrefs(): QuranPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useQuranPreferences() {
  const [prefs, setPrefsState] = useState<QuranPreferences>(loadPrefs);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const setPref = useCallback(<K extends keyof QuranPreferences>(key: K, value: QuranPreferences[K]) => {
    setPrefsState((p) => ({ ...p, [key]: value }));
  }, []);

  const bumpFont = useCallback((delta: number) => {
    setPrefsState((p) => ({
      ...p,
      fontScale: Math.min(40, Math.max(18, p.fontScale + delta)),
    }));
  }, []);

  return { prefs, setPref, bumpFont };
}
