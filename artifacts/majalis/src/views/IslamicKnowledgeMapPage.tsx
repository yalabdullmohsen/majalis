import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BookOpen, Scroll, Scale, BookMarked, Users, Star, GraduationCap,
  Heart, Compass, Globe, Layers, ChevronLeft, ArrowLeftRight,
  FileText, Mic2, Shield,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

/* ── بنية العلوم الإسلامية ─────────────────────────────────── */

type Domain = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  href: string;
  count: number;
  unit: string;
  connections: string[];   // id of connected domains
  tags: string[];
};

const DOMAINS: Domain[] = [
  {
    id: "quran",
    title: "القرآن الكريم",
    subtitle: "الأصل الأول للتشريع",
    icon: BookOpen,
    color: "#FFFFFF",
    bg: "#062B20",
    href: "/quran-hub",
    count: 6236,
    unit: "آية",
    connections: ["tafsir", "tajweed", "hadith", "fiqh", "stories"],
    tags: ["سنة", "وحي", "تفسير", "تجويد"],
  },
  {
    id: "hadith",
    title: "الحديث النبوي",
    subtitle: "الأصل الثاني — السنة المطهرة",
    icon: Scroll,
    color: "#FFFFFF",
    bg: "#0A5040",
    href: "/hadith",
    count: 7563,
    unit: "حديث",
    connections: ["quran", "fiqh", "adhkar", "seerah", "scholars"],
    tags: ["سنة", "صحيح", "رواية", "سند"],
  },
  {
    id: "fiqh",
    title: "الفقه الإسلامي",
    subtitle: "الأحكام العملية من الأدلة",
    icon: Scale,
    color: "#FFFFFF",
    bg: "#1F4D3A",
    href: "/fiqh",
    count: 4,
    unit: "مذهب",
    connections: ["quran", "hadith", "fatwa", "scholars", "rulings"],
    tags: ["حنفي", "مالكي", "شافعي", "حنبلي"],
  },
  {
    id: "tafsir",
    title: "التفسير",
    subtitle: "شرح وبيان كلام الله تعالى",
    icon: BookMarked,
    color: "#FFFFFF",
    bg: "#145C46",
    href: "/quran/surah-stories",
    count: 114,
    unit: "سورة",
    connections: ["quran", "hadith", "scholars", "stories"],
    tags: ["أسباب نزول", "لغة", "إعجاز", "حروف"],
  },
  {
    id: "scholars",
    title: "العلماء والأعلام",
    subtitle: "حملة العلم عبر القرون",
    icon: Users,
    color: "#FFFFFF",
    bg: "#062B20",
    href: "/lessons",
    count: 500,
    unit: "عالم",
    connections: ["hadith", "fiqh", "tafsir", "books", "lessons"],
    tags: ["أئمة", "محدثون", "فقهاء", "مفسرون"],
  },
  {
    id: "stories",
    title: "القصص والسيرة",
    subtitle: "قصص الأنبياء والصحابة والسيرة",
    icon: Star,
    color: "#FFFFFF",
    bg: "#0A5040",
    href: "/stories",
    count: 25,
    unit: "نبي",
    connections: ["quran", "tafsir", "seerah", "lessons"],
    tags: ["سيرة", "أنبياء", "صحابة", "عبر"],
  },
  {
    id: "tajweed",
    title: "علم التجويد",
    subtitle: "إتقان تلاوة القرآن الكريم",
    icon: Mic2,
    color: "#FFFFFF",
    bg: "#145C46",
    href: "/quran/tajweed",
    count: 14,
    unit: "حكم",
    connections: ["quran", "adhkar"],
    tags: ["مخارج", "صفات", "مدود", "غنة"],
  },
  {
    id: "fatwa",
    title: "الفتاوى والأحكام",
    subtitle: "إجابات العلماء عن المسائل المعاصرة",
    icon: FileText,
    color: "#FFFFFF",
    bg: "#1F4D3A",
    href: "/fatwa",
    count: 1200,
    unit: "فتوى",
    connections: ["fiqh", "scholars", "rulings"],
    tags: ["مجمع", "مجلس", "اجتهاد", "تيسير"],
  },
  {
    id: "adhkar",
    title: "الأذكار والدعاء",
    subtitle: "تعبد الله بالذكر والدعاء والتسبيح",
    icon: Heart,
    color: "#FFFFFF",
    bg: "#062B20",
    href: "/adhkar",
    count: 200,
    unit: "ذكر",
    connections: ["quran", "hadith", "tajweed"],
    tags: ["صباح", "مساء", "سنن", "مستجاب"],
  },
  {
    id: "seerah",
    title: "السيرة النبوية",
    subtitle: "حياة النبي محمد ﷺ وغزواته",
    icon: Compass,
    color: "#FFFFFF",
    bg: "#0A5040",
    href: "/seerah",
    count: 23,
    unit: "سنة نبوية",
    connections: ["hadith", "stories", "scholars", "lessons"],
    tags: ["مكة", "المدينة", "غزوات", "هجرة"],
  },
  {
    id: "rulings",
    title: "الأحكام الشرعية",
    subtitle: "مكتبة الأحكام الفقهية المصنّفة",
    icon: Shield,
    color: "#FFFFFF",
    bg: "#145C46",
    href: "/rulings",
    count: 800,
    unit: "حكم",
    connections: ["fiqh", "fatwa", "hadith"],
    tags: ["واجب", "مندوب", "مكروه", "حرام"],
  },
  {
    id: "lessons",
    title: "الدروس والمحاضرات",
    subtitle: "تعلم العلم الشرعي من كبار المشايخ",
    icon: GraduationCap,
    color: "#FFFFFF",
    bg: "#1F4D3A",
    href: "/lessons",
    count: 3000,
    unit: "درس",
    connections: ["scholars", "fiqh", "seerah", "stories"],
    tags: ["مباشر", "مسجل", "دورات", "شهادات"],
  },
  {
    id: "books",
    title: "المكتبة الإسلامية",
    subtitle: "كتب ومتون العلم الشرعي",
    icon: Layers,
    color: "#FFFFFF",
    bg: "#062B20",
    href: "/library",
    count: 500,
    unit: "كتاب",
    connections: ["scholars", "fiqh", "tafsir", "hadith"],
    tags: ["متون", "شروح", "فهارس", "PDF"],
  },
  {
    id: "universities",
    title: "الجامعات والمعاهد",
    subtitle: "مؤسسات تعليم العلوم الشرعية",
    icon: Globe,
    color: "#FFFFFF",
    bg: "#0A5040",
    href: "/universities",
    count: 200,
    unit: "مؤسسة",
    connections: ["scholars", "lessons", "books"],
    tags: ["أزهر", "إسلامية", "شريعة", "أصول"],
  },
];

