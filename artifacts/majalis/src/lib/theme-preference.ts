export type ThemePreference = "light";

export const THEME_STORAGE_KEY = "majalis-theme-preference";

export const THEME_OPTIONS: {
  id: ThemePreference;
  label: string;
  description: string;
}[] = [
  { id: "light", label: "نهاري", description: "خلفية فاتحة مناسبة للقراءة اليومية" },
];

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === "light";
}

export function readThemePreference(): ThemePreference {
  return "light";
}

export function resolveTheme(_preference: ThemePreference): "light" | "dark" {
  return "light";
}

export function applyThemePreference(_preference: ThemePreference) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = "light";
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "light";
}

export function writeThemePreference(_preference: ThemePreference) {
  applyThemePreference("light");
}
