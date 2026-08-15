import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Layers, Circle, Star,
  BookMarked, BookOpen, Headphones, GraduationCap,
  Moon, Heart, Sparkles, Mic, History, CalendarCheck, Search, Users,
  type LucideIcon,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { isComingSoonPath } from "@/lib/nav-visibility";
import { HubCard } from "@/components/ui/HubCard";
import { PageHero } from "@/components/ui/PageHero";
import { QuranSurahJumpSearch } from "@/components/quran/QuranSurahJumpSearch";
import "@/styles/pages/quran-hub.css";
import "@/styles/pages/misc-page-legacy.css";

import { SITE_URL } from "@/lib/site-config";
type QuranSection = { href: string; title: string; desc: string; Icon: LucideIcon; tag: string; featured?: boolean };

/* ── بيانات أقسام القرآن ──────────────────────────────────── */
const QURAN_SECTIONS: QuranSection[] = [
  {
    href: "/quran/memorization-plans",
    title: "خطط الحفظ والمراجعة",
    desc: "خطط مرنة من سنة إلى خمس سنوات، ومراجعة مكثفة وتثبيت، مع حفظ تقدمك محليًا؛ يُستفاد في التعلم والتدبر",
    Icon: CalendarCheck,
    tag: "خطط مرنة",
  },
  {
    href: "/mushaf",
    title: "المصحف الجديد",
    desc: "المصحف الجديد قيد التطوير — بيانات القرآن محفوظة وستُعرض بتصميم مختلف بالكامل قريبًا",
    Icon: BookOpen,
    tag: "قيد التطوير",
    featured: true,
  },
  {
    href: "/quran/recitation-test-ai",
    title: "التسميع",
    desc: "اختبر حفظك وتلاوتك؛ يستمع التطبيق لحظيًا ويكشف المصحف الآيات كلما نطقتها صحيحة؛ يُستفاد في التعلم والتدبر",
    Icon: Mic,
    tag: "تسميع",
    featured: true,
  },
  {
    href: "/quran/search",
    title: "بحث في الآيات",
    desc: "شاشة بحث منفصلة في نص القرآن الكريم — ابحث بكلمة أو جملة وانتقل مباشرة إلى موضع الآية في المصحف؛ يُستفاد في التعلم والتدبر",
    Icon: Search,
    tag: "بحث",
  },
  {
    href: "/quran/people",
    title: "الذين ذكروا في القرآن",
    desc: "من ذُكروا بأسمائهم في القرآن مع مواضع الآيات والربط بقصص الأنبياء — بلا إسرائيليات غير محرَّرة",
    Icon: Users,
    tag: "أسماء",
  },
  {
    href: "/quran/surahs",
    title: "فهرس السور",
    desc: "تصفّح السور الـ١١٤ كاملة: رقمها واسمها وعدد آياتها وتصنيفها، مع بحث ومفضلة؛ يُستفاد في التعلم والتدبر",
    Icon: BookMarked,
    tag: "١١٤ سورة",
  },
  {
    href: "/quran/makki-madani",
    title: "المكي والمدني",
    desc: "ضوابط التمييز بين المكي والمدني وخصائص كل منهما مع فهرست السور؛ يُستفاد في التعلم والتدبر",
    Icon: History,
    tag: "علوم",
  },
  {
    href: "/quran/revelation-order",
    title: "ترتيب نزول القرآن",
    desc: "خريطة زمنية للسور الـ١١٤ حسب تسلسل نزولها التاريخي الفعلي، لا حسب ترقيم المصحف؛ يُستفاد في التعلم والتدبر",
    Icon: CalendarCheck,
    tag: "١١٤ سورة",
  },
  {
    href: "/quran/surah-stories",
    title: "قصص القرآن",
    desc: "أسباب النزول ومحاور ١١٤ سورة قرآنية مع العبر والفوائد؛ يُستفاد في التعلم والتدبر",
    Icon: BookMarked,
    tag: "١١٤ سورة",
  },
  {
    href: "/quran/tajweed",
    title: "علم التجويد",
    desc: "أحكام التجويد الشاملة مصنَّفة في ستة أبواب رئيسية؛ يُستفاد في التعلم والتدبر",
    Icon: GraduationCap,
    tag: "١٤ حكماً",
  },
  {
    href: "/tafsir",
    title: "علم التفسير",
    desc: "أنواع التفسير وأصوله وأشهر كتب المفسرين، مع روابط للمكتبة والمصحف؛ يُستفاد في التعلم والتدبر",
    Icon: BookOpen,
    tag: "علم",
  },
  {
    href: "/quran-circles",
    title: "حلقات القرآن",
    desc: "دليل حلقات التحفيظ في الكويت والمنصات الموثوقة — بروابط تسجيل وتواصل",
    Icon: Circle,
    tag: "دليل",
  },
  {
    href: "/daily-wird",
    title: "الورد اليومي",
    desc: "تتبع ورد قراءة القرآن اليومي مع السلسلة المتواصلة؛ يُستفاد في التعلم والتدبر",
    Icon: Moon,
    tag: "يومي",
  },
  {
    href: "/adhkar",
    title: "الأذكار الشرعية",
    desc: "أذكار الصباح والمساء والنوم وغيرها والتخريج من الصحيح؛ يُستفاد في التعلم والتدبر",
    Icon: Sparkles,
    tag: "أذكار",
  },
  {
    href: "/ulum-quran",
    title: "علوم القرآن",
    desc: "النزول والجمع والتفسير والإعجاز البياني والتشريعي والغيبي — بلا إعجاز عددي؛ يُستفاد في التعلم والتدبر",
    Icon: Layers,
    tag: "علم",
  },
  {
    href: "/duas-quran",
    title: "أدعية القرآن الكريم",
    desc: "٣٠+ دعاءً قرآنياً مصنَّفاً بحسب النبي والمناسبة والفائدة؛ يُستفاد في التعلم والتدبر",
    Icon: Star,
    tag: "دعاء",
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
            url: `${SITE_URL}${s.href}`,
          })),
        },
      ],
    });
  }, []);

  const [tafsirAudioReady, setTafsirAudioReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import("@/lib/quran-data/tafsir-audio").then(async ({ loadTafsirAudioCatalog }) => {
      const clips = await loadTafsirAudioCatalog();
      if (!cancelled) setTafsirAudioReady(clips.some((c) => c.enabled && c.streamUrl));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="quran-hub-page" dir="rtl">
      <PageHero
        title="القرآن الكريم"
        description="كتاب الله العزيز، اقرأ، استمع، تعلّم، وتدبَّر"
      >
        <div className="hub-card-grid" style={{ marginBlockStart: "0.75rem" }} role="list">
          {STATS.map((s) => (
            <div key={s.label} className="mj-stat" role="listitem">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </PageHero>

      <Link
        href="/mushaf"
        className="quran-hub-open-mushaf"
        aria-label="المصحف الجديد قيد التطوير"
      >
        <span className="quran-hub-open-mushaf__icon" aria-hidden="true">
          <BookOpen size={28} strokeWidth={1.75} />
        </span>
        <span className="quran-hub-open-mushaf__text">
          <span className="quran-hub-open-mushaf__title">المصحف الجديد</span>
          <span className="quran-hub-open-mushaf__resume">قيد التطوير</span>
        </span>
      </Link>

      <section className="quran-hub-jump" aria-label="بحث السور والصفحات">
        <QuranSurahJumpSearch />
      </section>

      {tafsirAudioReady ? (
        <p style={{ textAlign: "center", margin: "0.5rem 1rem 0", fontSize: "0.95rem" }}>
          <Link href="/tafsir">تفسير صوتي متاح — استمع من شيت الآية أو صفحة السورة</Link>
        </p>
      ) : null}

      <section className="quran-hub-sections">
        <h2 className="quran-hub-sections__title">أقسام القرآن</h2>
        <div className="hub-card-grid">
          {QURAN_SECTIONS.map((s) => (
            <HubCard
              key={s.href}
              href={s.href}
              title={s.title}
              description={s.desc}
              Icon={s.Icon}
              badge={s.tag}
              soon={isComingSoonPath(s.href)}
              featured={s.featured}
            />
          ))}
        </div>
      </section>

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

      <section className="quran-hub-closing">
        <p className="quran-hub-closing__ayah mj-type-sacred">
          ﴿ إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾
        </p>
        <span className="quran-hub-closing__ref">الإسراء: ٩</span>
      </section>

      <div className="twh-share">
        <ShareButtons title="مركز القرآن الكريم — المجلس العلمي" url={`${SITE_URL}/quran-hub`} />
      </div>
    </div>
  );
}
