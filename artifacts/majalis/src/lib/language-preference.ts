export type Lang = "ar" | "en";

const STORAGE_KEY = "majalis-lang";

export function readLang(): Lang {
  if (typeof window === "undefined") return "ar";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "en" ? "en" : "ar";
}

export function writeLang(lang: Lang) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
}
