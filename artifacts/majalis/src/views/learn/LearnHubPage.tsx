import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, BookUser, Landmark, Layers, Scale, Search, Shield, Star } from "lucide-react";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { PageShell } from "@/components/layout/PageShell";
import { arabicMatchAny } from "@/lib/arabic-search";
import { fetchPublishedCategoryTree, type CategoryWithCounts } from "@/lib/learn-library-service";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/library.css";

const LEARN_SECTIONS = [
  {
    href: "/fiqh",
    label: "الفقه والأحكام",
    desc: "مداخل الفقه، العبادات، وموسوعة الأحكام الشرعية الموثّقة.",
    Icon: Scale,
  },
  {
    href: "/seerah",
    label: "السيرة النبوية",
    desc: "سيرة النبي ﷺ ومغازيه وشمائله بضوابط الرواية والتمحيص.",
    Icon: BookUser,
  },
  {
    href: "/tawhid",
    label: "العقيدة",
    desc: "التوحيد وأنواعُه ومسائل العقيدة على منهج أهل السنة.",
    Icon: Shield,
  },
  {
    href: "/prophets",
    label: "قصص الأنبياء",
    desc: "قصص الأنبياء المذكورين في القرآن للعبرة والاقتداء.",
    Icon: Star,
  },
  {
    href: "/nations",
    label: "الأمم السابقة",
    desc: "أخبار الأمم في القرآن والسنة الصحيحة وما فيها من عبر.",
    Icon: Landmark,
  },
] as const;

export default function LearnHubPage() {
  const [tree, setTree] = useState<CategoryWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/learn",
      title: "دروس التعلّم | سُنّة",
      description:
        "دروس شرعية مفصّلة: الفقه والأحكام، السيرة النبوية، العقيدة، قصص الأنبياء، والأمم السابقة — مع فهرس الدروس المنشورة.",
      keywords: [
        "تعلّم",
        "دروس شرعية",
        "العقيدة",
        "الفقه والأحكام",
        "السيرة النبوية",
        "قصص الأنبياء",
        "سُنّة",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "دروس التعلّم",
          url: "https://majlisilm.com/learn",
          description: "دروس شرعية مفصّلة في العقيدة والفقه والسيرة وغيرها",
          hasPart: LEARN_SECTIONS.map((s) => ({
            "@type": "WebPage",
            name: s.label,
            url: `https://majlisilm.com${s.href}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => {
    fetchPublishedCategoryTree()
      .then(setTree)
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return tree;
    return tree.filter((c) => arabicMatchAny([c.name, c.description], search));
  }, [tree, search]);

  const totalLessons = tree.reduce((s, c) => s + c.lessonCount, 0);
  const totalSeries = tree.reduce((s, c) => s + c.seriesCount, 0);

  return (
    <PageShell className="lrn-hub">
      <PageHeader
        eyebrow="مكتبة الدروس"
        title="دروس التعلّم"
        subtitle="دروس عادية مفصّلة في العقيدة والفقه والسيرة وغيرها — بلا مسارات أو مداخل أو أبواب متسلسلة."
      />

      <nav className="lrn-hub-grid" aria-label="أقسام التعلّم">
        {LEARN_SECTIONS.map(({ href, label, desc, Icon }) => (
          <Link key={href} href={href} className="lrn-hub-card">
            <div className="lrn-hub-card__icon">
              <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
            </div>
            <h2 className="lrn-hub-card__title">{label}</h2>
            <p className="lrn-hub-card__desc">{desc}</p>
          </Link>
        ))}
      </nav>

      <section className="lrn-hub-catalog" aria-label="فهرس الدروس المنشورة">
        <div className="lrn-hub-catalog__head">
          <h2 className="lrn-hub-catalog__title">
            <Layers size={18} aria-hidden="true" /> الدروس المنشورة
          </h2>
          {!loading && (
            <div className="lrn-hub-stats" aria-live="polite">
              <div className="lrn-hub-stat">
                <strong>{tree.length}</strong>
                <span>موضوع</span>
              </div>
              <span className="lrn-hub-stat-divider" aria-hidden="true" />
              <div className="lrn-hub-stat">
                <strong>{totalLessons}</strong>
                <span>درس</span>
              </div>
              <span className="lrn-hub-stat-divider" aria-hidden="true" />
              <div className="lrn-hub-stat">
                <strong>{totalSeries}</strong>
                <span>سلسلة</span>
              </div>
            </div>
          )}
        </div>

        <div className="lrn-hub-search">
          <Search size={16} className="lrn-hub-search__icon" aria-hidden="true" />
          <input
            className="lrn-hub-search__input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الدروس والمواضيع…"
            aria-label="بحث في الدروس"
          />
        </div>

        {loading ? (
          <SkeletonCardGrid count={6} />
        ) : filtered.length === 0 ? (
          <p className="lrn-hub-empty">لا دروس منشورة مطابقة للبحث حاليًا.</p>
        ) : (
          <div className="lrn-hub-grid">
            {filtered.map((cat) => (
              <Link key={cat.id} href={`/learn/${cat.slug}`} className="lrn-hub-card">
                <div className="lrn-hub-card__icon">
                  <BookOpen size={20} strokeWidth={1.6} aria-hidden="true" />
                </div>
                <h3 className="lrn-hub-card__title">{cat.name}</h3>
                {cat.description && <p className="lrn-hub-card__desc">{cat.description}</p>}
                <div className="lrn-hub-card__meta">
                  <span className="lrn-hub-card__badge">{cat.lessonCount} درس</span>
                  {cat.seriesCount > 0 && (
                    <span className="lrn-hub-card__badge lrn-hub-card__badge--muted">{cat.seriesCount} سلسلة</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
