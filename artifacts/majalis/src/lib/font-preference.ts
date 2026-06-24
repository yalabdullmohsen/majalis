export type FontPreference = "default" | "ruqaa" | "naskh";

export const FONT_STORAGE_KEY = "majalis-font-preference";

export const FONT_OPTIONS: {
  id: FontPreference;
  label: string;
  description: string;
}[] = [
  { id: "default", label: "افتراضي", description: "خط واضح للواجهة" },
  { id: "ruqaa", label: "رقعة", description: "خط رقعة بسيط للعرض" },
  { id: "naskh", label: "نسخ", description: "خط نسخ للقراءة الطويلة" },
];

export function isFontPreference(value: string | null | undefined): value is FontPreference {
  return value === "default" || value === "ruqaa" || value === "naskh";
}

export function readFontPreference(): FontPreference {
  if (typeof window === "undefined") return "default";
  const stored = window.localStorage.getItem(FONT_STORAGE_KEY);
  return isFontPreference(stored) ? stored : "default";
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
