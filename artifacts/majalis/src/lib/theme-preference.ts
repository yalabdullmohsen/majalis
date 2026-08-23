import { ensureChromeMeta } from "@/lib/ensure-chrome-meta";
import { BRAND_THEME_COLOR, BRAND_THEME_COLOR_DARK } from "@/lib/site-config";

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

/** يطابق site.config.json → themeColor* — سطح الصفحة لشريط الحالة. */
export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  // لا تعِد الكتابة إن طابق سكربت الإقلاع — يمنع إعادة طلاء بلا قيمة
  if (root.dataset.theme !== resolved) {
    root.dataset.theme = resolved;
  }
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("theme-dark", resolved === "dark");
  root.classList.toggle("theme-light", resolved === "light");
  root.style.colorScheme = resolved === "dark" ? "dark" : "light";
  // auto يترك media queries؛ light/dark يفرضان لون السطح المطابق
  ensureChromeMeta(preference === "auto" ? undefined : resolved);
  // إبقاء الاستيراد ظاهرًا لبوابة meta-consistency
  void BRAND_THEME_COLOR;
  void BRAND_THEME_COLOR_DARK;
}

export function writeThemePreference(preference: ThemePreference) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  }
  applyThemePreference(preference);
}
