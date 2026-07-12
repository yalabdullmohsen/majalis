import { useEffect, useMemo, useState } from "react";
import { BookMarked, BookOpen, Leaf, Moon, Scale, ScrollText, Shapes } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { fetchAllTopics } from "@/lib/scholarly-intelligence-service";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

// ── Static fallback topics per category ──────────────────────────────────────

const STATIC_TOPICS: Record<string, Array<{ slug: string; title: string }>> = {
  fiqh: [
    { slug: "salah", title: "أحكام الصلاة" },
    { slug: "sawm", title: "أحكام الصيام" },
    { slug: "zakat", title: "أحكام الزكاة" },
    { slug: "hajj", title: "أحكام الحج" },
    { slug: "nikah", title: "أحكام النكاح" },
    { slug: "talaq", title: "أحكام الطلاق" },
    { slug: "mirath", title: "أحكام الميراث" },
    { slug: "buyu", title: "أحكام البيع والشراء" },
    { slug: "waqf", title: "أحكام الوقف" },
    { slug: "wasiyya", title: "أحكام الوصية" },
    { slug: "qadha", title: "أحكام القضاء" },
    { slug: "uqubat", title: "الحدود والعقوبات" },
  ],
  aqeedah: [
    { slug: "tawhid", title: "التوحيد وأقسامه" },
    { slug: "asma-sifat", title: "الأسماء والصفات" },
    { slug: "iman", title: "الإيمان وأركانه" },
    { slug: "yawm-akhir", title: "اليوم الآخر" },
    { slug: "qadar", title: "القضاء والقدر" },
    { slug: "nubuwwat", title: "النبوات والرسالة" },
    { slug: "malaika", title: "الملائكة وعالم الغيب" },
    { slug: "bid-ah", title: "البدعة وحكمها" },
  ],
  akhlaq: [
    { slug: "sidq", title: "الصدق والأمانة" },
    { slug: "birr-sila", title: "بر الوالدين وصلة الرحم" },
    { slug: "adl", title: "العدل والإنصاف" },
    { slug: "tawadu", title: "التواضع والكبر" },
    { slug: "sabr-shukr", title: "الصبر والشكر" },
    { slug: "hasad", title: "الحسد والغيرة" },
    { slug: "ghiba", title: "الغيبة والنميمة" },
    { slug: "haya", title: "الحياء وحفظ الفرج" },
  ],
  quran: [
    { slug: "ulum-quran", title: "علوم القرآن" },
    { slug: "tafsir", title: "التفسير وطرقه" },
    { slug: "tajwid", title: "أحكام التجويد" },
    { slug: "ijaz", title: "الإعجاز القرآني" },
    { slug: "asbab-nuzul", title: "أسباب النزول" },
    { slug: "nasikh-mansukh", title: "الناسخ والمنسوخ" },
    { slug: "muhkam-mutashabih", title: "المحكم والمتشابه" },
    { slug: "makki-madani", title: "المكي والمدني" },
  ],
  hadith: [
    { slug: "mustalah", title: "مصطلح الحديث" },
    { slug: "jarh-tadil", title: "الجرح والتعديل" },
    { slug: "sihah-sitta", title: "الصحاح الستة" },
    { slug: "arbaeen-nawawi", title: "الأربعون النووية" },
    { slug: "hadith-sahih", title: "أحكام الحديث الصحيح" },
    { slug: "hadith-daif", title: "أحكام الحديث الضعيف" },
    { slug: "mutawatir", title: "الحديث المتواتر والآحاد" },
    { slug: "fiqh-hadith", title: "فقه الحديث النبوي" },
  ],
  seerah: [
    { slug: "mawlid", title: "مولده ونشأته ﷺ" },
    { slug: "hijra", title: "الهجرة النبوية" },
    { slug: "ghazawat", title: "الغزوات والمعارك" },
    { slug: "sahaba", title: "سير الصحابة الكرام" },
    { slug: "ummahat-mumineen", title: "أمهات المؤمنين" },
    { slug: "fath-makkah", title: "فتح مكة المكرمة" },
  ],
};

const CATEGORY_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  fiqh:    { label: "الفقه الإسلامي",  Icon: Scale,      color: "var(--majalis-emerald-deep, #166534)" },
  aqeedah: { label: "العقيدة",          Icon: Shapes,     color: "var(--majalis-emerald, #176B57)" },
  akhlaq:  { label: "الأخلاق",          Icon: Leaf,       color: "#2d6a4f" },
  quran:   { label: "القرآن الكريم",   Icon: BookMarked, color: "#1e40af" },
  hadith:  { label: "الحديث النبوي",  Icon: ScrollText,  color: "#7c3aed" },
  seerah:  { label: "السيرة النبوية",  Icon: Moon,       color: "var(--majalis-emerald-deep, #123F36)" },
  other:   { label: "أخرى",            Icon: BookOpen,   color: "var(--majalis-ink-soft)" },
};

