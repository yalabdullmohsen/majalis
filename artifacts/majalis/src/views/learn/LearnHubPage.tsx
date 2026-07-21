import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Layers, Search } from "lucide-react";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { arabicMatchAny } from "@/lib/arabic-search";
import { fetchPublishedCategoryTree, type CategoryWithCounts } from "@/lib/learn-library-service";
import { applyPageSeo } from "@/lib/seo";

export default function LearnHubPage() {
  const [tree, setTree] = useState<CategoryWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/learn",
      title: "أبواب العلم | المجلس العلمي",
      description: "فهرس شامل للعلوم الشرعية بتصنيف علمي واضح: عقيدة، فقه، حديث، تفسير، سيرة وغيرها — دروس ومسارات حقيقية معتمدة فقط.",
      keywords: ["أبواب العلم", "العلوم الشرعية", "تصنيف الفقه", "دروس شرعية", "المجلس العلمي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "أبواب العلم",
          url: "https://www.majlisilm.com/learn",
          description: "فهرس التصنيفات العلمية الشرعية على منصة المجلس العلمي",
        },
      ],
    });
  }, []);

  useEffect(() => {
    fetchPublishedCategoryTree().then(setTree).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return tree;
    return tree.filter((c) => arabicMatchAny([c.name, c.description], search));
  }, [tree, search]);

  const totalLessons = tree.reduce((s, c) => s + c.lessonCount, 0);
  const totalSeries = tree.reduce((s, c) => s + c.seriesCount, 0);

  return (
    <div className="page-shell lrn-hub">
      <PageHeader
        eyebrow="مكتبة علمية منظمة"
        title="أبواب العلم"
        subtitle="فهرس شامل للعلوم الشرعية بتصنيف واضح — دروس وسلاسل حقيقية معتمدة فقط، لا أبواب فارغة."
      />

      <div className="lrn-hub-stats">
        <div className="lrn-hub-stat"><strong>{tree.length}</strong><span>بابًا علميًا منشورًا</span></div>
        <div className="lrn-hub-stat-divider" />
        <div className="lrn-hub-stat"><strong>{totalLessons}</strong><span>درسًا معتمدًا</span></div>
        <div className="lrn-hub-stat-divider" />
        <div className="lrn-hub-stat"><strong>{totalSeries}</strong><span>سلسلة دروس</span></div>
      </div>

      <div className="lrn-hub-search">
        <Search size={16} className="lrn-hub-search__icon" aria-hidden="true" />
        <input
          type="search"
          placeholder="ابحث في أبواب العلم…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lrn-hub-search__input"
          aria-label="ابحث في أبواب العلم"
        />
      </div>

      {loading && <SkeletonCardGrid count={8} />}

      {!loading && filtered.length === 0 && (
        <p className="lrn-empty">لا نتائج مطابقة لبحثك.</p>
      )}

      <div className="lrn-hub-grid">
        {!loading && filtered.map((cat) => (
          <Link key={cat.id} href={`/learn/${cat.slug}`} className="lrn-hub-card">
            <div className="lrn-hub-card__icon"><BookOpen size={22} strokeWidth={1.6} aria-hidden="true" /></div>
            <h3 className="lrn-hub-card__title">{cat.name}</h3>
            {cat.description && <p className="lrn-hub-card__desc">{cat.description}</p>}
            <div className="lrn-hub-card__meta">
              {cat.lessonCount > 0 && <span className="lrn-hub-card__badge">{cat.lessonCount} درس</span>}
              {cat.seriesCount > 0 && <span className="lrn-hub-card__badge"><Layers size={11} /> {cat.seriesCount} سلسلة</span>}
              {cat.children.length > 0 && <span className="lrn-hub-card__badge lrn-hub-card__badge--muted">{cat.children.length} تصنيف فرعي</span>}
            </div>
          </Link>
        ))}
      </div>

      {!loading && tree.length === 0 && (
        <div className="lrn-empty-state">
          <p>لا تصنيفات منشورة بعد — تُضاف الأبواب تباعًا مع اعتماد محتواها علميًا.</p>
        </div>
      )}
    </div>
  );
}
