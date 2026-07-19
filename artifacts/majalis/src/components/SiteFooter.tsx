import { Link } from "wouter";
import { CONTACT_EMAIL } from "@/lib/site-config";

function IslamicStarFooter() {
  const cx = 16, r1 = 13, r2 = 7;
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cx + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="footer-star">
      <polygon points={pts} fill="none" stroke="var(--majalis-emerald,#173D35)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.7" />
      <circle cx={cx} cy={cx} r="2.5" fill="var(--majalis-emerald,#173D35)" opacity="0.7" />
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
      { href: "/hikam-salaf",    label: "حكم السلف" },
      { href: "/fadail-aamal",   label: "فضائل الأعمال" },
      { href: "/stories",        label: "القصص الإسلامية" },
      { href: "/seerah",         label: "السيرة النبوية" },
      { href: "/sahabah",        label: "أعلام الصحابة" },
      { href: "/shamael",          label: "الشمائل المحمدية" },
      { href: "/islamic-glossary", label: "المصطلحات الإسلامية" },
      { href: "/adab-talab-ilm",  label: "آداب طالب العلم" },
      { href: "/prophets",        label: "الأنبياء والرسل" },
      { href: "/janna-naar",      label: "صفة الجنة والنار" },
      { href: "/alamat-saah",    label: "علامات الساعة" },
      { href: "/malaika",       label: "الملائكة في الإسلام" },
      { href: "/wasaya-nabawiyya", label: "الوصايا النبوية" },
      { href: "/raqaiq",           label: "الرقائق والزهد" },
      { href: "/tawba",          label: "التوبة والاستغفار" },
      { href: "/ulum-quran",     label: "علوم القرآن" },
      { href: "/qa",             label: "الأسئلة" },
      { href: "/hadith/books-and-rulings", label: "كتب الحديث والأحكام" },
      { href: "/updates",        label: "آخر المستجدات" },
    ],
  },
  {
    title: "القرآن والعبادة",
    links: [
      { href: "/quran-hub",           label: "مركز القرآن" },
      { href: "/quran-radio",         label: "إذاعة القرآن" },
      { href: "/quran-live",          label: "البث المباشر" },
      { href: "/quran/surah-stories", label: "قصص القرآن" },
      { href: "/quran/tajweed",       label: "علم التجويد" },
      { href: "/adhkar",              label: "الأذكار" },
      { href: "/duas-quran",          label: "أدعية القرآن" },
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
      { href: "/zakat",        label: "الزكاة وأحكامها" },
      { href: "/sawm",         label: "الصيام وأحكامه" },
      { href: "/hajj",         label: "الحج والعمرة" },
      { href: "/tahara",       label: "الطهارة وأحكامها" },
      { href: "/janaza",       label: "أحكام الجنائز" },
      { href: "/mawarith",     label: "المواريث والفرائض" },
      { href: "/salah-guide",  label: "دليل الصلاة الكامل" },
      { href: "/fiqh-qawaid",  label: "القواعد الفقهية" },
      { href: "/rulings",      label: "الأحكام الشرعية" },
      { href: "/fiqh-council", label: "المجمع الفقهي" },
      { href: "/tawhid",       label: "التوحيد" },
      { href: "/arkan",        label: "أركان الإسلام" },
      { href: "/arkan-iman",   label: "أركان الإيمان" },
      { href: "/asma-husna",   label: "الأسماء الحسنى" },
      { href: "/akhlaq",       label: "الأخلاق الإسلامية" },
      { href: "/scholars",     label: "أعلام الإسلام" },
      { href: "/miracles",     label: "الإعجاز العلمي" },
      { href: "/islam-stats",  label: "الإسلام في أرقام" },
    ],
  },
  {
    title: "الأدوات والتعلم",
    links: [
      { href: "/quiz",           label: "المسابقات" },
      { href: "/flashcards",     label: "البطاقات" },
      { href: "/learning/paths", label: "المسارات العلمية" },
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
      { href: "/methodology",          label: "منهجية التوثيق" },
      { href: "/sitemap",              label: "خريطة الموقع" },
      { href: "/contact",              label: "تواصل معنا" },
      { href: "/features-in-progress", label: "قيد التطوير" },
      { href: "/privacy",              label: "الخصوصية" },
      { href: "/terms",                label: "الشروط" },
      { href: "/account-deletion",     label: "حذف الحساب" },
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
          <div>
            <img
              src="/logo-calligraphy.png"
              alt="المجلس العلمي"
              className="site-footer-logo site-footer-logo--calligraphy"
              loading="lazy"
              decoding="async"
              width="2044"
              height="788"
            />
            <p>تطبيق علمي شرعي للدروس والعبادة والمحتوى اليومي.</p>
            <p className="site-footer-email">
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
        </div>

        <div className="site-footer-groups">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title} className="site-footer-group">
              <h3 className="site-footer-group__title">{group.title}</h3>
              <nav aria-label={group.title}>
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
