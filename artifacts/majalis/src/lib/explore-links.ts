import type { ExploreAlsoLink } from "@/lib/explore-link-types";

/**
 * روابط «استكشف أيضًا» لصفحات التخطيط الأكورديوني — مصدر واحد بدل تكرار
 * المصفوفات داخل كل صفحة view.
 */
export const ACCORDION_EXPLORE_LINKS = {
  maqasid: [
    { href: "/fiqh/usul", label: "أصول الفقه" },
    { href: "/fiqh", label: "بوابة الفقه" },
    { href: "/fiqh/books/salah", label: "كتاب الصلاة" },
    { href: "/methodology", label: "منهجية التوثيق" },
  ],
  iman: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/asma-husna", label: "أسماء الله الحسنى" },
    { href: "/arkan", label: "أركان الإسلام والإيمان" },
    { href: "/malaika", label: "الملائكة" },
  ],
  usra: [
    { href: "/fiqh/books/buyu", label: "كتاب البيوع" },
    { href: "/mawarith", label: "حاسبة المواريث" },
    { href: "/akhlaq", label: "الأخلاق" },
    { href: "/nikah", label: "أحكام الأسرة" },
    { href: "/fiqh", label: "بوابة الفقه" },
  ],
  arabic: [
    { href: "/quran-hub", label: "مركز القرآن الكريم" },
    { href: "/adab-talab-ilm", label: "آداب طالب العلم" },
    { href: "/tafsir", label: "علم التفسير" },
  ],
  tazkiya: [
    { href: "/akhlaq", label: "الأخلاق" },
    { href: "/raqaiq", label: "الرقائق" },
    { href: "/adhkar", label: "الأذكار" },
    { href: "/sins-and-rights", label: "الذنوب والحقوق" },
    { href: "/adab-talab-ilm", label: "آداب طالب العلم" },
  ],
  fikr: [
    { href: "/fiqh", label: "بوابة الفقه" },
    { href: "/quiz", label: "سين جيم" },
    { href: "/discover-islam", label: "تعرّف على الإسلام" },
    { href: "/methodology", label: "منهجية التوثيق" },
  ],
  dalail: [
    { href: "/seerah", label: "السيرة النبوية" },
    { href: "/prophets", label: "قصص الأنبياء" },
    { href: "/miracles", label: "الإعجاز العلمي" },
    { href: "/tawhid", label: "التوحيد" },
    { href: "/hadith", label: "الحديث" },
  ],
  durusImaniyya: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/kids", label: "قسم الأطفال" },
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/arkan", label: "أركان الإسلام والإيمان" },
  ],
  mawsuaat: [
    { href: "/fawaid", label: "الفوائد" },
    { href: "/quiz", label: "سين جيم" },
    { href: "/fiqh", label: "بوابة الفقه" },
    { href: "/daily-wird", label: "الورد اليومي" },
    { href: "/sections", label: "الأقسام" },
  ],
  durusMutanawwia: [
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/learn", label: "مركز التعلّم" },
    { href: "/quiz", label: "المسابقة" },
    { href: "/islamic-directory", label: "دليل المؤسسات والمساجد" },
  ],
  tarikh: [
    { href: "/seerah", label: "السيرة النبوية" },
    { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
    { href: "/prophets", label: "قصص الأنبياء" },
    { href: "/nations", label: "الأمم السابقة" },
  ],
  sunnah: [
    { href: "/hadith", label: "الحديث وعلومه" },
    { href: "/sunan-yawmiyya", label: "السنن اليومية" },
    { href: "/wasaya-nabawiyya", label: "الوصايا النبوية" },
    { href: "/adhkar", label: "الأذكار" },
  ],
} as const satisfies Record<string, readonly ExploreAlsoLink[]>;

export type AccordionExploreKey = keyof typeof ACCORDION_EXPLORE_LINKS;

export function accordionExploreLinks(key: AccordionExploreKey): ExploreAlsoLink[] {
  return [...ACCORDION_EXPLORE_LINKS[key]];
}

/** روابط ثابتة لصفحات غير أكورديونية */
export const PAGE_EXPLORE_LINKS = {
  historyDetail: [
    { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
    { href: "/seerah", label: "السيرة النبوية" },
    { href: "/hadith", label: "الحديث وعلومه" },
    { href: "/lessons", label: "الدروس العلمية" },
  ],
  asmaHusna: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/arkan", label: "أركان الإسلام والإيمان" },
    { href: "/iman-topics", label: "موضوعات الإيمان" },
    { href: "/adhkar", label: "الأذكار" },
    { href: "/quran-hub", label: "مركز القرآن الكريم" },
  ],
  adabTalabIlm: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/fiqh", label: "بوابة الفقه" },
    { href: "/quran-hub", label: "مركز القرآن الكريم" },
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/fiqh/usul", label: "أصول الفقه" },
  ],
} as const satisfies Record<string, readonly ExploreAlsoLink[]>;
