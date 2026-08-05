import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import "@/styles/pages/sitemap.css";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { filterNavItems, isComingSoonPath } from "@/lib/nav-visibility";

const SECTIONS = [
  {
    title: "القرآن الكريم",
    icon: "quran",
    links: [
      { href: "/mushaf",             label: "القرآن",             desc: "المصحف الشريف" },
      { href: "/quran-knowledge",    label: "القرآن وعلومه",      desc: "فهرس · علوم · أسباب · قصص" },
      { href: "/memorization",       label: "الحفظ والمراجعة",    desc: "اختبارات وخطط الحفظ" },
      { href: "/daily-wird",         label: "الورد اليومي",       desc: "ختمة متجددة يومياً" },
      { href: "/quran/tajweed",      label: "علم التجويد",        desc: "أحكام التجويد بالأمثلة" },
      { href: "/tafsir",             label: "علم التفسير",        desc: "أنواع التفسير وأصوله وكتب المفسرين" },
      { href: "/mutashabihat",       label: "المتشابهات القرآنية", desc: "الآيات المتشابهة لفظاً" },
      { href: "/duas-quran",         label: "أدعية القرآن",       desc: "الأدعية القرآنية المختارة" },
    ],
  },
  {
    title: "الحديث والسنة",
    icon: "hadith",
    links: [
      { href: "/hadith",             label: "الأحاديث النبوية",   desc: "موسوعة الأحاديث" },
      { href: "/arbaeen-nawawi",     label: "الأربعون النووية",   desc: "٤٠ حديثاً مع الشرح" },
      { href: "/hadith-science",     label: "مصطلح الحديث",       desc: "السند والمتن والدرجات" },
      { href: "/wasaya-nabawiyya",   label: "الوصايا النبوية",    desc: "خلاصة الوصايا الجامعة" },
      { href: "/prophetic-medicine", label: "الطب النبوي",        desc: "هديه ﷺ في الصحة" },
      { href: "/shamael",            label: "الشمائل المحمدية",   desc: "صفاته ﷺ خَلقاً وخُلقاً" },
    ],
  },
  {
    title: "العقيدة والتوحيد",
    icon: "aqeeda",
    links: [
      { href: "/tawhid",      label: "التوحيد والعقيدة",   desc: "أنواع التوحيد ومسائل العقيدة" },
      { href: "/learn/aqeedat-ahl-sunnah", label: "عقيدة أهل السنة", desc: "معالم المنهج ودروس منظّمة" },
      { href: "/learn/aqsam-tawheed", label: "أقسام التوحيد", desc: "الربوبية والألوهية والأسماء والصفات" },
      { href: "/learn/nawaqid-islam", label: "نواقض الإسلام", desc: "مدخل منضبط مع ضوابط التكفير" },
      { href: "/arkan",       label: "أركان الإسلام",      desc: "الشهادتان والصلاة والزكاة..." },
      { href: "/arkan-iman",  label: "أركان الإيمان",      desc: "الإيمان بالله والملائكة..." },
      { href: "/asma-husna",  label: "الأسماء الحسنى",     desc: "٩٩ اسماً بمعانيها وآياتها" },
      { href: "/janna-naar",  label: "الجنة والنار",       desc: "صفة الجنة والنار من النصوص" },
      { href: "/alamat-saah", label: "علامات الساعة",      desc: "الصغرى والكبرى" },
      { href: "/malaika",     label: "الملائكة",           desc: "أسماؤهم ومهامهم" },
      { href: "/islamic-sects", label: "الفرق والمذاهب",    desc: "أهل السنة والفرق — عرض تاريخي" },
      { href: "/quran-knowledge", label: "القرآن وعلومه", desc: "فهرس وعلوم وأسباب وقصص" },
    ],
  },
  {
    title: "الفقه والأحكام",
    icon: "fiqh",
    links: [
      { href: "/fiqh",        label: "مدخل الفقه",          desc: "بوابة الفقه والأحكام" },
      { href: "/qa",          label: "الأسئلة والأجوبة",     desc: "أسئلة وأجوبة شرعية" },
      { href: "/rulings",     label: "الأحكام الشرعية",      desc: "موسوعة الأحكام" },
      { href: "/tahara",      label: "الطهارة",              desc: "الوضوء والغسل والتيمم" },
      { href: "/salah-guide", label: "الصلاة",               desc: "دليل الصلاة كاملاً" },
      { href: "/zakat",       label: "الزكاة",               desc: "أحكام الزكاة وحسابها" },
      { href: "/sawm",        label: "الصيام",               desc: "أحكام رمضان والنوافل" },
      { href: "/hajj",        label: "الحج والعمرة",         desc: "مناسك الحج والعمرة" },
      { href: "/janaza",      label: "الجنائز",              desc: "أحكام الجنائز والتعزية" },
      { href: "/jumuah",      label: "صلاة الجمعة",          desc: "حكمها وآدابها وخطبتها" },
      { href: "/riba",        label: "الربا",                desc: "أنواعه وحرمة الفائدة" },
      { href: "/nikah",       label: "النكاح",               desc: "أركان العقد وحقوق الزوجين" },
      { href: "/talaq",       label: "الطلاق والعدة",        desc: "أنواع الطلاق والخلع" },
      { href: "/udhiya",      label: "الأضحية",              desc: "شروطها ووقتها وآدابها" },
      { href: "/ruqya",       label: "الرقية الشرعية",       desc: "ضوابطها ومحاذير الشرك" },
      { href: "/waqf",        label: "الوقف",                desc: "التحبيس والصدقة الجارية" },
      { href: "/sadaqa",      label: "الصدقة",               desc: "فضلها وآداب الإنفاق" },
      { href: "/mawarith",    label: "المواريث",             desc: "حاسبة الفرائض" },
      { href: "/fiqh-qawaid", label: "القواعد الفقهية",      desc: "القواعد الخمس الكبرى" },
      { href: "/madhahib",       label: "المذاهب الأربعة",      desc: "الحنفي والمالكي والشافعي والحنبلي" },
      { href: "/fiqh-council", label: "المجمع الفقهي",       desc: "قرارات المجامع الفقهية" },
    ],
  },
  {
    title: "العبادة والأذكار",
    icon: "adhkar",
    links: [
      { href: "/adhkar",            label: "الأذكار والأدعية",    desc: "الصباح والمساء والنوم والأدعية المأثورة" },
      { href: "/tasbih",            label: "التسبيح",              desc: "عداد التسبيح الرقمي" },
      { href: "/sunan-yawmiyya",    label: "السنن اليومية",        desc: "السنن مع تتبع إتمامها" },
      { href: "/fadail-aamal",      label: "فضائل الأعمال",        desc: "أحاديث في الفضائل" },
      { href: "/prayer-times",      label: "مواقيت الصلاة",        desc: "أوقات الصلاة بموقعك" },
      { href: "/qibla",             label: "اتجاه القبلة",         desc: "البوصلة نحو مكة" },
      { href: "/tawba",             label: "التوبة والاستغفار",    desc: "فضل التوبة وأدعيتها" },
      { href: "/amr-bil-maruf",     label: "الأمر بالمعروف",       desc: "شروطه ومراتبه ومعرفة المعروف والمنكر" },
      { href: "/raqaiq",            label: "الرقائق والزهد",       desc: "تزكية النفس" },
      { href: "/sins-and-rights",   label: "الذنوب والحقوق",       desc: "التوبة وحقوق العباد" },
      { href: "/occasions-lessons", label: "المناسبات والدروس",    desc: "مناسبات وتقويم دروس" },
      { href: "/adab-talab-ilm",    label: "آداب طالب العلم",      desc: "شروط طلب العلم وآدابه" },
      { href: "/akhlaq",            label: "الأخلاق الإسلامية",    desc: "مكارم الأخلاق" },
    ],
  },
  {
    title: "السيرة والتاريخ",
    icon: "seerah",
    links: [
      { href: "/seerah",           label: "السيرة النبوية",       desc: "من المولد حتى الوفاة ﷺ" },
      { href: "/sahabah",          label: "الصحابة الكرام",       desc: "سِيَر الصحابة وفضائلهم" },
      { href: "/prophets",         label: "الأنبياء والرسل",      desc: "٢٥ نبياً مذكورًا بالاسم في القرآن، بقصصهم" },
      { href: "/stories",          label: "القصص الإسلامية",      desc: "قصص الصحابة والفتوحات والتاريخ الإسلامي" },
      { href: "/nations",          label: "الأمم السابقة",        desc: "أخبار الأقوام في القرآن والسنة" },
      { href: "/islamic-directory", label: "الدليل الإسلامي",     desc: "مؤسسات ومساجد ومشاهد" },
    ],
  },
  {
    title: "التعلّم والأدوات",
    icon: "learn",
    links: [
      { href: "/lessons",          label: "الدروس والمحاضرات",    desc: "دروس صوتية ومرئية" },
      { href: "/lessons?tab=courses", label: "الدورات العلمية",   desc: "برامج وكورسات ضمن جدول الدروس" },
      { href: "/kuwait-lessons",   label: "دروس الكويت",          desc: "دليل الدروس بالمساجد الكويتية" },
      { href: "/islamic-directory", label: "الدليل الإسلامي",      desc: "مؤسسات ومساجد ومشاهد" },
      { href: "/scholars",         label: "أعلام الإسلام",        desc: "تراجم العلماء" },
      { href: "/quiz",             label: "لعبة سين جيم – أسئلة وأجوبة",   desc: "اختبر معلوماتك من خلال لعبة أسئلة وأجوبة ممتعة ومتدرجة" },
      { href: "/my-learning",      label: "حسابي",                desc: "التقدم والبطاقات المراجعة" },
      { href: "/assistant",        label: "المساعد الذكي",        desc: "استفسر عن أي مسألة" },
                  { href: "/learning/paths",   label: "مسارات التعلم",        desc: "مسارات علمية منظمة بالمستويات" },
      { href: "/topics",           label: "الموضوعات الشرعية",    desc: "محتوى مجمّع حسب الموضوع" },
            { href: "/hikam-salaf",      label: "حكم السلف الصالح",     desc: "أقوال الأئمة والصحابة" },
      { href: "/fawaid",           label: "الفوائد العلمية",      desc: "فوائد ومنقولات موثقة" },
      { href: "/islamic-glossary", label: "المصطلحات الإسلامية",  desc: "معجم المصطلحات" },
      { href: "/occasions-lessons", label: "المناسبات والدروس",   desc: "مناسبات وتقويم دروس" },
          ],
  },
  {
    title: "الأدوات الشخصية",
    icon: "tools",
    links: [
      { href: "/my-citations",       label: "اقتباساتي",           desc: "اقتباساتك المحفوظة" },
      { href: "/my-submissions",     label: "مشاركاتي",            desc: "محتواك المُرسَل للمراجعة" },
      { href: "/submit",             label: "ارسل محتوى",          desc: "شارك معلومة أو فائدة" },
      { href: "/researcher-profile", label: "ملف الباحث",          desc: "ملفك الشخصي البحثي" },
      { href: "/transcribe",         label: "نسخ المحاضرات",       desc: "تحويل المحاضرات إلى نص" },
      { href: "/stats",              label: "إحصائياتي",           desc: "إحصائيات نشاطك" },
      { href: "/settings",           label: "الإعدادات",           desc: "إعدادات الحساب والتطبيق" },
    ],
  },
  {
    title: "المعلومات",
    icon: "info",
    links: [
      { href: "/about",    label: "من نحن",       desc: "رسالتنا وأهدافنا" },
      { href: "/methodology", label: "منهجنا العلمي",  desc: "منهج المراجعة والتوثيق" },
      { href: "/contact",  label: "تواصل معنا",      desc: "للملاحظات والاقتراحات" },
      { href: "/privacy",  label: "سياسة الخصوصية", desc: "كيف نحمي بياناتك" },
      { href: "/terms",    label: "الشروط والأحكام", desc: "شروط استخدام المنصة" },
            { href: "/kids",     label: "ركن الأطفال",     desc: "محتوى تعليمي ميسّر — قريبًا" },
    ],
  },
];

