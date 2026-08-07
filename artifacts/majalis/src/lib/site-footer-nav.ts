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
      { href: "/quran-knowledge", label: "القرآن" },
      { href: "/lessons", label: "الدروس" },
      { href: "/learn", label: "المكتبة" },
      { href: "/scholars", label: "العلماء" },
      { href: "/teachers", label: "المشايخ المعاصرون" },
      { href: "/fiqh", label: "الفقه" },
      { href: "/hadith", label: "الحديث" },
      { href: "/adhkar", label: "الأذكار" },
    ],
  },
  {
    id: "start",
    title: "ابدأ",
    links: [
      { href: "/start-here", label: "ابدأ من هنا" },
      { href: "/learning/paths", label: "المسارات العلمية" },
      { href: "/islamic-glossary", label: "المعجم الشرعي" },
      { href: "/search", label: "البحث" },
    ],
  },
  {
    id: "trust",
    title: "الثقة",
    links: [
      { href: "/methodology", label: "منهجيتنا في التوثيق" },
      { href: "/fatwa-policy", label: "سياسة الفتوى" },
      { href: "/about-us", label: "من نحن" },
      { href: "/sources", label: "المصادر والتراخيص" },
      { href: "/contact", label: "تواصل معنا" },
    ],
  },
  {
    id: "legal",
    title: "قانوني",
    links: [
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "شروط الاستخدام" },
      { href: "/account-deletion", label: "حذف الحساب" },
      { href: "/about", label: "حول التطبيق" },
    ],
  },
];

export const SITE_FOOTER_TAGLINE = "الريادة الإسلامية الرقمية";
