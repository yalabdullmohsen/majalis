/**
 * MushafAppearanceProvider — مصدر حقيقة واحد لسمة Accent (EMERALD | GOLD).
 * يزامن: React context · localStorage · data-mushaf-accent على .nm-root/html.
 * لا يمس النص القرآني ولا Page Mapping.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyMushafAccentTheme,
  loadMushafAccentTheme,
  saveMushafAccentTheme,
} from "./accent-prefs";
import {
  mushafAppearanceThemeLabel,
  themeToAccentAttr,
  type MushafAccentAttr,
  type MushafAppearanceTheme,
} from "./mushaf-appearance-theme";
import { QURAN_EXPERIENCE_NEXT } from "./flags";

export type MushafAppearanceContextValue = {
  theme: MushafAppearanceTheme;
  accentAttr: MushafAccentAttr;
  label: string;
  setTheme: (theme: MushafAppearanceTheme) => void;
};

const MushafAppearanceContext = createContext<MushafAppearanceContextValue | null>(null);

export function MushafAppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<MushafAppearanceTheme>(() =>
    QURAN_EXPERIENCE_NEXT.dualAppearanceThemes ? loadMushafAccentTheme() : "EMERALD",
  );

  useEffect(() => {
    if (!QURAN_EXPERIENCE_NEXT.dualAppearanceThemes) return;
    applyMushafAccentTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: MushafAppearanceTheme) => {
    if (!QURAN_EXPERIENCE_NEXT.dualAppearanceThemes) return;
    setThemeState(next);
    saveMushafAccentTheme(next);
  }, []);

  const value = useMemo<MushafAppearanceContextValue>(
    () => ({
      theme,
      accentAttr: themeToAccentAttr(theme),
      label: mushafAppearanceThemeLabel(theme),
      setTheme,
    }),
    [theme, setTheme],
  );

  return (
    <MushafAppearanceContext.Provider value={value}>{children}</MushafAppearanceContext.Provider>
  );
}

export function useMushafAppearance(): MushafAppearanceContextValue {
  const ctx = useContext(MushafAppearanceContext);
  if (!ctx) {
    throw new Error("useMushafAppearance must be used within <MushafAppearanceProvider>");
  }
  return ctx;
}

/** للاستهلاك الاختياري خارج الغلاف (اختبارات / طبقات مشتركة). */
export function useMushafAppearanceOptional(): MushafAppearanceContextValue | null {
  return useContext(MushafAppearanceContext);
}
