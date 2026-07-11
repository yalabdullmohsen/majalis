export type ThemePreference = "light" | "dark" | "auto";

export const THEME_STORAGE_KEY = "majalis-theme";

export const THEME_OPTIONS: {
  id: ThemePreference;
  label: string;
  description: string;
}[] = [
  { id: "light", label: "نهاري",   description: "خلفية فاتحة مناسبة للقراءة اليومية" },
  { id: "dark",  label: "ليلي",    description: "خلفية داكنة للقراءة الليلية وتوفير البطارية" },
  { id: "auto",  label: "تلقائي", description: "يتبع إعداد الجهاز تلقائياً" },
];

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === "light" || value === "dark" || value === "auto";
}

export function readThemePreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "light";
}

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "dark") return "dark";
  if (preference === "auto" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }
}

export function writeThemePreference(preference: ThemePreference) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  }
  applyThemePreference(preference);
}
