import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  applyPreferences,
  readPreferences,
  writePreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

type UserPreferencesContextValue = {
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => readPreferences());

  useEffect(() => {
    applyPreferences(preferences);
  }, [preferences]);

  const updatePreferences = (patch: Partial<UserPreferences>) => {
    writePreferences(patch);
    setPreferences(readPreferences());
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error("useUserPreferences must be used within UserPreferencesProvider");
  return ctx;
}
