import { useCallback, useEffect, useState } from "react";

export type QuranFontId = "uthmani" | "naskh" | "amiri";

/** وضع القراءة — "عادي" أبيض عاجي، "ليلي"/"دافئ" مبنيان مسبقًا في quran.css (.quran-shell--night/--warm)، "عالي التباين" جديد. */
export type QuranReadingTheme = "standard" | "night" | "warm" | "high-contrast";

/** لون إطار صفحة المصحف — يُطبَّق كمتغيرات CSS على .qs-mushaf-frame، لا كتصميم منفصل مكرَّر. */
export type QuranFrameStyle = "emerald" | "gold-classic" | "paper" | "minimal" | "none";

/** نمط تمييز الآية المختارة في وضع الصفحة. */
export type QuranHighlightStyle = "wash" | "border" | "underline" | "text-color" | "spotlight" | "side-indicator";

/**
 * وضع عرض صفحة المصحف: "precision" (افتراضي لكل مستخدم جديد، 2026-07-22)
 * — خط QPC V2 الرقمي الخاص بكل صفحة (مطابقة حرفية للمطبوع)، يُحمَّل عند
 * فتح كل صفحة (~155kb/صفحة). "light" — خط حفص العثماني الموحّد (Amiri
 * Quran) لكل الصفحات، بلا تحميل خط منفصل، استهلاك بيانات أقل؛ يبقى متاحًا
 * للتبديل اليدوي من إعدادات القارئ ويُحفظ الاختيار في localStorage
 * (mj-quran-prefs-v4) فيعلو على هذا الافتراضي في كل زيارة لاحقة. راجع
 * docs/mushaf-rebuild-inventory.md للتفاصيل.
 */
export type QuranPageMode = "light" | "precision";

export type QuranPreferences = {
  fontScale: number;
  fontId: QuranFontId;
  showAyahNumbers: boolean;
  nightMode: boolean;
  readingTheme: QuranReadingTheme;
  frameStyle: QuranFrameStyle;
  highlightStyle: QuranHighlightStyle;
  pageMode: QuranPageMode;
};

const KEY = "mj-quran-prefs-v4";
const LEGACY_KEY = "mj-quran-prefs-v3";

const DEFAULTS: QuranPreferences = {
  fontScale: 26,
  fontId: "uthmani",
  showAyahNumbers: true,
  nightMode: false,
  readingTheme: "standard",
  /* "none" افتراضيًا (2026-07-22، بطلب المالك): إلغاء شكل "الورقة"
     (الإطار المزدوج + الزخارف الذهبية بالزوايا) لدمج صفحة المصحف بصريًا
     مع خلفية التطبيق العادية بدل بطاقة منفصلة — الخيارات الأخرى (emerald/
     gold-classic/paper/minimal) تبقى متاحة من الإعدادات لمن يفضّلها. */
  frameStyle: "none",
  highlightStyle: "wash",
  pageMode: "precision",
};

/** أول زيارة بلا أي تفضيل محفوظ فقط: يحترم prefers-color-scheme النظامي
 * (وضع ليلي تلقائي إن كان نظام المستخدم داكنًا) — أي اختيار يدوي لاحق من
 * الإعدادات يُخزَّن في localStorage ويعلو عليه دومًا. */
function systemPrefersDark(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
  } catch {
    return false;
  }
}

function load(): QuranPreferences {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    return { ...DEFAULTS, readingTheme: systemPrefersDark() ? "night" : "standard" };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useQuranPreferences() {
  const [prefs, setPrefsState] = useState<QuranPreferences>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  const setPref = useCallback(<K extends keyof QuranPreferences>(key: K, value: QuranPreferences[K]) => {
    setPrefsState((p) => ({ ...p, [key]: value }));
  }, []);

  const bumpFont = useCallback((delta: number) => {
    setPrefsState((p) => ({ ...p, fontScale: Math.min(42, Math.max(18, p.fontScale + delta)) }));
  }, []);

  return { prefs, setPref, bumpFont };
}
