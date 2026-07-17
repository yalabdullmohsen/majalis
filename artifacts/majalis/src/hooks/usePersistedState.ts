import { useState, type Dispatch, type SetStateAction } from "react";

/**
 * بديل مباشر لـ useState يحفظ القيمة في sessionStorage فيبقى محفوظًا عند
 * إعادة تركيب الصفحة (مثلاً بعد الرجوع إليها عبر GlobalBackButton/زر رجوع
 * المتصفح، حيث يُزيل wouter مكوّن المسار تمامًا) — بلا تغيير في شكل
 * الاستدعاء الأصلي، فيبقى نفس توقيع useState.
 */
export function usePersistedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch { /* sessionStorage غير متاح أو JSON تالف — استخدم القيمة الأولية */ }
    return initial;
  });

  const setAndPersist: Dispatch<SetStateAction<T>> = (value) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* تجاهل */ }
      return next;
    });
  };

  return [state, setAndPersist];
}
