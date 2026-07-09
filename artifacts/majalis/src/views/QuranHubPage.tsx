import { Link } from "wouter";
import {
  BookOpen, Radio, Mic2, Layers, Circle, Star,
  ChevronLeft, BookMarked, Headphones, GraduationCap,
  Moon, Heart, Sparkles,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { useEffect } from "react";

/* ── بيانات أقسام القرآن ──────────────────────────────────── */
const QURAN_SECTIONS = [
  {
    href: "/quran",
    title: "المصحف الشريف",
    desc: "اقرأ المصحف صفحةً بصفحة — ٦٠٤ صفحة بصورة واضحة",
    Icon: BookOpen,
    accent: "#0A5040",
    tag: "الأكثر زيارةً",
  },
  {
    href: "/quran/surah-stories",
    title: "قصص القرآن",
    desc: "أسباب النزول ومحاور ١١٤ سورة قرآنية مع العبر والفوائد",
    Icon: BookMarked,
    accent: "#1F4D3A",
    tag: "١١٤ سورة",
  },
  {
    href: "/quran/tajweed",
    title: "علم التجويد",
    desc: "أحكام التجويد الشاملة مصنَّفة في ستة أبواب رئيسية",
    Icon: GraduationCap,
    accent: "#145C46",
    tag: "١٤ حكماً",
  },
  {
    href: "/quran-radio",
    title: "إذاعات القرآن",
    desc: "استمع للقرآن الكريم من كبار القراء حول العالم",
    Icon: Radio,
    accent: "#0A5040",
    tag: "مباشر",
  },
  {
    href: "/quran-live",
    title: "البث المباشر",
    desc: "بث مباشر من الحرمين الشريفين — مكة المكرمة والمدينة المنورة",
    Icon: Mic2,
    accent: "#1F4D3A",
    tag: "٢٤ ساعة",
  },
  {
    href: "/quran-circles",
    title: "حلقات القرآن",
    desc: "انضم لحلقات الحفظ والمراجعة وتلاوة القرآن الكريم",
    Icon: Circle,
    accent: "#145C46",
    tag: "مجتمع",
  },
  {
    href: "/daily-wird",
    title: "الورد اليومي",
    desc: "تتبع ورد قراءة القرآن اليومي مع السلسلة المتواصلة",
    Icon: Moon,
    accent: "#0A5040",
    tag: "يومي",
  },
  {
    href: "/adhkar",
    title: "أذكار القرآن",
    desc: "أذكار وأدعية مستمدة من القرآن الكريم والسنة النبوية",
    Icon: Sparkles,
    accent: "#1F4D3A",
    tag: "أذكار",
  },
];

/* ── إحصائيات سريعة ───────────────────────────────────────── */
const STATS = [
  { label: "سورة", value: "١١٤" },
  { label: "آية", value: "٦٢٣٦" },
  { label: "صفحة", value: "٦٠٤" },
  { label: "جزء", value: "٣٠" },
];

/* ── مميزات خاصة ─────────────────────────────────────────── */
const FEATURES = [
  { Icon: Layers,     text: "تصفح جميع السور مع ترتيب صفحاتها" },
  { Icon: Headphones, text: "تلاوة وإذاعات القرآن بجودة عالية" },
  { Icon: Star,       text: "أسباب النزول والتفسير الميسَّر" },
  { Icon: Heart,      text: "احفظ آياتك المفضلة وتتبع وردك اليومي" },
];

export default function QuranHubPage() {
  useEffect(() => {
    applyPageSeo({ path: "/quran-hub", title: "مركز القرآن الكريم | مجالس", description: "مركز القرآن الكريم — مصحف، تجويد، قصص، إذاعات وأكثر" });
  }, []);

  return (
    <div className="quran-hub-page" dir="rtl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="quran-hub-hero">
        <div className="quran-hub-hero__ornament" aria-hidden="true">﴿ اقْرَأْ بِاسْمِ رَبِّكَ ﴾</div>
        <h1 className="quran-hub-hero__title">القرآن الكريم</h1>
        <p className="quran-hub-hero__sub">
          كتاب الله العزيز — اقرأ، استمع، تعلّم، وتدبَّر
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

        {/* زر رئيسي */}
        <Link href="/quran" className="quran-hub-cta">
          <BookOpen size={20} />
          افتح المصحف الشريف
          <ChevronLeft size={16} />
        </Link>
      </section>

      {/* ── أقسام القرآن ─────────────────────────────────────── */}
      <section className="quran-hub-sections">
        <h2 className="quran-hub-sections__title">أقسام القرآن</h2>
        <div className="quran-hub-grid">
          {QURAN_SECTIONS.map(s => (
            <Link key={s.href} href={s.href} className="quran-hub-card">
              <div className="quran-hub-card__header" style={{ "--qhc-accent": s.accent } as { [k: string]: string }}>
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
        <h2 className="quran-hub-features__title">ماذا يقدم مجالس للقرآن؟</h2>
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
    </div>
  );
}
