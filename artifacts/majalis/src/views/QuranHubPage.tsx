import { Link } from "wouter";
import {
  Radio, Mic2, Layers, Circle, Star,
  ChevronLeft, BookMarked, BookOpen, Headphones, GraduationCap,
  Moon, Heart, Sparkles, Mic,
  type LucideIcon,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { useEffect } from "react";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

type QuranSection = { href: string; title: string; desc: string; Icon: LucideIcon; accent: string; tag: string; featured?: boolean };

/* ── بيانات أقسام القرآن ──────────────────────────────────── */
const QURAN_SECTIONS: QuranSection[] = [
  {
    href: "/quran/recitation-test-ai",
    title: "اختبار التسميع بالذكاء الاصطناعي",
    desc: "سمّع من حفظك واستمع التطبيق لتلاوتك لحظيًا، ويكشف المصحف الآيات كلما نطقتها صحيحة",
    Icon: Mic,
    accent: "#176B57",
    tag: "بالذكاء الاصطناعي",
    featured: true,
  },
  {
    href: "/mushaf",
    title: "المصحف الشريف",
    desc: "اقرأ القرآن الكريم كاملاً سورة سورة، مع الاستماع لكل آية ومشاركتها",
    Icon: BookOpen,
    accent: "#176B57",
    tag: "٦٠٤ صفحة",
  },
  {
    href: "/mushaf/page",
    title: "المصحف بنظام الصفحات",
    desc: "صفحات مصحف حقيقية مطابقة لتقسيم مصحف المدينة، مع إطارات وأوضاع قراءة وإشارات مرجعية وملاحظات",
    Icon: Layers,
    accent: "#176B57",
    tag: "جديد",
  },
  {
    href: "/quran/surah-stories",
    title: "قصص القرآن",
    desc: "أسباب النزول ومحاور ١١٤ سورة قرآنية مع العبر والفوائد",
    Icon: BookMarked,
    accent: "#176B57",
    tag: "١١٤ سورة",
  },
  {
    href: "/quran/tajweed",
    title: "علم التجويد",
    desc: "أحكام التجويد الشاملة مصنَّفة في ستة أبواب رئيسية",
    Icon: GraduationCap,
    accent: "#176B57",
    tag: "١٤ حكماً",
  },
  {
    href: "/quran-radio",
    title: "إذاعات القرآن",
    desc: "استمع للقرآن الكريم من كبار القراء حول العالم",
    Icon: Radio,
    accent: "#123F36",
    tag: "مباشر",
  },
  {
    href: "/quran-live",
    title: "البث المباشر",
    desc: "بث مباشر من الحرمين الشريفين، مكة المكرمة والمدينة المنورة",
    Icon: Mic2,
    accent: "#176B57",
    tag: "٢٤ ساعة",
  },
  {
    href: "/quran-circles",
    title: "حلقات القرآن",
    desc: "انضم لحلقات الحفظ والمراجعة وتلاوة القرآن الكريم",
    Icon: Circle,
    accent: "#176B57",
    tag: "مجتمع",
  },
  {
    href: "/daily-wird",
    title: "الورد اليومي",
    desc: "تتبع ورد قراءة القرآن اليومي مع السلسلة المتواصلة",
    Icon: Moon,
    accent: "#123F36",
    tag: "يومي",
  },
  {
    href: "/adhkar",
    title: "أذكار القرآن",
    desc: "أذكار وأدعية مستمدة من القرآن الكريم والسنة النبوية",
    Icon: Sparkles,
    accent: "#176B57",
    tag: "أذكار",
  },
  {
    href: "/ulum-quran",
    title: "علوم القرآن",
    desc: "النزول والجمع والتدوين والتفسير وطبقات المفسِّرين عبر القرون",
    Icon: Layers,
    accent: "#123F36",
    tag: "علم",
  },
  {
    href: "/duas-quran",
    title: "أدعية القرآن الكريم",
    desc: "٣٠+ دعاءً قرآنياً مصنَّفاً بحسب النبي والمناسبة والفائدة",
    Icon: Star,
    accent: "#176B57",
    tag: "دعاء",
  },
  {
    href: "/miracles",
    title: "إعجاز القرآن ومعجزاته",
    desc: "المعجزات النبوية والإعجاز العلمي والبياني في القرآن الكريم",
    Icon: Heart,
    accent: "#176B57",
    tag: "إعجاز",
  },
];

function qhcAccentMod(a: string) {
  if (a === "#123F36") return "qhc-accent--deep";
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
  { Icon: Layers,        text: "تصفح جميع السور مع ترتيب صفحاتها" },
  { Icon: Headphones,    text: "تلاوة وإذاعات القرآن بجودة عالية" },
  { Icon: Star,          text: "أسباب النزول والتفسير الميسَّر" },
  { Icon: Heart,         text: "احفظ آياتك المفضلة وتتبع وردك اليومي" },
  { Icon: GraduationCap, text: "تعلَّم أحكام التجويد خطوةً بخطوة" },
  { Icon: BookMarked,    text: "استكشف قصص القرآن وعبر السور" },
];

export default function QuranHubPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub",
      title: "مركز القرآن الكريم | المجلس العلمي",
      description: "مركز القرآن الكريم الشامل: تجويد، قصص السور، إذاعات قرآنية، حلقات، وأكثر.",
      keywords: ["القرآن الكريم", "تجويد", "قصص القرآن", "إذاعة قرآنية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام مركز القرآن الكريم",
          description: "خدمات القرآن الكريم في المجلس العلمي",
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
          {QURAN_SECTIONS.map(s => (
            <Link key={s.href} href={s.href} className={`quran-hub-card ${s.featured ? "quran-hub-card--featured" : ""}`}>
              <div className={`quran-hub-card__header ${qhcAccentMod(s.accent)}`}>
                <s.Icon size={28} className="quran-hub-card__icon" />
                <span className="quran-hub-card__tag">{s.tag}</span>
              </div>
              <div className="quran-hub-card__body">
                <h3 className="quran-hub-card__title">{s.title}</h3>
                <p className="quran-hub-card__desc">{s.desc}</p>
                <span className="quran-hub-card__link">
                  استكشف <ChevronLeft size={14} />
                </span>
              </div>
            </Link>
          ))}
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
