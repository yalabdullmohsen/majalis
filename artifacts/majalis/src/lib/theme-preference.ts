import {
  BRAND_THEME_COLOR,
  BRAND_THEME_COLOR_DARK,
} from "@/lib/site-config";

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

/** يطابق site.config.json → BRAND_THEME_COLOR* — مصدر واحد لشريط المتصفح. */
const THEME_COLOR_LIGHT = BRAND_THEME_COLOR;
const THEME_COLOR_DARK = BRAND_THEME_COLOR_DARK;

function syncThemeColorMeta(resolved: "light" | "dark") {
  const content = resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute("content", content);
  }
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
  syncThemeColorMeta(resolved);
}

export function writeThemePreference(preference: ThemePreference) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  }
  applyThemePreference(preference);
}
