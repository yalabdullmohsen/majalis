export type FontPreference = "default" | "naskh";

export const FONT_STORAGE_KEY = "majalis-font-preference-v2";

/* ملاحظة: الخط الموحَّد للمنصة أصبح Times New Roman (2026-07-13) لكلا
   الخيارين — أُبقي عليهما لتفادي كسر الإعداد المحفوظ للمستخدمين الحاليين،
   لكنهما لم يعودا ينتجان فرقًا بصريًا فعليًا. */
export const FONT_OPTIONS: {
  id: FontPreference;
  label: string;
  description: string;
}[] = [
  { id: "naskh", label: "Times New Roman", description: "خط المنصة الموحَّد (افتراضي)" },
  { id: "default", label: "Times New Roman", description: "خط المنصة الموحَّد" },
];

export function isFontPreference(value: string | null | undefined): value is FontPreference {
  return value === "default" || value === "naskh";
}

export function readFontPreference(): FontPreference {
  if (typeof window === "undefined") return "naskh";
  const stored = window.localStorage.getItem(FONT_STORAGE_KEY);
  return isFontPreference(stored) ? stored : "naskh";
}

export function writeFontPreference(preference: FontPreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FONT_STORAGE_KEY, preference);
  document.documentElement.dataset.font = preference;
}

export function applyFontPreference(preference: FontPreference) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.font = preference;
}
