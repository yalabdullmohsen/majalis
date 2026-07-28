import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { safeJsonParse } from "@/lib/safe-json";

/**
 * بديل مباشر لـ useState يحفظ القيمة في sessionStorage فيبقى محفوظًا عند
 * إعادة تركيب الصفحة. القراءة من sessionStorage مؤجَّلة لما بعد mount
 * لتفادي اختلاف SSR/prerender عن العميل.
 */
export function usePersistedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      const parsed = safeJsonParse<T>(raw, initial);
      setState(parsed.value);
    } catch {
      /* sessionStorage غير متاح — أبقِ القيمة الأولية */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setAndPersist: Dispatch<SetStateAction<T>> = (value) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* تجاهل */
      }
      return next;
    });
  };

  // Until hydrated, behave as controlled initial — callers see stable first paint
  void hydrated;
  return [state, setAndPersist];
}