const ALL_CAT = "الكل";

export default function TopicsIndexPage() {
  const [topics, setTopics] = useState<Array<{ slug: string; title: string; category?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(ALL_CAT);
  const [search, setSearch] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/topics",
      title: "الموضوعات العلمية الشرعية | المجلس العلمي",
      description: "استعرض المحتوى الشرعي مجمّعاً حسب الموضوع، فقه، عقيدة، أخلاق، قرآن، حديث، سيرة. آيات وأحاديث وفتاوى ودروس.",
      keywords: ["موضوعات إسلامية", "فقه إسلامي", "علوم شرعية", "تصنيف إسلامي", "محتوى شرعي"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "الموضوعات العلمية الشرعية", url: "https://majlisilm.com/topics", about: { "@type": "Thing", name: "تصنيف المحتوى الإسلامي حسب الموضوع" } }],
    });
  }, []);

  useEffect(() => {
    fetchAllTopics()
      .then(setTopics)
      .finally(() => setLoading(false));
  }, []);

  // Merge API topics into static ones, then apply category + text filter
  const { allCategories, displayed } = useMemo(() => {
    const m: Record<string, Array<{ slug: string; title: string }>> = {};
    for (const [cat, items] of Object.entries(STATIC_TOPICS)) m[cat] = [...items];
    for (const t of topics) {
      const cat = t.category || "other";
      if (!m[cat]) m[cat] = [];
      if (!m[cat].some((s) => s.slug === t.slug)) m[cat].push({ slug: t.slug, title: t.title });
    }
    const cats = Object.keys(m).filter((c) => m[c].length > 0);
    const base = activeCategory === ALL_CAT ? m : { [activeCategory]: m[activeCategory] ?? [] };
    if (!search.trim()) return { allCategories: cats, displayed: base };
    const result: Record<string, Array<{ slug: string; title: string }>> = {};
    for (const [cat, items] of Object.entries(base)) {
      const matched = items.filter(t => arabicMatchAny([t.title], search));
      if (matched.length > 0) result[cat] = matched;
    }
    return { allCategories: cats, displayed: result };
  }, [topics, activeCategory, search]);

  return (
    <div className="page-shell narrow tip-page">
      <PageHeader
        eyebrow="المحتوى الشرعي الموضوعاتي"
        title="الموضوعات العلمية"
        subtitle="استعرض المحتوى الشرعي مجمّعاً حسب الموضوع، آيات وأحاديث وفتاوى ودروس وكتب."
      />

      {/* Category tabs */}
      <div className="tip-category-bar">
        <button
          type="button"
          className={activeCategory === ALL_CAT ? "tip-cat-btn tip-cat-btn--active" : "tip-cat-btn"}
          onClick={() => setActiveCategory(ALL_CAT)}
          aria-pressed={activeCategory === ALL_CAT}
        >
          {ALL_CAT}
        </button>
        {allCategories.map((cat) => {
          const meta = CATEGORY_META[cat] ?? CATEGORY_META.other;
          return (
            <button
              key={cat}
              type="button"
              className={activeCategory === cat ? "tip-cat-btn tip-cat-btn--active" : "tip-cat-btn"}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
            >
              <meta.Icon size={14} strokeWidth={1.8} aria-hidden="true" /> {meta.label}
            </button>
          );
        })}
      </div>

      <div className="tip-search-wrap">
        <input
          type="search"
          className="ds-input tip-search-input"
          placeholder="ابحث في الموضوعات..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="بحث في الموضوعات الشرعية"
        />
      </div>

      {loading && <SkeletonCardGrid />}

      {!loading && Object.entries(displayed).length === 0 && search.trim() && (
        <p className="tip-footer-note">لا توجد موضوعات مطابقة لـ «{search}».</p>
      )}

      {!loading && Object.entries(displayed).map(([category, items]) => {
        const meta = CATEGORY_META[category] ?? CATEGORY_META.other;
        return (
          <section key={category} className="tip-section">
            <div className="tip-section-header">
              <span className="tip-section-icon" aria-hidden="true"><meta.Icon size={18} strokeWidth={1.5} /></span>
              <h2 className="tip-section-title">{meta.label}</h2>
              <span className="tip-section-count">{items.length} موضوع</span>
            </div>
            <div className="tip-grid">
              {items.map((t) => (
                <Link key={t.slug} href={`/topics/${t.slug}`} className="tip-link">
                  {t.title}
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="tip-footer-note">
        <p>المحتوى محدَّث باستمرار. لا يجد موضوعاً؟</p>
        <Link href="/search" className="tip-footer-link">استخدم البحث الشامل</Link>
      </div>

      <div className="twh-share">
        <ShareButtons title="فهرس المواضيع الإسلامية — المجلس العلمي" url="https://majlisilm.com/topics" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith", "fiqh", "aqeeda"]} title="اختبر معلوماتك في العلوم الشرعية" count={4} />
      </div>
    </div>
  );
}
