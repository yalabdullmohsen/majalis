import { Link } from "wouter";
import {
  Layers, Circle, Star,
  ChevronLeft, BookMarked, BookOpen, Headphones, GraduationCap,
  Moon, Heart, Sparkles, Mic, History, CalendarCheck,
  type LucideIcon,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { useEffect } from "react";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { isComingSoonPath } from "@/lib/nav-visibility";
import "@/styles/pages/quran-hub.css";

type QuranSection = { href: string; title: string; desc: string; Icon: LucideIcon; accent: string; tag: string; featured?: boolean };

/* ── بيانات أقسام القرآن ──────────────────────────────────── */
const QURAN_SECTIONS: QuranSection[] = [
  {
    href: "/quran/memorization-plans",
    title: "خطط الحفظ والمراجعة",
    desc: "خطط مرنة من سنة إلى خمس سنوات، ومراجعة مكثفة وتثبيت، مع حفظ تقدمك محليًا؛ يُستفاد في التعلم والتدبر",
    Icon: CalendarCheck,
    accent: "#176B57",
    tag: "خطط مرنة",
  },
  {
    href: "/quran/recitation-test-ai",
    title: "اختبار التسميع بالذكاء الاصطناعي",
    desc: "سمّع من حفظك واستمع التطبيق لتلاوتك لحظيًا، ويكشف المصحف الآيات كلما نطقتها صحيحة؛ يُستفاد في التعلم والتدبر",
    Icon: Mic,
    accent: "#176B57",
    tag: "بالذكاء الاصطناعي",
    featured: true,
  },
  {
    href: "/mushaf",
    title: "المصحف الشريف",
    desc: "صفحات مصحف حقيقية مطابقة لتقسيم مصحف المدينة، مع الاستماع والإشارات المرجعية والملاحظات؛ يُستفاد في التعلم والتدبر",
    Icon: BookOpen,
    accent: "#143F35",
    tag: "٦٠٤ صفحة",
  },
  {
    href: "/quran/surahs",
    title: "فهرس السور",
    desc: "تصفّح السور الـ١١٤ كاملة: رقمها واسمها وعدد آياتها وتصنيفها، مع بحث ومفضلة؛ يُستفاد في التعلم والتدبر",
    Icon: BookMarked,
    accent: "#143F35",
    tag: "١١٤ سورة",
  },
  {
    href: "/quran/makki-madani",
    title: "المكي والمدني",
    desc: "ضوابط التمييز بين المكي والمدني وخصائص كل منهما مع فهرست السور؛ يُستفاد في التعلم والتدبر",
    Icon: History,
    accent: "#143F35",
    tag: "علوم",
  },
  {
    href: "/quran/revelation-order",
    title: "ترتيب نزول القرآن",
    desc: "خريطة زمنية للسور الـ١١٤ حسب تسلسل نزولها التاريخي الفعلي، لا حسب ترقيم المصحف؛ يُستفاد في التعلم والتدبر",
    Icon: CalendarCheck,
    accent: "#143F35",
    tag: "١١٤ سورة",
  },
  {
    href: "/quran/surah-stories",
    title: "قصص القرآن",
    desc: "أسباب النزول ومحاور ١١٤ سورة قرآنية مع العبر والفوائد؛ يُستفاد في التعلم والتدبر",
    Icon: BookMarked,
    accent: "#143F35",
    tag: "١١٤ سورة",
  },
  {
    href: "/quran/tajweed",
    title: "علم التجويد",
    desc: "أحكام التجويد الشاملة مصنَّفة في ستة أبواب رئيسية؛ يُستفاد في التعلم والتدبر",
    Icon: GraduationCap,
    accent: "#143F35",
    tag: "١٤ حكماً",
  },
  {
    href: "/quran-circles",
    title: "حلقات القرآن",
    desc: "دليل حلقات الحفظ والمراجعة — قيد التجهيز؛ يُستفاد في التعلم والتدبر",
    Icon: Circle,
    accent: "#143F35",
    tag: "قريبًا",
  },
  {
    href: "/daily-wird",
    title: "الورد اليومي",
    desc: "تتبع ورد قراءة القرآن اليومي مع السلسلة المتواصلة؛ يُستفاد في التعلم والتدبر",
    Icon: Moon,
    accent: "#143F35",
    tag: "يومي",
  },
  {
    href: "/adhkar",
    title: "الأذكار الشرعية",
    desc: "أذكار الصباح والمساء والنوم وغيرها والتخريج من الصحيح؛ يُستفاد في التعلم والتدبر",
    Icon: Sparkles,
    accent: "#143F35",
    tag: "أذكار",
  },
  {
    href: "/ulum-quran",
    title: "علوم القرآن",
    desc: "النزول والجمع والتفسير والإعجاز البياني والتشريعي والغيبي — بلا إعجاز عددي؛ يُستفاد في التعلم والتدبر",
    Icon: Layers,
    accent: "#143F35",
    tag: "علم",
  },
  {
    href: "/duas-quran",
    title: "أدعية القرآن الكريم",
    desc: "٣٠+ دعاءً قرآنياً مصنَّفاً بحسب النبي والمناسبة والفائدة؛ يُستفاد في التعلم والتدبر",
    Icon: Star,
    accent: "#143F35",
    tag: "دعاء",
  },
];

function qhcAccentMod(a: string) {
  if (a === "#143F35") return "qhc-accent--deep";
  return "qhc-accent--base";
}

/* ── إحصائيات سريعة ───────────────────────────────────────── */
const STATS = [
  { label: "سورة", value: "١١٤" },
  { label: "آية", value: "٦٢٣٦" },
  { label: "صفحة", value: "٦٠٤" },
  { label: "جزء", value: "٣٠" },
];

/* ── مميزات خاصة ─────────────────────────────────────────── */
const FEATURES = [
  { Icon: Layers,        text: "تصفح جميع السور مع ترتيب صفحاتها؛ من علوم القرآن الكريم وأدواته؛ يُستفاد في التعلم والتدبر — مرجع المجلس العلمي — مرجع تربوي معتمد في منهج المجلس العلمي. — مرجع تربوي مع" },
  { Icon: Headphones,    text: "تلاوة وإذاعات القرآن بجودة عالية؛ من علوم القرآن الكريم وأدواته؛ يُستفاد في التعلم والتدبر — مرجع المجلس العلمي — مرجع تربوي معتمد في منهج المجلس العلمي. — مرجع تربوي مع" },
  { Icon: Star,          text: "أسباب النزول والتفسير الميسَّر؛ من علوم القرآن الكريم وأدواته؛ يُستفاد في التعلم والتدبر — مرجع المجلس العلمي — مرجع تربوي معتمد في منهج المجلس العلمي. — مرجع تربوي معتم" },
  { Icon: Heart,         text: "احفظ آياتك المفضلة وتتبع وردك اليومي؛ من علوم القرآن الكريم وأدواته؛ يُستفاد في التعلم والتدبر — مرجع المجلس العلمي — مرجع تربوي معتمد في منهج المجلس العلمي. — مرجع تربو" },
  { Icon: GraduationCap, text: "تعلَّم أحكام التجويد خطوةً بخطوة؛ من علوم القرآن الكريم وأدواته؛ يُستفاد في التعلم والتدبر — مرجع المجلس العلمي — مرجع تربوي معتمد في منهج المجلس العلمي. — مرجع تربوي مع" },
  { Icon: BookMarked,    text: "استكشف قصص القرآن وعبر السور؛ من علوم القرآن الكريم وأدواته؛ يُستفاد في التعلم والتدبر — مرجع المجلس العلمي — مرجع تربوي معتمد في منهج المجلس العلمي. — مرجع تربوي معتمد " },
];

export default function QuranHubPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub",
      title: "مركز القرآن الكريم | المجلس العلمي",
      description: "مركز القرآن الكريم الشامل: تجويد، قصص السور، حلقات، وأكثر. يُستفاد في التعلم والتدبر",
      keywords: ["القرآن الكريم", "تجويد", "قصص القرآن", "حلقات القرآن"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام مركز القرآن الكريم",
          description: "خدمات القرآن الكريم في المجلس العلمي؛ يُستفاد في التعلم والتدبر",
          numberOfItems: QURAN_SECTIONS.length,
          itemListElement: QURAN_SECTIONS.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.title,
            description: s.desc,
            url: `https://www.majlisilm.com${s.href}`,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="quran-hub-page" dir="rtl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="quran-hub-hero">
        <div className="quran-hub-hero__ornament" aria-hidden="true">﴿ اقْرَأْ بِاسْمِ رَبِّكَ ﴾</div>
        <h1 className="quran-hub-hero__title">القرآن الكريم</h1>
        <p className="quran-hub-hero__sub">
          كتاب الله العزيز، اقرأ، استمع، تعلّم، وتدبَّر
        </p>

        {/* إحصائيات */}
        <div className="quran-hub-stats">
          {STATS.map(s => (
            <div key={s.label} className="quran-hub-stat">
              <span className="quran-hub-stat__val">{s.value}</span>
              <span className="quran-hub-stat__lbl">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── أقسام القرآن ─────────────────────────────────────── */}
      <section className="quran-hub-sections">
        <h2 className="quran-hub-sections__title">أقسام القرآن</h2>
        <div className="quran-hub-grid">
          {QURAN_SECTIONS.map(s => {
            const soon = isComingSoonPath(s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`quran-hub-card${s.featured ? " quran-hub-card--featured" : ""}${soon ? " quran-hub-card--soon" : ""}`}
                aria-label={soon ? `${s.title} — قريبًا` : undefined}
              >
                <div className={`quran-hub-card__header ${qhcAccentMod(s.accent)}`}>
                  <s.Icon size={28} className="quran-hub-card__icon" />
                  <span className="quran-hub-card__tag">{soon ? "قريبًا" : s.tag}</span>
                </div>
                <div className="quran-hub-card__body">
                  <h3 className="quran-hub-card__title">
                    {s.title}
                    {soon ? <span className="nav-soon-badge">قريبًا</span> : null}
                  </h3>
                  <p className="quran-hub-card__desc">{s.desc}</p>
                  <span className="quran-hub-card__link">
                    {soon ? "معاينة" : "استكشف"} <ChevronLeft size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── مميزات ────────────────────────────────────────────── */}
      <section className="quran-hub-features">
        <h2 className="quran-hub-features__title">ماذا يقدّم المجلس العلمي للقرآن؟</h2>
        <div className="quran-hub-features__list">
          {FEATURES.map((f, i) => (
            <div key={i} className="quran-hub-feature-item">
              <f.Icon size={22} className="quran-hub-feature-item__icon" />
              <span className="quran-hub-feature-item__text">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── آية الختام ──────────────────────────────────────────── */}
      <section className="quran-hub-closing">
        <p className="quran-hub-closing__ayah">
          ﴿ إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾
        </p>
        <span className="quran-hub-closing__ref">الإسراء: ٩</span>
      </section>

      <SectionQuiz
        categoryId="quran"
        title="اختبر معلوماتك في القرآن الكريم"
        count={4}
      />

      <div className="twh-share">
        <ShareButtons title="مركز القرآن الكريم — المجلس العلمي" url="https://www.majlisilm.com/quran-hub" />
      </div>
    </div>
  );
}
