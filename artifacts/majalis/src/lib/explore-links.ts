import type { ExploreAlsoLink } from "@/components/ExploreAlsoNav";

/**
 * روابط «استكشف أيضًا» لصفحات التخطيط الأكورديوني — مصدر واحد بدل تكرار
 * المصفوفات داخل كل صفحة view.
 */
export const ACCORDION_EXPLORE_LINKS = {
  maqasid: [
    { href: "/fiqh/topics/usul-fiqh", label: "أصول الفقه" },
    { href: "/learning/paths/usool-fiqh", label: "مسار أصول الفقه" },
    { href: "/fiqh-qawaid", label: "القواعد الفقهية" },
    { href: "/fiqh", label: "بوابة الفقه" },
    { href: "/rulings", label: "موسوعة الأحكام" },
  ],
  iman: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/asma-husna", label: "أسماء الله الحسنى" },
    { href: "/arkan", label: "أركان الإسلام والإيمان" },
    { href: "/malaika", label: "الملائكة" },
    { href: "/learning/paths", label: "المسارات العلمية" },
  ],
  usra: [
    { href: "/fiqh/topics/muamalat", label: "فقه المعاملات" },
    { href: "/mawarith", label: "حاسبة المواريث" },
    { href: "/akhlaq", label: "الأخلاق" },
    { href: "/rulings?category=" + encodeURIComponent("الأسرة"), label: "أحكام الأسرة" },
    { href: "/fiqh", label: "بوابة الفقه" },
  ],
  arabic: [
    { href: "/ulum-quran", label: "علوم القرآن" },
    { href: "/adab-talab-ilm", label: "آداب طالب العلم" },
    { href: "/library", label: "المكتبة الشرعية" },
    { href: "/learning/paths", label: "المسارات العلمية" },
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
    { href: "/fiqh/topics/tech-fiqh", label: "فقه التقنية" },
    { href: "/fiqh-council/nawazil", label: "النوازل المعاصرة" },
    { href: "/fiqh/topics/minorities", label: "فقه الأقليات" },
    { href: "/quiz", label: "لعبة سين جيم" },
    { href: "/discover-islam", label: "تعرّف على الإسلام" },
  ],
  dalail: [
    { href: "/seerah", label: "السيرة النبوية" },
    { href: "/prophets", label: "قصص الأنبياء" },
    { href: "/miracles", label: "المعجزات" },
    { href: "/tawhid", label: "التوحيد" },
    { href: "/hadith", label: "الحديث" },
  ],
  durusImaniyya: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/iman-topics", label: "موضوعات الإيمان" },
    { href: "/kids", label: "قسم الأطفال" },
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/learning/paths", label: "المسارات العلمية" },
  ],
  mawsuaat: [
    { href: "/fawaid", label: "الفوائد" },
    { href: "/quiz", label: "لعبة سين جيم" },
    { href: "/rulings", label: "موسوعة الأحكام" },
    { href: "/daily-wird", label: "الورد اليومي" },
    { href: "/topics", label: "فهرس الموضوعات" },
  ],
  durusMutanawwia: [
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/learn", label: "مركز التعلّم" },
    { href: "/learning/paths", label: "المسارات العلمية" },
    { href: "/quiz", label: "المسابقة" },
    { href: "/library", label: "المكتبة" },
  ],
  tarikh: [
    { href: "/seerah", label: "السيرة النبوية" },
    { href: "/scholars", label: "أعلام الإسلام" },
    { href: "/prophets", label: "قصص الأنبياء" },
    { href: "/islamic-landmarks", label: "معالم إسلامية" },
    { href: "/nations", label: "الأمم السابقة" },
  ],
  sunnah: [
    { href: "/hadith", label: "الأحاديث" },
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
    { href: "/library", label: "المكتبة الشرعية" },
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/madhahib", label: "المذاهب الأربعة" },
    { href: "/learning/paths", label: "المسارات العلمية" },
    { href: "/knowledge-graph", label: "الرسم المعرفي" },
  ],
  asmaHusna: [
    { href: "/tawhid", label: "التوحيد" },
    { href: "/arkan", label: "أركان الإسلام والإيمان" },
    { href: "/iman-topics", label: "موضوعات الإيمان" },
    { href: "/adhkar", label: "الأذكار" },
    { href: "/quran-hub", label: "مركز القرآن" },
  ],
  adabTalabIlm: [
    { href: "/learning/paths", label: "المسارات العلمية" },
    { href: "/tawhid", label: "التوحيد" },
    { href: "/fiqh", label: "بوابة الفقه" },
    { href: "/library", label: "المكتبة الشرعية" },
    { href: "/lessons", label: "الدروس العلمية" },
    { href: "/fiqh/topics/usul-fiqh", label: "أصول الفقه" },
  ],
} as const satisfies Record<string, readonly ExploreAlsoLink[]>;
