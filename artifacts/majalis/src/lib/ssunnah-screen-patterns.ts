/**
 * أنماط تخطيط شاشات سُنّة — هوية واحدة، تخطيط متنوع حسب المحتوى.
 * القيم البصرية من theme/--ss-* فقط؛ الأنماط تغيّر الترتيب والكثافة لا الهوية.
 */

export const SS_SCREEN_PATTERNS = [
  "grid",
  "list",
  "reader",
  "scripture",
  "player",
  "detail",
  "dashboard",
  "utility",
] as const;

export type SsScreenPattern = (typeof SS_SCREEN_PATTERNS)[number];

export type SsScreenDensity = "compact" | "regular" | "comfortable";

export type SsScreenColumns = 1 | 2;

export const SS_SCREEN_PATTERN_META: Record<
  SsScreenPattern,
  { labelAr: string; useWhen: string; varies: string }
> = {
  grid: {
    labelAr: "شبكة",
    useWhen: "أقسام وفئات كبطاقات",
    varies: "أعمدة 1–2 · كثافة البطاقة",
  },
  list: {
    labelAr: "قائمة",
    useWhen: "عناصر متتابعة (دروس، بحث)",
    varies: "كثافة الصف · فلاتر أعلى القائمة",
  },
  reader: {
    labelAr: "قارئ",
    useWhen: "نص طويل (حديث، شرح، تعريف)",
    varies: "عرض القراءة · هوامش مريحة",
  },
  scripture: {
    labelAr: "متن/مصحف",
    useWhen: "قرآن ومتون بخط موثّق",
    varies: "محرّك العرض الخاص فقط؛ ألوان/رأس/تنقّل من الهوية",
  },
  player: {
    labelAr: "مشغّل",
    useWhen: "صوت أو فيديو مع بيانات المادة",
    varies: "موضع المشغّل · بيانات مرافقة",
  },
  detail: {
    labelAr: "تفاصيل",
    useWhen: "عنصر واحد مع إجراءات",
    varies: "Hero موسّع أو بسيط · شريط إجراءات",
  },
  dashboard: {
    labelAr: "لوحة",
    useWhen: "ملخصات وبطاقات مختلطة (رئيسية، صلاة)",
    varies: "ترتيب الأقسام · كثافة البطاقات",
  },
  utility: {
    labelAr: "أدوات",
    useWhen: "إعدادات وحساب وأدوات",
    varies: "تجميع الأقسام · كثافة الحقول",
  },
};

/** ربط شاشات المنتج الأساسية → النمط (دفعة الربط الأولى + حصر) */
export const SS_SCREEN_ROUTE_PATTERN: ReadonlyArray<{
  id: string;
  path: string;
  pattern: SsScreenPattern;
  source: string;
  batch: 1 | 2 | 3 | "later";
}> = [
  { id: "home", path: "/", pattern: "dashboard", source: "src/pages/account/ui/HomeView.tsx", batch: 1 },
  { id: "sections", path: "/sections", pattern: "grid", source: "src/pages/account/SectionsPage.tsx", batch: 1 },
  { id: "fiqh", path: "/fiqh", pattern: "grid", source: "src/pages/fiqh/ui/FiqhView.tsx", batch: 1 },
  { id: "hadith", path: "/hadith", pattern: "grid", source: "src/pages/hadith/ui/HadithView.tsx", batch: 1 },
  { id: "hadith-by-id", path: "/hadith/:id", pattern: "reader", source: "src/pages/hadith/ui/HadithByIdView.tsx", batch: 1 },
  { id: "search", path: "/search", pattern: "list", source: "src/pages/account/ui/SearchView.tsx", batch: 1 },
  { id: "lessons", path: "/lessons", pattern: "list", source: "src/pages/lessons/ui/LessonsView.tsx", batch: 1 },
  { id: "lesson-detail", path: "/lessons/:id", pattern: "detail", source: "src/pages/lessons/ui/LessonDetailView.tsx", batch: 1 },
  { id: "prayer", path: "/prayer-times", pattern: "dashboard", source: "src/pages/worship/ui/PrayerTimesView.tsx", batch: 1 },
  { id: "settings", path: "/settings", pattern: "utility", source: "src/pages/account/ui/SettingsView.tsx", batch: 1 },
  { id: "mushaf", path: "/mushaf", pattern: "scripture", source: "src/pages/quran/MushafReaderPage.tsx", batch: 1 },
  { id: "tafsir", path: "/tafsir", pattern: "reader", source: "src/pages/quran/ui/TafsirView.tsx", batch: 2 },
  { id: "adhkar", path: "/adhkar", pattern: "list", source: "src/pages/worship/ui/AdhkarView.tsx", batch: 2 },
  { id: "quran-hub", path: "/quran-hub", pattern: "grid", source: "src/pages/quran/QuranHubPage.tsx", batch: 2 },
  { id: "login", path: "/login", pattern: "utility", source: "src/pages/account/ui/LoginView.tsx", batch: 2 },
];

export function isSsScreenPattern(v: string): v is SsScreenPattern {
  return (SS_SCREEN_PATTERNS as readonly string[]).includes(v);
}
