/**
 * مجموعات التذييل العالمي (R4-2) — مصدر واحد للروابط الظاهرة.
 * بوابة اليُتم تقرأ SiteFooter الذي يستورد من هنا.
 */

export type FooterLink = { href: string; label: string };

export type FooterGroup = {
  id: string;
  title: string;
  links: FooterLink[];
};

export const SITE_FOOTER_GROUPS: FooterGroup[] = [
  {
    id: "sections",
    title: "الأقسام",
    links: [
      { href: "/quran-hub", label: "القرآن الكريم" },
      { href: "/lessons", label: "الدروس" },
      { href: "/teachers", label: "المشايخ" },
      { href: "/prayer-times", label: "الصلاة" },
      { href: "/fiqh", label: "الفقه" },
      { href: "/sections", label: "الأقسام" },
      { href: "/library", label: "المكتبة" },
      { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
      { href: "/hadith", label: "الحديث وعلومه" },
      { href: "/adhkar", label: "الأذكار" },
      { href: "/quiz", label: "سين جيم" },
    ],
  },
  {
    id: "start",
    title: "ابدأ",
    links: [
      { href: "/lessons", label: "الدروس" },
      { href: "/search", label: "البحث" },
      { href: "/quiz", label: "سين جيم" },
    ],
  },
  {
    id: "trust",
    title: "الثقة",
    links: [
      { href: "/methodology", label: "منهجيتنا في التوثيق" },
      { href: "/fatwa-policy", label: "سياسة الفتوى" },
      { href: "/about", label: "من نحن" },
      { href: "/sources", label: "المصادر والتراخيص" },
      { href: "/contact", label: "تواصل معنا" },
    ],
  },
  {
    id: "legal",
    title: "قانوني",
    links: [
      { href: "/privacy", label: "الخصوصية" },
      { href: "/privacy-center", label: "مركز الخصوصية" },
      { href: "/terms", label: "شروط الاستخدام" },
      { href: "/account-deletion", label: "حذف الحساب" },
      { href: "/about", label: "حول التطبيق" },
    ],
  },
];

export const SITE_FOOTER_TAGLINE = "الريادة الإسلامية الرقمية";
