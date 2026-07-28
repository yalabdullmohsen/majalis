import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { isBrowserClient } from "@/utils/defer-storage";

/**
 * بديل مباشر لـ useState يحفظ القيمة في sessionStorage.
 * يقرأ التخزين بعد التركيب فقط لتفادي اختلاف الترطيب SSR/prerender.
 */
export function usePersistedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isBrowserClient()) return;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw !== null) setState(JSON.parse(raw) as T);
    } catch {
      /* sessionStorage غير متاح أو JSON تالف */
    }
    setHydrated(true);
  }, [key]);

  const setAndPersist: Dispatch<SetStateAction<T>> = (value) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      if (hydrated || isBrowserClient()) {
        try {
          sessionStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* تجاهل */
        }
      }
      return next;
    });
  };

  return [state, setAndPersist];
}
