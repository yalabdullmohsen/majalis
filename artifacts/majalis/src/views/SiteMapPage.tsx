import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

const SECTIONS = [
  {
    title: "القرآن الكريم",
    emoji: "📖",
    links: [
      { href: "/quran-hub",          label: "مركز القرآن",        desc: "بوابة كل ما يتعلق بالقرآن" },
      { href: "/daily-wird",         label: "الورد اليومي",       desc: "ختمة متجددة يومياً" },
      { href: "/quran/tajweed",      label: "علم التجويد",        desc: "أحكام التجويد بالأمثلة" },
      { href: "/ulum-quran",         label: "علوم القرآن",        desc: "التفسير والناسخ والمنسوخ" },
      { href: "/quran/surah-stories", label: "قصص السور",         desc: "أسباب النزول" },
      { href: "/mutashabihat",       label: "المتشابهات القرآنية", desc: "الآيات المتشابهة لفظاً" },
      { href: "/duas-quran",         label: "أدعية القرآن",       desc: "الأدعية القرآنية المختارة" },
      { href: "/quran-radio",        label: "إذاعة القرآن",       desc: "استماع مباشر" },
      { href: "/quran-live",         label: "بث قرآني مباشر",     desc: "متابعة تلاوات مباشرة" },
      { href: "/quran-memorization", label: "حفظ القرآن",         desc: "أدوات مساعدة على الحفظ" },
      { href: "/quran-circles",      label: "حلقات التحفيظ",      desc: "دليل حلقات القرآن" },
      { href: "/muezzins",           label: "مكتبة القراء",       desc: "مقاطع صوتية للقراء" },
    ],
  },
  {
    title: "الحديث والسنة",
    emoji: "📜",
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
    emoji: "🕌",
    links: [
      { href: "/tawhid",      label: "التوحيد والعقيدة",   desc: "أنواع التوحيد ومسائل العقيدة" },
      { href: "/arkan",       label: "أركان الإسلام",      desc: "الشهادتان والصلاة والزكاة..." },
      { href: "/arkan-iman",  label: "أركان الإيمان",      desc: "الإيمان بالله والملائكة..." },
      { href: "/asma-husna",  label: "الأسماء الحسنى",     desc: "٩٩ اسماً بمعانيها وآياتها" },
      { href: "/janna-naar",  label: "الجنة والنار",       desc: "صفة الجنة والنار من النصوص" },
      { href: "/alamat-saah", label: "علامات الساعة",      desc: "الصغرى والكبرى" },
      { href: "/malaika",     label: "الملائكة",           desc: "أسماؤهم ومهامهم" },
      { href: "/miracles",    label: "الإعجاز العلمي",     desc: "إعجاز القرآن والكون" },
    ],
  },
  {
    title: "الفقه والأحكام",
    emoji: "⚖️",
    links: [
      { href: "/fiqh",        label: "مدخل الفقه",          desc: "بوابة الفقه والفتاوى" },
      { href: "/tahara",      label: "الطهارة",              desc: "الوضوء والغسل والتيمم" },
      { href: "/salah-guide", label: "الصلاة",               desc: "دليل الصلاة كاملاً" },
      { href: "/zakat",       label: "الزكاة",               desc: "أحكام الزكاة وحسابها" },
      { href: "/sawm",        label: "الصيام",               desc: "أحكام رمضان والنوافل" },
      { href: "/hajj",        label: "الحج والعمرة",         desc: "مناسك الحج والعمرة" },
      { href: "/janaza",      label: "الجنائز",              desc: "أحكام الجنائز والتعزية" },
      { href: "/mawarith",    label: "المواريث",             desc: "حاسبة الفرائض" },
      { href: "/fiqh-qawaid", label: "القواعد الفقهية",      desc: "القواعد الخمس الكبرى" },
      { href: "/madhahib",       label: "المذاهب الأربعة",      desc: "الحنفي والمالكي والشافعي والحنبلي" },
      { href: "/islamic-sects",  label: "الفرق الإسلامية",      desc: "نشأة الفرق وعقائدها وانتشارها" },
      { href: "/qa",          label: "الأسئلة والأجوبة",     desc: "أسئلة وأجوبة شرعية" },
      { href: "/fatwa",       label: "الفتاوى",              desc: "فتاوى مُحقَّقة" },
      { href: "/rulings",     label: "الأحكام الشرعية",      desc: "موسوعة الأحكام" },
      { href: "/fiqh-council", label: "المجمع الفقهي",       desc: "قرارات المجامع الفقهية" },
    ],
  },
  {
    title: "العبادة والأذكار",
    emoji: "🤲",
    links: [
      { href: "/adhkar",            label: "الأذكار",              desc: "الصباح والمساء والنوم" },
      { href: "/duas",              label: "الأدعية الشرعية",      desc: "أدعية مصنفة" },
      { href: "/tasbih",            label: "التسبيح",              desc: "عداد التسبيح الرقمي" },
      { href: "/sunan-yawmiyya",    label: "السنن اليومية",        desc: "السنن مع تتبع إتمامها" },
      { href: "/prayer-ranks",      label: "فضائل الصلاة",         desc: "أحاديث وآيات فضل الصلاة" },
      { href: "/fadail-aamal",      label: "فضائل الأعمال",        desc: "أحاديث في الفضائل" },
      { href: "/prayer-times",      label: "مواقيت الصلاة",        desc: "أوقات الصلاة بموقعك" },
      { href: "/prayer-countdown",  label: "عداد الصلاة",          desc: "الوقت المتبقي حتى الصلاة التالية" },
      { href: "/qibla",             label: "اتجاه القبلة",         desc: "البوصلة نحو مكة" },
      { href: "/tawba",             label: "التوبة والاستغفار",    desc: "فضل التوبة وأدعيتها" },
      { href: "/amr-bil-maruf",     label: "الأمر بالمعروف",       desc: "شروطه ومراتبه ومعرفة المعروف والمنكر" },
      { href: "/raqaiq",            label: "الرقائق والزهد",       desc: "تزكية النفس" },
      { href: "/sins-and-rights",   label: "الذنوب والحقوق",       desc: "التوبة وحقوق العباد" },
      { href: "/occasions",         label: "المناسبات الإسلامية",  desc: "أذكار المناسبات" },
      { href: "/adab-talab-ilm",    label: "آداب طالب العلم",      desc: "شروط طلب العلم وآدابه" },
      { href: "/akhlaq",            label: "الأخلاق الإسلامية",    desc: "مكارم الأخلاق" },
    ],
  },
  {
    title: "السيرة والتاريخ",
    emoji: "🌙",
    links: [
      { href: "/seerah",           label: "السيرة النبوية",       desc: "من المولد حتى الوفاة ﷺ" },
      { href: "/sahabah",          label: "الصحابة الكرام",       desc: "سِيَر الصحابة وفضائلهم" },
      { href: "/prophets",         label: "الأنبياء والرسل",      desc: "٢٥ نبياً بقصصهم" },
      { href: "/anbiya",           label: "قصص الأنبياء",         desc: "عرض تفاعلي بقصص وعبر" },
      { href: "/islamic-landmarks", label: "المعالم الإسلامية",   desc: "معالم ومواقع تاريخية إسلامية" },
      { href: "/stories",          label: "القصص الإسلامية",      desc: "قصص إسلامية معبِّرة" },
      { href: "/islamic-stories",  label: "صحابة وفتوحات",        desc: "قصص الصحابة والفتوحات" },
    ],
  },
  {
    title: "التعلّم والمكتبة",
    emoji: "🎓",
    links: [
      { href: "/lessons",          label: "الدروس والمحاضرات",    desc: "دروس صوتية ومرئية" },
      { href: "/kuwait-lessons",   label: "دروس الكويت",          desc: "دليل الدروس بالمساجد الكويتية" },
      { href: "/annual-courses",   label: "الدورات العلمية",      desc: "برامج وكورسات منظمة" },
      { href: "/library",          label: "المكتبة الشرعية",      desc: "كتب ومخطوطات إسلامية" },
      { href: "/scholars",         label: "أعلام الإسلام",        desc: "تراجم العلماء" },
      { href: "/quiz",             label: "المسابقة التعليمية",   desc: "اختبر معلوماتك" },
      { href: "/flashcards",       label: "بطاقات المراجعة",      desc: "مراجعة ذكية" },
      { href: "/assistant",        label: "المساعد الذكي",        desc: "استفسر عن أي مسألة" },
      { href: "/learning-path",    label: "خارطة طالب العلم",    desc: "منهج التعلم التراكمي" },
      { href: "/learning-plan",    label: "خطتي التعليمية",      desc: "خطة تعلم شخصية" },
      { href: "/my-learning",      label: "لوحتي التعليمية",     desc: "إحصائياتك وتقدمك" },
      { href: "/knowledge-graph",  label: "شبكة المعرفة",        desc: "العلاقات بين المفاهيم" },
      { href: "/knowledge-map",    label: "خريطة المعرفة",        desc: "تخطيط المعرفة الإسلامية" },
      { href: "/mind-map",         label: "الخرائط الذهنية",      desc: "تنظيم المعلومات مرئياً" },
      { href: "/learning/paths",   label: "مسارات التعلم",        desc: "مسارات علمية منظمة بالمستويات" },
      { href: "/scholarly-research", label: "الباحث الشرعي",      desc: "بحث بالذكاء الاصطناعي" },
      { href: "/topics",           label: "الموضوعات الشرعية",    desc: "محتوى مجمّع حسب الموضوع" },
      { href: "/start-here",       label: "ابدأ من هنا",          desc: "دليل طالب العلم المبتدئ" },
      { href: "/calendar",         label: "التقويم الهجري",      desc: "التقويم والمناسبات" },
      { href: "/hikam-salaf",      label: "حكم السلف الصالح",     desc: "أقوال الأئمة والصحابة" },
      { href: "/fawaid",           label: "الفوائد العلمية",      desc: "فوائد ومنقولات موثقة" },
      { href: "/islamic-glossary", label: "المصطلحات الإسلامية",  desc: "معجم المصطلحات" },
      { href: "/universities",     label: "دليل الجامعات",        desc: "الجامعات الإسلامية" },
      { href: "/academic-research",label: "البحث الأكاديمي",      desc: "موارد البحث العلمي الشرعي" },
      { href: "/institutions",     label: "المؤسسات الإسلامية",   desc: "المراكز والمجامع العلمية" },
      { href: "/islam-stats",      label: "إحصائيات الإسلام",     desc: "أرقام وحقائق عن الإسلام" },
    ],
  },
  {
    title: "الأدوات الشخصية",
    emoji: "⚙️",
    links: [
      { href: "/my-citations",       label: "اقتباساتي",           desc: "اقتباساتك المحفوظة" },
      { href: "/vault",              label: "خزانتي",              desc: "المحفوظات الشخصية" },
      { href: "/family",             label: "وضع العائلة",         desc: "متابعة تعلم أفراد الأسرة" },
      { href: "/my-submissions",     label: "مشاركاتي",            desc: "محتواك المُرسَل للمراجعة" },
      { href: "/submit",             label: "ارسل محتوى",          desc: "شارك معلومة أو فائدة" },
      { href: "/researcher-profile", label: "ملف الباحث",          desc: "ملفك الشخصي البحثي" },
      { href: "/study-room",         label: "غرفة الدراسة",        desc: "بيئة مراجعة منظمة" },
      { href: "/transcribe",         label: "نسخ المحاضرات",       desc: "تحويل المحاضرات إلى نص" },
      { href: "/cards",              label: "البطاقات الدعوية",    desc: "صانع البطاقات الإسلامية" },
      { href: "/stats",              label: "إحصائياتي",           desc: "إحصائيات نشاطك" },
      { href: "/settings",           label: "الإعدادات",           desc: "إعدادات الحساب والتطبيق" },
    ],
  },
  {
    title: "المعلومات",
    emoji: "ℹ️",
    links: [
      { href: "/about",    label: "عن المجلس",       desc: "رسالتنا وأهدافنا" },
      { href: "/methodology", label: "منهجنا العلمي",  desc: "منهج المراجعة والتوثيق" },
      { href: "/contact",  label: "تواصل معنا",      desc: "للملاحظات والاقتراحات" },
      { href: "/privacy",  label: "سياسة الخصوصية", desc: "كيف نحمي بياناتك" },
      { href: "/terms",    label: "الشروط والأحكام", desc: "شروط استخدام المنصة" },
      { href: "/features-in-progress", label: "المميزات القادمة", desc: "خارطة الطريق" },
      { href: "/updates",  label: "آخر التحديثات",   desc: "مستجدات المنصة" },
    ],
  },
];

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
        {SECTIONS.map(({ title, emoji, links }) => (
          <section key={title} className="sm-section">
            <h2 className="sm-section__title">
              <span aria-hidden="true"><SectionIcon name={emoji} size={22} /></span>
              {title}
            </h2>
            <div className="sm-grid">
              {links.map(({ href, label, desc }) => (
                <Link key={href} href={href} className="sm-card">
                  <strong className="sm-card__label">{label}</strong>
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
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith", "fiqh", "aqeeda"]} title="اختبر معلوماتك في العلوم الإسلامية" count={4} />
      </div>
    </div>
  );
}
