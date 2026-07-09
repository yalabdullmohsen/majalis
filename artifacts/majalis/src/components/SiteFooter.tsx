import { Link } from "wouter";

function IslamicStarFooter() {
  const cx = 16, r1 = 13, r2 = 7;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cx + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="footer-star">
      <polygon points={pts} fill="none" stroke="var(--majalis-emerald,#0E6E52)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.7" />
      <circle cx={cx} cy={cx} r="2.5" fill="var(--majalis-emerald,#0E6E52)" opacity="0.7" />
    </svg>
  );
}

const FOOTER_GROUPS = [
  {
    title: "المحتوى العلمي",
    links: [
      { href: "/lessons",        label: "الدروس" },
      { href: "/annual-courses", label: "الدورات العلمية" },
      { href: "/library",        label: "المكتبة" },
      { href: "/hadith",         label: "الأحاديث" },
      { href: "/hadith-science", label: "مصطلح الحديث" },
      { href: "/fawaid",         label: "الفوائد" },
      { href: "/stories",        label: "القصص الإسلامية" },
      { href: "/seerah",         label: "السيرة النبوية" },
      { href: "/qa",             label: "الأسئلة" },
      { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
      { href: "/updates",        label: "آخر المستجدات" },
    ],
  },
  {
    title: "القرآن والعبادة",
    links: [
      { href: "/quran-hub",           label: "مركز القرآن" },
      { href: "/quran",               label: "المصحف الشريف" },
      { href: "/quran-radio",         label: "إذاعة القرآن" },
      { href: "/quran-live",          label: "البث المباشر" },
      { href: "/quran/surah-stories", label: "قصص القرآن" },
      { href: "/quran/tajweed",       label: "علم التجويد" },
      { href: "/adhkar",              label: "الأذكار" },
      { href: "/sunan-yawmiyya",      label: "السنن اليومية" },
      { href: "/duas",                label: "الأدعية الشرعية" },
      { href: "/prayer-times",        label: "مواقيت الصلاة" },
      { href: "/tasbih",              label: "التسبيح" },
      { href: "/daily-wird",          label: "الورد اليومي" },
      { href: "/prayer-ranks",        label: "فضائل الصلاة" },
      { href: "/qibla",               label: "القبلة" },
      { href: "/occasions",           label: "المناسبات" },
    ],
  },
  {
    title: "الفقه والأحكام",
    links: [
      { href: "/fiqh",         label: "الفقه الإسلامي" },
      { href: "/madhahib",     label: "المذاهب الفقهية" },
      { href: "/fatwa",        label: "الفتاوى" },
      { href: "/rulings",      label: "الأحكام الشرعية" },
      { href: "/fiqh-council", label: "المجمع الفقهي" },
      { href: "/tawhid",       label: "التوحيد" },
      { href: "/arkan",        label: "أركان الإسلام" },
      { href: "/arkan-iman",   label: "أركان الإيمان" },
      { href: "/asma-husna",   label: "الأسماء الحسنى" },
      { href: "/akhlaq",       label: "الأخلاق الإسلامية" },
      { href: "/scholars",     label: "أعلام الإسلام" },
      { href: "/miracles",     label: "الإعجاز العلمي" },
    ],
  },
  {
    title: "الأدوات والتعلم",
    links: [
      { href: "/quiz",           label: "المسابقات" },
      { href: "/flashcards",     label: "البطاقات" },
      { href: "/learning-path",  label: "خارطة طالب العلم" },
      { href: "/assistant",      label: "المساعد العلمي" },
      { href: "/universities",   label: "دليل الجامعات" },
      { href: "/knowledge-map",  label: "الخريطة المعرفية" },
      { href: "/knowledge-graph",label: "شبكة المعرفة" },
      { href: "/search",         label: "البحث الشامل" },
    ],
  },
  {
    title: "التطبيق",
    links: [
      { href: "/about",                label: "من نحن" },
      { href: "/contact",              label: "تواصل معنا" },
      { href: "/features-in-progress", label: "قيد التطوير" },
      { href: "/privacy",              label: "الخصوصية" },
      { href: "/terms",                label: "الشروط" },
      { href: "/submit",               label: "أضف محتوى" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer--v3" dir="rtl" aria-label="تذييل موقع المجلس العلمي">
      <div className="site-footer-inner site-footer-inner--v3">
        <div className="site-footer-brand">
          <IslamicStarFooter />
          <img src="/logo.png" alt="" width={40} height={40} className="site-footer-logo" aria-hidden="true" />
          <div>
            <strong>المجلس العلمي</strong>
            <p>تطبيق علمي شرعي للدروس والعبادة والمحتوى اليومي.</p>
            <p className="site-footer-email">
              <a href="mailto:yalabdullmohsen1@gmail.com">yalabdullmohsen1@gmail.com</a>
            </p>
          </div>
        </div>

        <div className="site-footer-groups">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="site-footer-group">
              <p>{group.title}</p>
              <nav>
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} className="site-footer-link">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <p className="site-footer-copy">© {new Date().getFullYear()} المجلس العلمي</p>
      </div>
    </footer>
  );
}

export default SiteFooter;
