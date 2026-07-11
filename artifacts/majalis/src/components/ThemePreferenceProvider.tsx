import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  toggleDark: () => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => resolveTheme(readThemePreference()));

  // Apply on mount and whenever preference changes
  useEffect(() => {
    applyThemePreference(preference);
    setResolvedTheme(resolveTheme(preference));
  }, [preference]);

  // Listen for system theme changes in "auto" mode
  useEffect(() => {
    if (preference !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyThemePreference("auto");
      setResolvedTheme(resolveTheme("auto"));
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    writeThemePreference(next);
    setPreferenceState(next);
    setResolvedTheme(resolveTheme(next));
  }, []);

  const toggleDark = useCallback(() => {
    setPreference(resolveTheme(preference) === "dark" ? "light" : "dark");
  }, [preference, setPreference]);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({ preference, resolvedTheme, setPreference, toggleDark }),
    [preference, resolvedTheme, setPreference, toggleDark],
  );

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
