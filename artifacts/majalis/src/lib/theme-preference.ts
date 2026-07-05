export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "majalis-theme-preference";

export const THEME_OPTIONS: {
  id: ThemePreference;
  label: string;
  description: string;
}[] = [
  { id: "light", label: "نهاري", description: "خلفية فاتحة مناسبة للقراءة اليومية" },
  { id: "dark", label: "ليلي", description: "ألوان داكنة عالية التباين" },
  { id: "system", label: "النظام", description: "اتّباع إعدادات الجهاز تلقائياً" },
];

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

const DESIGN_VERSION     = "v3-emerald-2025";
const DESIGN_VERSION_KEY = "majalis-design-v";

export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "light";
  if (window.localStorage.getItem(DESIGN_VERSION_KEY) !== DESIGN_VERSION) {
    window.localStorage.setItem(DESIGN_VERSION_KEY, DESIGN_VERSION);
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    return "light";
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "light";
}

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export function writeThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyThemePreference(preference);
}
