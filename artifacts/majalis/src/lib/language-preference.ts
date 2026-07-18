export type Lang = "ar" | "en" | "fr" | "tr" | "ur" | "id";

export const LANG_META: { code: Lang; label: string; dir: "rtl" | "ltr"; nativeName: string }[] = [
  { code: "ar", label: "Arabic",     dir: "rtl", nativeName: "العربية"    },
  { code: "ur", label: "Urdu",       dir: "rtl", nativeName: "اردو"       },
  { code: "en", label: "English",    dir: "ltr", nativeName: "English"    },
  { code: "fr", label: "French",     dir: "ltr", nativeName: "Français"   },
  { code: "tr", label: "Turkish",    dir: "ltr", nativeName: "Türkçe"     },
  { code: "id", label: "Indonesian", dir: "ltr", nativeName: "Indonesia"  },
];

const STORAGE_KEY = "majalis-lang";
const VALID: Lang[] = ["ar", "en", "fr", "tr", "ur", "id"];

export function readLang(): Lang {
  if (typeof window === "undefined") return "ar";
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  return stored && (VALID as string[]).includes(stored) ? stored : "ar";
}

export function writeLang(lang: Lang) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, lang);
}

export function langDir(lang: Lang): "rtl" | "ltr" {
  return LANG_META.find((m) => m.code === lang)?.dir ?? "rtl";
}
