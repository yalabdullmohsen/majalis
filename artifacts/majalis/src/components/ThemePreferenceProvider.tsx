import { createContext, useContext, useMemo, type ReactNode } from "react";
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
  applyThemePreference("light");

  const value = useMemo<ThemePreferenceContextValue>(() => ({
    preference: readThemePreference(),
    resolvedTheme: resolveTheme("light"),
    setPreference: (next) => {
      writeThemePreference(next);
    },
  }), []);

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
