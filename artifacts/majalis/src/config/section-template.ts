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
  /** قسم النسب — بلا sectionId لا يُعرض الاقتباس */
  sectionId: string;
};

export type SectionTemplateChrome = {
  themeId: TopicThemeId;
  sectionRoute: string;
  breadcrumb: Array<{ label: string; href?: string }>;
  eyebrow: string;
  title: string;
  subtitle: string;
  quote?: SectionTemplateQuote;
  groupTitle: string;
};

const ROUTE_THEME: Record<string, TopicThemeId> = {
  "/hadith": "hadith",
  "/tafsir": "quran",
  "/quran-hub/tajweed": "quran",
  "/quran-hub/qiraat": "quran",
  "/quran-hub/seven-ahruf": "quran",
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
export const ROUTE_QUOTE: Record<string, SectionTemplateQuote> = {
  "/hadith": {
    text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.",
    ref: "متفق عليه — البخاري ١ · مسلم ١٩٠٧",
    type: "hadith",
    sectionId: "hadith",
  },
  "/tafsir": {
    text: "وَأَنزَلْنَا إِلَيْكَ الذِّكْرَ لِتُبَيِّنَ لِلنَّاسِ مَا نُزِّلَ إِلَيْهِمْ",
    ref: "النحل: ٤٤",
    type: "ayah",
    sectionId: "tafsir",
  },
  "/quran-hub/tajweed": {
    text: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا",
    ref: "المزمل: ٤",
    type: "ayah",
    sectionId: "quran-tajweed",
  },
  "/quran-hub/seven-ahruf": {
    text: "إن هذا القرآن أُنزل على سبعة أحرف، فاقرؤوا ما تيسّر منه.",
    ref: "متفق عليه — البخاري ٤٩٩٢ · مسلم ٨١٨",
    type: "hadith",
    sectionId: "quran-seven-ahruf",
  },
  "/quran-hub/qiraat": {
    text: "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ",
    ref: "الحجر: ٩",
    type: "ayah",
    sectionId: "quran-qiraat",
  },
  "/ulum-quran": {
    text: "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ",
    ref: "ص: ٢٩",
    type: "ayah",
    sectionId: "ulum-quran",
  },
  "/quran/surah-stories": {
    text: "لَقَدْ كَانَ فِي قَصَصِهِمْ عِبْرَةٌ لِّأُولِي الْأَلْبَابِ",
    ref: "يوسف: ١١١",
    type: "ayah",
    sectionId: "quran-asbab",
  },
  "/quran/people": {
    text: "وَرُسُلًا قَدْ قَصَصْنَاهُمْ عَلَيْكَ مِن قَبْلُ وَرُسُلًا لَّمْ نَقْصُصْهُمْ عَلَيْكَ",
    ref: "النساء: ١٦٤",
    type: "ayah",
    sectionId: "quran-figures",
  },
  "/quran-knowledge": {
    text: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    ref: "المجادلة: ١١",
    type: "ayah",
    sectionId: "quran-topics",
  },
  "/seerah": {
    text: "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ",
    ref: "الأنبياء: ١٠٧",
    type: "ayah",
    sectionId: "seerah",
  },
  "/tarikh-islami": {
    text: "الَّذِينَ إِن مَّكَّنَّاهُمْ فِي الْأَرْضِ أَقَامُوا الصَّلَاةَ وَآتَوُا الزَّكَاةَ وَأَمَرُوا بِالْمَعْرُوفِ وَنَهَوْا عَنِ الْمُنكَرِ ۗ وَلِلَّهِ عَاقِبَةُ الْأُمُورِ",
    ref: "الحج: ٤١",
    type: "ayah",
    sectionId: "islamic-history",
  },
  "/nations": {
    text: "فَكُلًّا أَخَذْنَا بِذَنبِهِ ۖ وَمِنْهُم مَّنْ أَرْسَلْنَا عَلَيْهِ حَاصِبًا",
    ref: "العنكبوت: ٤٠",
    type: "ayah",
    sectionId: "nations",
  },
  "/prophets": {
    text: "وَتِلْكَ حُجَّتُنَا آتَيْنَاهَا إِبْرَاهِيمَ عَلَىٰ قَوْمِهِ ۚ نَرْفَعُ دَرَجَاتٍ مَّن نَّشَاءُ",
    ref: "الأنعام: ٨٣",
    type: "ayah",
    sectionId: "prophets",
  },
  "/fiqh": {
    text: "فَاسْأَلُوا أَهْلَ الذِّكْرِ إِن كُنتُمْ لَا تَعْلَمُونَ",
    ref: "النحل: ٤٣",
    type: "ayah",
    sectionId: "fiqh",
  },
  "/duas": {
    text: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    ref: "غافر: ٦٠",
    type: "ayah",
    sectionId: "duas",
  },
  "/adhkar": {
    text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    ref: "الرعد: ٢٨",
    type: "ayah",
    sectionId: "adhkar",
  },
  "/tawhid": {
    text: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    ref: "الإخلاص: ١",
    type: "ayah",
    sectionId: "aqidah",
  },
  "/lessons": {
    text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    ref: "طه: ١١٤",
    type: "ayah",
    sectionId: "lessons",
  },
  "/library": {
    text: "قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ",
    ref: "الزمر: ٩",
    type: "ayah",
    sectionId: "library",
  },
  "/academic-research": {
    text: "فَاسْأَلُوا أَهْلَ الذِّكْرِ إِن كُنتُمْ لَا تَعْلَمُونَ",
    ref: "النحل: ٤٣",
    type: "ayah",
    sectionId: "research",
  },
  "/islamic-glossary": {
    text: "وَعَلَّمَ آدَمَ الْأَسْمَاءَ كُلَّهَا",
    ref: "البقرة: ٣١",
    type: "ayah",
    sectionId: "glossary",
  },
  "/universities": {
    text: "يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ",
    ref: "المجادلة: ١١",
    type: "ayah",
    sectionId: "universities",
  },
  "/discover-islam": {
    text: "فَإِنْ آمَنُوا بِمِثْلِ مَا آمَنتُم بِهِ فَقَدِ اهْتَدَوا",
    ref: "البقرة: ١٣٧",
    type: "ayah",
    sectionId: "discover-islam",
  },
};

/** يُرجع اقتباساً فقط إذا sectionId يطابق القسم — بلا fallback عام */
export function resolveSectionQuote(route: string): SectionTemplateQuote | undefined {
  const q = ROUTE_QUOTE[route];
  if (!q?.sectionId) return undefined;
  const sec = getSectionByRoute(route);
  if (sec && q.sectionId !== sec.id) return undefined;
  return q;
}

export function sectionThemeId(route: string): TopicThemeId {
  return ROUTE_THEME[route] ?? "aqeedah";
}

export function sectionTemplateChrome(
  route: string,
  overrides?: Partial<Omit<SectionTemplateChrome, "sectionRoute" | "quote">> & {
    quote?: Pick<SectionTemplateQuote, "text" | "ref"> & Partial<Pick<SectionTemplateQuote, "type" | "sectionId">>;
  },
): SectionTemplateChrome {
  const sec = getSectionByRoute(route);
  const title = overrides?.title ?? sec?.label ?? "القسم";
  const resolved = resolveSectionQuote(route);
  const quote =
    overrides?.quote != null
      ? ({
          ...overrides.quote,
          sectionId: overrides.quote.sectionId ?? sec?.id ?? resolved?.sectionId ?? "",
        } as SectionTemplateQuote)
      : resolved;
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
    quote,
    groupTitle: overrides?.groupTitle ?? `أقسام ${title}`,
  };
}

export function sectionAccentVar(route: string): string {
  return getSectionAccent(route);
}