const VISIBLE_SECTIONS = SECTIONS.map((section) => ({
  ...section,
  links: filterNavItems(section.links),
})).filter((section) => section.links.length > 0);

export default function SiteMapPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/sitemap",
      title: "كل الأقسام | المجلس العلمي",
      description: "دليل شامل بجميع أقسام المجلس العلمي من قرآن وحديث وفقه وعقيدة وسيرة وأدوات التعلم.",
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "دليل أقسام المجلس العلمي", url: "https://www.majlisilm.com/sitemap", about: { "@type": "WebSite", name: "المجلس العلمي", url: "https://www.majlisilm.com" } }],
    });
  }, []);

  return (
    <div className="page-shell sm-page">
      {/* Hero */}
      <header className="sm-hero">
        <p className="sm-hero__eye">استكشف</p>
        <h1 className="sm-hero__title">كل الأقسام</h1>
        <p className="sm-hero__sub">دليل شامل بجميع أقسام ومحتويات المجلس العلمي</p>
      </header>

      <main className="sm-content">
        {VISIBLE_SECTIONS.map(({ title, icon, links }) => (
          <section key={title} className="sm-section">
            <h2 className="sm-section__title">
              <span aria-hidden="true"><SectionIcon name={icon} size={22} /></span>
              {title}
            </h2>
            <div className="sm-grid">
              {links.map(({ href, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className={`sm-card${isComingSoonPath(href) ? " sm-card--soon" : ""}`}
                  aria-label={isComingSoonPath(href) ? `${label}` : undefined}
                >
                  <strong className="sm-card__label">
                    {label}
                    {isComingSoonPath(href) ? <span className="nav-soon-badge">قريبًا</span> : null}
                  </strong>
                  <span className="sm-card__desc">{desc}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <div className="twh-share">
        <ShareButtons title="دليل أقسام المجلس العلمي" url="https://www.majlisilm.com/sitemap" />
      </div>
      <RelatedKnowledge kind="book" query="أقسام المجلس" title="مواد ومسارات للبدء" limit={6} />
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith", "fiqh", "aqeeda"]} title="اختبر معلوماتك في العلوم الإسلامية" count={4} />
      </div>
    </div>
  );
}
