import type { ExploreAlsoLink } from "@/lib/explore-link-types";

/**
 * روابط «استكشف أيضًا» لصفحات التخطيط الأكورديوني — مصدر واحد بدل تكرار
 * المصفوفات داخل كل صفحة view.
 */
export const ACCORDION_EXPLORE_LINKS = {
  maqasid: [
    { href: "/fiqh/usul", label: "أصول الفقه" },
    { href: "/fiqh-qawaid", label: "القواعد الفقهية" },
    { href: "/madhahib", label: "المذاهب الأربعة" },
    { href: "/fiqh", label: "بوابة الفقه" },
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
    { href: "/quran-knowledge", label: "القرآن وعلومه" },
    { href: "/adab-talab-ilm", label: "آداب طالب العلم" },
    { href: "/islamic-glossary", label: "المصطلحات الشرعية" },
  ],
  tazkiya: [
    { href: "/akhlaq", label: "الأخلاق" },
    { href: "/raqaiq", label: "الرقائق" },
    { href: "/adhkar", label: "الأذكار" },
    { href: "/sins-and-rights", label: "الذنوب والحقوق" },
    { href: "/adab-talab-ilm", label: "آداب طالب العلم" },
  ],
  fikr: [
    { href: "/fiqh", label: "فقه التقنية" },
    { href: "/fiqh-council/nawazil", label: "النوازل المعاصرة" },
    { href: "/fiqh-council", label: "فقه الأقليات" },
    { href: "/quiz", label: "سين جيم" },
    { href: "/discover-islam", label: "تعرّف على الإسلام" },
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
    { href: "/iman-topics", label: "موضوعات الإيمان" },
    { href: "/kids", label: "قسم الأطفال" },
    { href: "/lessons", label: "الدروس العلمية" },
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
    { href: "/scholars", label: "أعلام الإسلام" },
    { href: "/prophets", label: "قصص الأنبياء" },
    { href: "/islamic-landmarks", label: "معالم إسلامية" },
    { href: "/nations", label: "الأمم السابقة" },
  ],
  sunnah: [
    { href: "/hadith", label: "الحديث وعلومه" },
    { href: "/hadith-science", label: "مصطلح الحديث" },
    { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
    { href: "/sunan-yawmiyya", label: "السنن اليومية" },
    { href: "/wasaya-nabawiyya", label: "الوصايا النبوية" },
  ],
} as const satisfies Record<string, readonly ExploreAlsoLink[]>;

export type AccordionExploreKey = keyof typeof ACCORDION_EXPLORE_LINKS;

export function accordionExploreLinks(key: AccordionExploreKey): ExploreAlsoLink[] {
  return [...ACCORDION_EXPLORE_LINKS[key]];
}

/** روابط ثابتة لصفحات غير أكورديونية */
export const PAGE_EXPLORE_LINKS = {
  scholar: [
    { href: "/quran-knowledge", label: "القرآن وعلومه" },
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/madhahib", label: "المذاهب الأربعة" },
    { href: "/memorization", label: "الحفظ والمراجعة" },
  ],
  asmaHusna: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/arkan", label: "أركان الإسلام والإيمان" },
    { href: "/iman-topics", label: "موضوعات الإيمان" },
    { href: "/adhkar", label: "الأذكار" },
    { href: "/quran-hub", label: "مركز القرآن" },
  ],
  adabTalabIlm: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/fiqh", label: "بوابة الفقه" },
    { href: "/quran-knowledge", label: "القرآن وعلومه" },
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/fiqh/usul", label: "أصول الفقه" },
  ],
} as const satisfies Record<string, readonly ExploreAlsoLink[]>;
