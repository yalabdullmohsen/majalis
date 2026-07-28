import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * بديل مباشر لـ useState يحفظ القيمة في sessionStorage.
 * Hydration-safe: starts from `initial`, then reads sessionStorage after mount
 * to avoid FOUC / prerender mismatch.
 */
export function usePersistedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw !== null) setState(JSON.parse(raw) as T);
    } catch {
      /* sessionStorage غير متاح أو JSON تالف — استخدم القيمة الأولية */
    }
    setReady(true);
  }, [key]);

  const setAndPersist: Dispatch<SetStateAction<T>> = (value) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      if (ready) {
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
