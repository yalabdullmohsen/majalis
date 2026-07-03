export type Locale = "ar" | "en" | "fr" | "es" | "tr" | "ur" | "id";

export const LOCALES: { code: Locale; label: string; dir: "rtl" | "ltr" }[] = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "tr", label: "Türkçe", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
  { code: "id", label: "Indonesia", dir: "ltr" },
];

export const DEFAULT_LOCALE: Locale = "ar";

export type TranslationKey =
  | "nav.home"
  | "nav.lessons"
  | "nav.fiqh"
  | "nav.fatwa"
  | "nav.rulings"
  | "nav.courses"
  | "nav.updates"
  | "nav.search"
  | "search.placeholder"
  | "common.loading"
  | "common.empty";

type Messages = Record<TranslationKey, string>;

const ar: Messages = {
  "nav.home": "الرئيسية",
  "nav.lessons": "الدروس",
  "nav.fiqh": "المجمع الفقهي",
  "nav.fatwa": "الفتاوى",
  "nav.rulings": "الأحكام الشرعية",
  "nav.courses": "الدورات العلمية",
  "nav.updates": "آخر المستجدات",
  "nav.search": "البحث",
  "search.placeholder": "ابحث في التطبيق...",
  "common.loading": "جارٍ التحميل...",
  "common.empty": "لا توجد نتائج.",
};

const en: Messages = {
  "nav.home": "Home",
  "nav.lessons": "Lessons",
  "nav.fiqh": "Fiqh Council",
  "nav.fatwa": "Fatwas",
  "nav.rulings": "Sharia Rulings",
  "nav.courses": "Courses",
  "nav.updates": "Latest Updates",
  "nav.search": "Search",
  "search.placeholder": "Search the platform...",
  "common.loading": "Loading...",
  "common.empty": "No results found.",
};

const fr: Messages = { ...en, "nav.fiqh": "Conseil de Fiqh", "nav.fatwa": "Fatwas", "nav.rulings": "Jurisprudence" };
const es: Messages = { ...en, "nav.fiqh": "Consejo de Fiqh", "nav.fatwa": "Fatwas", "nav.rulings": "Jurisprudencia" };
const tr: Messages = { ...en, "nav.fiqh": "Fıkıh Konseyi", "nav.fatwa": "Fetvalar", "nav.rulings": "Fıkıh Hükümleri" };
const ur: Messages = { ...ar };
const id: Messages = { ...en, "nav.fiqh": "Dewan Fiqh", "nav.fatwa": "Fatwa", "nav.rulings": "Hukum Syariah" };

export const messages: Record<Locale, Messages> = { ar, en, fr, es, tr, ur, id };

const STORAGE_KEY = "majalis-locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  return stored && messages[stored] ? stored : DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
}

export function translate(locale: Locale, key: TranslationKey): string {
  return messages[locale]?.[key] || messages[DEFAULT_LOCALE][key] || key;
}

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return LOCALES.find((l) => l.code === locale)?.dir || "rtl";
}
