import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { University } from "@/lib/universities-service";
import { MAX_COMPARE } from "@/lib/universities-service";

interface CompareContextValue {
  compareList: University[];
  addToCompare:    (u: University) => boolean;
  removeFromCompare:(slug: string) => void;
  clearCompare:    () => void;
  isInCompare:     (slug: string) => boolean;
  canAdd:          boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<University[]>([]);

  const addToCompare = useCallback((u: University): boolean => {
    setCompareList((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some((x) => x.slug === u.slug)) return prev;
      return [...prev, u];
    });
    return true;
  }, []);

  const removeFromCompare = useCallback((slug: string) => {
    setCompareList((prev) => prev.filter((x) => x.slug !== slug));
  }, []);

  const clearCompare = useCallback(() => setCompareList([]), []);

  const isInCompare = useCallback(
    (slug: string) => compareList.some((x) => x.slug === slug),
    [compareList],
  );

  return (
    <CompareContext.Provider value={{
      compareList, addToCompare, removeFromCompare, clearCompare,
      isInCompare, canAdd: compareList.length < MAX_COMPARE,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be inside CompareProvider");
  return ctx;
}
