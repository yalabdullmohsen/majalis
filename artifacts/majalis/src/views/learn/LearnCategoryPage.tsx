import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { BookOpen, ChevronLeft, Compass, Layers } from "lucide-react";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { fetchCategoryDetail, type CategoryDetail } from "@/lib/learn-library-service";
import { applyPageSeo } from "@/lib/seo";

export default function LearnCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetchCategoryDetail(slug)
      .then((d) => {
        if (!d || d.category.status !== "published") { setNotFound(true); return; }
        setDetail(d);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!detail) return;
    applyPageSeo({
      path: `/learn/${detail.category.slug}`,
      title: `${detail.category.name} | أبواب العلم | المجلس العلمي`,
      description: detail.category.description || `دروس وسلاسل في ${detail.category.name} — محتوى معتمد فقط.`,
      keywords: [detail.category.name, "أبواب العلم", "دروس شرعية"],
    });
  }, [detail]);

  if (loading) return <div className="page-shell"><SkeletonCardGrid count={6} /></div>;

  if (notFound || !detail) {
    return (
      <div className="page-shell lrn-cat">
        <p className="lrn-empty">هذا التصنيف غير متاح حاليًا.</p>
        <Link href="/learn" className="lrn-back-link">← العودة لأبواب العلم</Link>
      </div>
    );
  }

  const { category, breadcrumb, children, series, lessons } = detail;

  // "ابدأ من هنا": أول سلسلة منشورة إن وُجدت، ثم أول درسين مباشرين — يوجّه
  // المبتدئ لثلاث خطوات محددة بدل تركه أمام قائمة طويلة غير مرتبة.
  const startHere: Array<{ kind: "series" | "lesson"; id: string; href: string; title: string }> = [];
  if (series[0]) startHere.push({ kind: "series", id: series[0].id, href: `/learn/series/${series[0].slug}`, title: series[0].title });
  for (const l of lessons.slice(0, 3 - startHere.length)) {
    startHere.push({ kind: "lesson", id: l.id, href: `/learn/lesson/${l.id}`, title: l.title });
  }

  return (
    <div className="page-shell lrn-cat">
      <nav className="lrn-breadcrumb" aria-label="مسار التصفح">
        <Link href="/learn">أبواب العلم</Link>
        {breadcrumb.map((b) => (
          <span key={b.id}><ChevronLeft size={13} aria-hidden="true" /><Link href={`/learn/${b.slug}`}>{b.name}</Link></span>
        ))}
        <span><ChevronLeft size={13} aria-hidden="true" /><span aria-current="page">{category.name}</span></span>
      </nav>

      <PageHeader eyebrow="باب علمي" title={category.name} subtitle={category.description ?? undefined} />

      {startHere.length > 0 && (
        <section className="lrn-start-here">
          <h2 className="lrn-section-title"><Compass size={16} /> ابدأ من هنا</h2>
          <div className="lrn-start-here__grid">
            {startHere.map((s, i) => (
              <Link key={s.id} href={s.href} className="lrn-start-here__card">
                <span className="lrn-start-here__num">{i + 1}</span>
                <span>{s.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {children.length > 0 && (
        <section>
          <h2 className="lrn-section-title">التصنيفات الفرعية</h2>
          <div className="lrn-subcat-grid">
            {children.map((c) => (
              <Link key={c.id} href={`/learn/${c.slug}`} className="lrn-subcat-card">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section>
          <h2 className="lrn-section-title"><Layers size={16} /> السلاسل</h2>
          <div className="lrn-series-grid">
            {series.map((s) => (
              <Link key={s.id} href={`/learn/series/${s.slug}`} className="lrn-series-card">
                <h3>{s.title}</h3>
                {s.description && <p>{s.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {lessons.length > 0 && (
        <section>
          <h2 className="lrn-section-title"><BookOpen size={16} /> الدروس</h2>
          <div className="lrn-lessons-grid">
            {lessons.map((l) => (
              <Link key={l.id} href={`/learn/lesson/${l.id}`} className="lrn-lesson-card">
                <h3>{l.title}</h3>
                {l.description && <p>{l.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {children.length === 0 && series.length === 0 && lessons.length === 0 && (
        <p className="lrn-empty">لا محتوى منشور بعد في هذا التصنيف تحديدًا.</p>
      )}
    </div>
  );
}
