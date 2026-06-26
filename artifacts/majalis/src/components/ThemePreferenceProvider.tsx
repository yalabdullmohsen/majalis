import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyThemePreference,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from "@/lib/theme-preference";

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedTheme: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => resolveTheme(preference));

  useEffect(() => {
    applyThemePreference(preference);
    setResolvedTheme(resolveTheme(preference));

    if (preference !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;

    const onChange = () => {
      applyThemePreference("system");
      setResolvedTheme(resolveTheme("system"));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const value = useMemo<ThemePreferenceContextValue>(() => ({
    preference,
    resolvedTheme,
    setPreference: (next) => {
      setPreferenceState(next);
      writeThemePreference(next);
      setResolvedTheme(resolveTheme(next));
    },
  }), [preference, resolvedTheme]);

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error("useThemePreference must be used within ThemePreferenceProvider");
  }
  return context;
}
