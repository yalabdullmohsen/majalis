export type Lang =
  | "ar" | "en" | "fr" | "tr" | "ur" | "id"
  | "es" | "de" | "ru" | "zh" | "hi" | "bn" | "tl" | "fa" | "sw" | "pt";

/** بنية جاهزة لـ16 لغة (قسم التعريف بالإسلام) — العربية والإنجليزية
 * مترجمتان بالكامل لنصوص الواجهة؛ البقية "بنية جاهزة" فقط (تعود
 * تلقائيًا للعربية/الإنجليزية عبر LanguageProvider.tsx حتى تُترجَم
 * فعليًا لاحقًا — إضافة قاموس لغة جديدة لا يتطلب تعديل هذا الملف إلا
 * سطرًا واحدًا هنا إن لم تكن مُدرَجة أصلًا). */
export const LANG_META: { code: Lang; label: string; dir: "rtl" | "ltr"; nativeName: string }[] = [
  { code: "ar", label: "Arabic",     dir: "rtl", nativeName: "العربية"    },
  { code: "ur", label: "Urdu",       dir: "rtl", nativeName: "اردو"       },
  { code: "fa", label: "Persian",    dir: "rtl", nativeName: "فارسی"      },
  { code: "en", label: "English",    dir: "ltr", nativeName: "English"    },
  { code: "fr", label: "French",     dir: "ltr", nativeName: "Français"   },
  { code: "es", label: "Spanish",    dir: "ltr", nativeName: "Español"    },
  { code: "de", label: "German",     dir: "ltr", nativeName: "Deutsch"    },
  { code: "ru", label: "Russian",    dir: "ltr", nativeName: "Русский"    },
  { code: "zh", label: "Chinese",    dir: "ltr", nativeName: "中文"        },
  { code: "hi", label: "Hindi",      dir: "ltr", nativeName: "हिन्दी"      },
  { code: "bn", label: "Bengali",    dir: "ltr", nativeName: "বাংলা"       },
  { code: "id", label: "Indonesian", dir: "ltr", nativeName: "Indonesia"  },
  { code: "tl", label: "Filipino",   dir: "ltr", nativeName: "Filipino"   },
  { code: "tr", label: "Turkish",    dir: "ltr", nativeName: "Türkçe"     },
  { code: "sw", label: "Swahili",    dir: "ltr", nativeName: "Kiswahili"  },
  { code: "pt", label: "Portuguese", dir: "ltr", nativeName: "Português"  },
];

const STORAGE_KEY = "majalis-lang";
const VALID: Lang[] = LANG_META.map((m) => m.code);

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
