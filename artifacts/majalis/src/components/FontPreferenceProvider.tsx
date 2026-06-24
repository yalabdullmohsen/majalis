import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  applyFontPreference,
  readFontPreference,
  writeFontPreference,
  type FontPreference,
} from "@/lib/font-preference";

type FontPreferenceContextValue = {
  preference: FontPreference;
  setPreference: (preference: FontPreference) => void;
};

const FontPreferenceContext = createContext<FontPreferenceContextValue | null>(null);

export function FontPreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<FontPreference>(() => readFontPreference());

  useEffect(() => {
    applyFontPreference(preference);
  }, [preference]);

  const setPreference = (next: FontPreference) => {
    setPreferenceState(next);
    writeFontPreference(next);
  };

  return (
    <FontPreferenceContext.Provider value={{ preference, setPreference }}>
      {children}
    </FontPreferenceContext.Provider>
  );
}

export function useFontPreference() {
  const context = useContext(FontPreferenceContext);
  if (!context) {
    throw new Error("useFontPreference must be used within FontPreferenceProvider");
  }
  return context;
}
