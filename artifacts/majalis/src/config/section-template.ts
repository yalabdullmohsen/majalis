/**
 * تشريح صفحة القسم التسعة — مصدر واحد يطابق مرجع العقيدة.
 * 1 فتات · 2 شارة ذهبية · 3 لافتة · 4 عنوان · 5 وصف · 6 اقتباس داخل اللافتة
 * · 7 عنوان مجموعة · 8 بطاقات/جسم · 9 --section-accent
 * بلا حقل بحث محلي في الهب.
 */
import type { TopicThemeId } from "@/config/topic-themes";
import { getSectionAccent, getSectionByRoute } from "@/config/sections.registry";

export type SectionTemplateQuote = {
  text: string;
  ref: string;
  type?: "ayah" | "hadith";
};

export type SectionTemplateChrome = {
  themeId: TopicThemeId;
  sectionRoute: string;
  breadcrumb: Array<{ label: string; href?: string }>;
  eyebrow: string;
  title: string;
  subtitle: string;
  quote: SectionTemplateQuote;
  groupTitle: string;
};

const ROUTE_THEME: Record<string, TopicThemeId> = {
  "/hadith": "hadith",
  "/tafsir": "quran",
  "/quran-hub/tajweed": "quran",
  "/quran-hub/qiraat": "quran",
  "/ulum-quran": "quran",
  "/quran/surah-stories": "quran",
  "/quran/people": "quran",
  "/quran-knowledge": "quran",
  "/seerah": "seerah",
  "/tarikh-islami": "seerah",
  "/nations": "seerah",
  "/library": "aqeedah",
  "/academic-research": "aqeedah",
  "/islamic-glossary": "aqeedah",
  "/universities": "aqeedah",
  "/discover-islam": "aqeedah",
};

/** اقتباسات موجودة مسبقاً في محتوى المنصة — لا توليد نص شرعي جديد */
const ROUTE_QUOTE: Record<string, SectionTemplateQuote> = {
  "/hadith": {
    text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.",
    ref: "متفق عليه — البخاري ١ · مسلم ١٩٠٧",
    type: "hadith",
  },
  "/tafsir": {
    text: "وَلَا تَقْفُ مَا لَيْسَ لَكَ بِهِ عِلْمٌ",
    ref: "الإسراء: ٣٦",
    type: "ayah",
  },
  "/quran-hub/tajweed": {
    text: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
    ref: "المزمل: ٤",
    type: "ayah",
  },
  "/quran-hub/qiraat": {
    text: "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ",
    ref: "الحجر: ٩",
    type: "ayah",
  },
  "/ulum-quran": {
    text: "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ",
    ref: "الحجر: ٩",
    type: "ayah",
  },
  "/quran/surah-stories": {
    text: "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ",
    ref: "الحجر: ٩",
    type: "ayah",
  },
  "/quran/people": {
    text: "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ",
    ref: "الحجر: ٩",
    type: "ayah",
  },
  "/quran-knowledge": {
    text: "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ",
    ref: "الحجر: ٩",
    type: "ayah",
  },
  "/seerah": {
    text: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ",
    ref: "الأنبياء: ١٠٧",
    type: "ayah",
  },
  "/tarikh-islami": {
    text: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ",
    ref: "الأنبياء: ١٠٧",
    type: "ayah",
  },
  "/nations": {
    text: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ",
    ref: "الأنبياء: ١٠٧",
    type: "ayah",
  },
  "/library": {
    text: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    ref: "العلق: ١",
    type: "ayah",
  },
  "/academic-research": {
    text: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    ref: "العلق: ١",
    type: "ayah",
  },
  "/islamic-glossary": {
    text: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    ref: "العلق: ١",
    type: "ayah",
  },
  "/universities": {
    text: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    ref: "العلق: ١",
    type: "ayah",
  },
  "/discover-islam": {
    text: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    ref: "الإخلاص: ١",
    type: "ayah",
  },
};

const FALLBACK_QUOTE: SectionTemplateQuote = {
  text: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
  ref: "الذاريات: ٥٦",
  type: "ayah",
};

export function sectionThemeId(route: string): TopicThemeId {
  return ROUTE_THEME[route] ?? "aqeedah";
}

export function sectionTemplateChrome(
  route: string,
  overrides?: Partial<Omit<SectionTemplateChrome, "sectionRoute">>,
): SectionTemplateChrome {
  const sec = getSectionByRoute(route);
  const title = overrides?.title ?? sec?.label ?? "القسم";
  return {
    themeId: overrides?.themeId ?? sectionThemeId(route),
    sectionRoute: route,
    breadcrumb: overrides?.breadcrumb ?? [
      { label: "الرئيسية", href: "/" },
      { label: title },
    ],
    eyebrow: overrides?.eyebrow ?? title,
    title,
    subtitle: overrides?.subtitle ?? sec?.subtitle ?? "",
    quote: overrides?.quote ?? ROUTE_QUOTE[route] ?? FALLBACK_QUOTE,
    groupTitle: overrides?.groupTitle ?? `أقسام ${title}`,
  };
}

export function sectionAccentVar(route: string): string {
  return getSectionAccent(route);
}
