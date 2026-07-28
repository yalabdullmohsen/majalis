/**
 * Web port of RN QuranContext / QuranProvider:
 *
 * ```tsx
 * export const QuranContext = createContext();
 * export const QuranProvider = ({ children }) => {
 *   const [fontSize, setFontSize] = useState(20);
 *   const [isDarkMode, setIsDarkMode] = useState(false);
 *   const [selectedReciter, setSelectedReciter] = useState('mishary');
 *   const [showTranslation, setShowTranslation] = useState(false);
 *   return (
 *     <QuranContext.Provider value={{ fontSize, setFontSize, isDarkMode, setIsDarkMode,
 *       selectedReciter, setSelectedReciter, showTranslation, setShowTranslation }}>
 *       {children}
 *     </QuranContext.Provider>
 *   );
 * };
 * ```
 *
 * Bridges existing localStorage + Quran Engine reciter — no second source of truth.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useQuranEngineContextOptional } from "@/core/quran/QuranEngineContext";
import {
  QURAN_FONT_DEFAULT_PX,
  persistQuranFontSize,
  readStoredQuranFontSize,
} from "@/lib/quran-font-size";
import { getReciter, loadReciterId, saveReciterId } from "@/lib/quran-audio";
import {
  persistShowTranslation,
  readStoredShowTranslation,
} from "@/lib/quran-translation";

/** Same key as QuranViewer (`quranReaderDarkMode`). */
export const QURAN_THEME_STORAGE_KEY = "quranReaderDarkMode";

type ThemeOverride = "light" | "dark" | null;

function readStoredThemeOverride(): ThemeOverride {
  try {
    const raw = localStorage.getItem(QURAN_THEME_STORAGE_KEY);
    if (raw == null || raw === "auto") return null;
    if (raw === "1" || raw === "true") return "dark";
    if (raw === "0" || raw === "false") return "light";
    return null;
  } catch {
    return null;
  }
}

function persistThemeOverride(override: ThemeOverride): void {
  try {
    if (override == null) localStorage.setItem(QURAN_THEME_STORAGE_KEY, "auto");
    else localStorage.setItem(QURAN_THEME_STORAGE_KEY, override === "dark" ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function resolveReciterId(id: string): string {
  if (id === "mishary" || id === "afasy") return "alafasy";
  if (id === "muaiqly") return "maher";
  return getReciter(id).id;
}

export type QuranContextValue = {
  /** حجم الخط (افتراضي 20) — مفتاح `userFontSize`. */
  fontSize: number;
  setFontSize: Dispatch<SetStateAction<number>>;
  /** الوضع الليلي المحسوم (يدوي أو يتبع الجهاز). */
  isDarkMode: boolean;
  setIsDarkMode: Dispatch<SetStateAction<boolean>>;
  /** null = يتبع نظام الجهاز. */
  themeOverride: ThemeOverride;
  setThemeOverride: Dispatch<SetStateAction<ThemeOverride>>;
  followSystemTheme: () => void;
  /** القارئ المختار — `alafasy` ≈ RN `mishary`. */
  selectedReciter: string;
  setSelectedReciter: Dispatch<SetStateAction<string>>;
  showTranslation: boolean;
  setShowTranslation: Dispatch<SetStateAction<boolean>>;
};

export const QuranContext = createContext<QuranContextValue | null>(null);

export function QuranProvider({ children }: { children: ReactNode }) {
  const deviceTheme = useColorScheme();
  const engine = useQuranEngineContextOptional();

  const [fontSize, setFontSizeState] = useState(QURAN_FONT_DEFAULT_PX);
  const [themeOverride, setThemeOverrideState] = useState<ThemeOverride>(null);
  const [selectedReciter, setSelectedReciterState] = useState("alafasy");
  const [showTranslation, setShowTranslationState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFontSizeState(readStoredQuranFontSize());
    setThemeOverrideState(readStoredThemeOverride());
    setShowTranslationState(readStoredShowTranslation());
    setSelectedReciterState(resolveReciterId(loadReciterId()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !engine?.currentReciter) return;
    setSelectedReciterState(resolveReciterId(engine.currentReciter));
  }, [engine?.currentReciter, hydrated]);

  const isDarkMode =
    themeOverride != null ? themeOverride === "dark" : deviceTheme === "dark";

  const setFontSize = useCallback((value: SetStateAction<number>) => {
    setFontSizeState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      return persistQuranFontSize(next);
    });
  }, []);

  const setThemeOverride = useCallback((value: SetStateAction<ThemeOverride>) => {
    setThemeOverrideState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      persistThemeOverride(next);
      return next;
    });
  }, []);

  const setIsDarkMode = useCallback(
    (value: SetStateAction<boolean>) => {
      setThemeOverrideState((prevOverride) => {
        const currentDark =
          prevOverride != null ? prevOverride === "dark" : deviceTheme === "dark";
        const nextDark = typeof value === "function" ? value(currentDark) : value;
        const next: ThemeOverride = nextDark ? "dark" : "light";
        persistThemeOverride(next);
        return next;
      });
    },
    [deviceTheme],
  );

  const followSystemTheme = useCallback(() => {
    setThemeOverrideState(null);
    persistThemeOverride(null);
  }, []);

  const setSelectedReciter = useCallback(
    (value: SetStateAction<string>) => {
      setSelectedReciterState((prev) => {
        const raw = typeof value === "function" ? value(prev) : value;
        const resolved = resolveReciterId(raw);
        saveReciterId(resolved);
        engine?.setReciter(resolved);
        return resolved;
      });
    },
    [engine],
  );

  const setShowTranslation = useCallback((value: SetStateAction<boolean>) => {
    setShowTranslationState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      persistShowTranslation(next);
      return next;
    });
  }, []);

  const value = useMemo<QuranContextValue>(
    () => ({
      fontSize,
      setFontSize,
      isDarkMode,
      setIsDarkMode,
      themeOverride,
      setThemeOverride,
      followSystemTheme,
      selectedReciter,
      setSelectedReciter,
      showTranslation,
      setShowTranslation,
    }),
    [
      fontSize,
      setFontSize,
      isDarkMode,
      setIsDarkMode,
      themeOverride,
      setThemeOverride,
      followSystemTheme,
      selectedReciter,
      setSelectedReciter,
      showTranslation,
      setShowTranslation,
    ],
  );

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
}

export function useQuranContext(): QuranContextValue {
  const ctx = useContext(QuranContext);
  if (!ctx) {
    throw new Error("useQuranContext must be used within QuranProvider");
  }
  return ctx;
}

/** Optional — for components that also work outside the provider. */
export function useQuranContextOptional(): QuranContextValue | null {
  return useContext(QuranContext);
}

export default QuranProvider;