/* ── إحصائيات ────────────────────────────────────────────── */
const STATS = [
  { val: "١٤", lbl: "علماً شرعياً" },
  { val: "+١٥٠٠", lbl: "رابط معرفي" },
  { val: "١٤٠٠", lbl: "سنة من التراث" },
  { val: "٦+", lbl: "مذاهب ومدارس" },
];

/* ── روابط العلوم الكبرى ────────────────────────────────── */
const CONNECTIONS_MAP: { a: string; b: string; label: string }[] = [
  { a: "quran",    b: "hadith",   label: "السنة تُبيّن القرآن" },
  { a: "quran",    b: "fiqh",     label: "أدلة الأحكام" },
  { a: "hadith",   b: "fiqh",     label: "مصدر التشريع" },
  { a: "fiqh",     b: "scholars", label: "اجتهاد العلماء" },
  { a: "tafsir",   b: "stories",  label: "قصص القرآن" },
  { a: "scholars", b: "books",    label: "التأليف والتدوين" },
  { a: "seerah",   b: "hadith",   label: "سياق الأحاديث" },
];

export default function IslamicKnowledgeMapPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/knowledge-map",
      title: "الخريطة المعرفية الإسلامية | مجالس",
      description: "استكشف ترابط العلوم الإسلامية — القرآن والحديث والفقه والتفسير والسيرة والأذكار ومئات المصادر",
    });
  }, []);

  const selectedDomain = selected ? DOMAINS.find(d => d.id === selected) : null;
  const connectedIds = selectedDomain ? selectedDomain.connections : [];

  const filtered = searchTerm.trim()
    ? DOMAINS.filter(d =>
        d.title.includes(searchTerm) ||
        d.subtitle.includes(searchTerm) ||
        d.tags.some(t => t.includes(searchTerm))
      )
    : DOMAINS;

  return (
    <div className="ikm-page" dir="rtl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="ikm-hero">
        <div className="ikm-hero__ornament" aria-hidden="true">❧ الخريطة المعرفية الإسلامية 2.0 ❧</div>
        <h1 className="ikm-hero__title">ترابط العلوم الإسلامية</h1>
        <p className="ikm-hero__sub">
          استكشف كيف تترابط علوم القرآن والحديث والفقه والسيرة والأذكار في موسوعة معرفية متكاملة
        </p>
        <div className="ikm-stats">
          {STATS.map(s => (
            <div key={s.lbl} className="ikm-stat">
              <span className="ikm-stat__val">{s.val}</span>
              <span className="ikm-stat__lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── بحث ───────────────────────────────────────────────── */}
      <div className="ikm-search-bar">
        <input
          className="ikm-search-input"
          type="search"
          placeholder="ابحث في العلوم الإسلامية..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          aria-label="بحث في العلوم"
        />
        {selected && (
          <button type="button" className="ikm-clear-btn" onClick={() => setSelected(null)}>
            إلغاء التصفية
          </button>
        )}
      </div>

      {/* ── الخريطة — شبكة العلوم ────────────────────────────── */}
      <section className="ikm-grid-section">
        <h2 className="ikm-section-title">
          {selected
            ? `علوم مرتبطة بـ «${selectedDomain?.title}»`
            : "علوم الإسلام — اضغط لعرض الروابط"}
        </h2>
        <div className="ikm-grid">
          {filtered.map(domain => {
            const isSelected = selected === domain.id;
            const isConnected = connectedIds.includes(domain.id);
            const isDimmed = selected && !isSelected && !isConnected;
            const Icon = domain.icon;

            return (
              <button
                key={domain.id}
                className={[
                  "ikm-card",
                  `ikm-dom--${domain.id}`,
                  isSelected ? "ikm-card--selected" : "",
                  isConnected ? "ikm-card--connected" : "",
                  isDimmed ? "ikm-card--dimmed" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => setSelected(selected === domain.id ? null : domain.id)}
                aria-pressed={isSelected}
              >
                <div className="ikm-card__header">
                  <Icon size={24} className="ikm-card__icon" />
                  {isConnected && <span className="ikm-card__badge">مرتبط</span>}
                  {isSelected && <span className="ikm-card__badge ikm-card__badge--active">محدد</span>}
                </div>
                <h3 className="ikm-card__title">{domain.title}</h3>
                <p className="ikm-card__sub">{domain.subtitle}</p>
                <div className="ikm-card__count">
                  <span className="ikm-card__num">{domain.count.toLocaleString("ar-EG")}</span>
                  <span className="ikm-card__unit">{domain.unit}</span>
                </div>
                <div className="ikm-card__tags">
                  {domain.tags.slice(0, 3).map(t => (
                    <span key={t} className="ikm-tag">{t}</span>
                  ))}
                </div>
                <Link
                  href={domain.href}
                  className="ikm-card__link"
                  onClick={e => e.stopPropagation()}
                >
                  استكشف <ChevronLeft size={14} />
                </Link>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── تفاصيل العلم المحدد ──────────────────────────────── */}
      {selectedDomain && (
        <section className="ikm-detail">
          <div className="ikm-detail__inner">
            <div className={`ikm-detail__left ikm-dom--${selectedDomain.id}`}>
              <selectedDomain.icon size={40} className="ikm-detail__icon" />
              <h2 className="ikm-detail__title">{selectedDomain.title}</h2>
              <p className="ikm-detail__sub">{selectedDomain.subtitle}</p>
              <div className="ikm-detail__count">
                <span className="ikm-detail__num">{selectedDomain.count.toLocaleString("ar-EG")}</span>
                <span className="ikm-detail__unit">{selectedDomain.unit}</span>
              </div>
              <Link href={selectedDomain.href} className="ikm-detail__cta">
                فتح القسم <ChevronLeft size={16} />
              </Link>
            </div>
            <div className="ikm-detail__right">
              <h3 className="ikm-detail__rels-title">
                <ArrowLeftRight size={18} /> العلوم المرتبطة
              </h3>
              <div className="ikm-detail__rels">
                {selectedDomain.connections.map(cid => {
                  const cd = DOMAINS.find(d => d.id === cid);
                  if (!cd) return null;
                  const connInfo = CONNECTIONS_MAP.find(
                    c => (c.a === selectedDomain.id && c.b === cid) ||
                         (c.b === selectedDomain.id && c.a === cid)
                  );
                  return (
                    <div key={cid} className="ikm-rel-item">
                      <div className={`ikm-rel-dot ikm-dom--${cid}`} />
                      <div className="ikm-rel-text">
                        <span className="ikm-rel-name">{cd.title}</span>
                        {connInfo && (
                          <span className="ikm-rel-reason">{connInfo.label}</span>
                        )}
                      </div>
                      <Link href={cd.href} className="ikm-rel-link">
                        <ChevronLeft size={14} />
                      </Link>
                    </div>
                  );
                })}
              </div>
              <div className="ikm-detail__tags-section">
                <h4 className="ikm-detail__tags-title">الكلمات المفتاحية</h4>
                <div className="ikm-detail__tags">
                  {selectedDomain.tags.map(t => (
                    <span key={t} className="ikm-tag ikm-tag--dark">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── روابط معرفية بارزة ────────────────────────────────── */}
      <section className="ikm-connections-section">
        <h2 className="ikm-section-title">أبرز الروابط المعرفية</h2>
        <div className="ikm-connections-list">
          {CONNECTIONS_MAP.map((c, i) => {
            const da = DOMAINS.find(d => d.id === c.a);
            const db = DOMAINS.find(d => d.id === c.b);
            if (!da || !db) return null;
            return (
              <div key={i} className="ikm-conn-item">
                <button
                  className={`ikm-conn-node ikm-dom--${c.a}`}
                  onClick={() => setSelected(c.a)}
                >
                  {da.title}
                </button>
                <div className="ikm-conn-line">
                  <span className="ikm-conn-label">{c.label}</span>
                  <ArrowLeftRight size={16} className="ikm-conn-arrow" />
                </div>
                <button
                  className={`ikm-conn-node ikm-dom--${c.b}`}
                  onClick={() => setSelected(c.b)}
                >
                  {db.title}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
