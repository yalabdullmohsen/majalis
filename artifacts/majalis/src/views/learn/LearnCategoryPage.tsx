import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { BookOpen, ChevronLeft, Layers } from "lucide-react";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { fetchCategoryDetail, type CategoryDetail } from "@/lib/learn-library-service";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/library.css";

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
        if (!d || d.category.status !== "published") {
          setNotFound(true);
          return;
        }
        setDetail(d);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!detail) return;
    applyPageSeo({
      path: `/learn/${detail.category.slug}`,
      title: `${detail.category.name} | دروس | سُنّة`,
      description: detail.category.description || `دروس مفصّلة في ${detail.category.name} — محتوى معتمد فقط.`,
      keywords: [detail.category.name, "دروس شرعية", "عقيدة"],
    });
  }, [detail]);

  if (loading) {
    return (
      <div className="page-shell">
        <SkeletonCardGrid count={6} />
      </div>
    );
  }

  if (notFound || !detail) {
    return (
      <div className="page-shell lrn-cat">
        <p className="lrn-empty">هذا الموضوع غير متاح حاليًا.</p>
        <Link href="/learn" className="lrn-back-link">
          ← العودة للدروس
        </Link>
      </div>
    );
  }

  const { category, breadcrumb, children, series, lessons } = detail;

  return (
    <div className="page-shell lrn-cat">
      <nav className="lrn-breadcrumb" aria-label="مسار التصفح">
        <Link href="/learn">الدروس</Link>
        {breadcrumb.map((b) => (
          <span key={b.id}>
            <ChevronLeft size={13} aria-hidden="true" />
            <Link href={`/learn/${b.slug}`}>{b.name}</Link>
          </span>
        ))}
        <span>
          <ChevronLeft size={13} aria-hidden="true" />
          <span aria-current="page">{category.name}</span>
        </span>
      </nav>

      <PageHeader eyebrow="دروس" title={category.name} subtitle={category.description ?? undefined} />

      {lessons.length > 0 && (
        <section>
          <h2 className="lrn-section-title">
            <BookOpen size={16} /> الدروس
          </h2>
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

      {series.length > 0 && (
        <section>
          <h2 className="lrn-section-title">
            <Layers size={16} /> السلاسل
          </h2>
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

      {children.length > 0 && (
        <section>
          <h2 className="lrn-section-title">مواضيع ذات صلة</h2>
          <div className="lrn-subcat-grid">
            {children.map((c) => (
              <Link key={c.id} href={`/learn/${c.slug}`} className="lrn-subcat-card">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {children.length === 0 && series.length === 0 && lessons.length === 0 && (
        <p className="lrn-empty">لا دروس منشورة بعد في هذا الموضوع.</p>
      )}
    </div>
  );
}
