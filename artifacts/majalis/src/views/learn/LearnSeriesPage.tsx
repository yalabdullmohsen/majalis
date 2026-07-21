import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { CheckCircle2, Circle } from "lucide-react";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { fetchSeriesDetail, type SeriesDetail } from "@/lib/learn-library-service";
import { applyPageSeo } from "@/lib/seo";

const LEVEL_LABEL: Record<string, string> = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" };

export default function LearnSeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [detail, setDetail] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSeriesDetail(slug).then(setDetail).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!detail) return;
    applyPageSeo({
      path: `/learn/series/${detail.series.slug}`,
      title: `${detail.series.title} | سلسلة دروس | المجلس العلمي`,
      description: detail.series.description || detail.series.title,
    });
  }, [detail]);

  if (loading) return <div className="page-shell"><SkeletonCardGrid count={6} /></div>;

  if (!detail) {
    return (
      <div className="page-shell lrn-cat">
        <p className="lrn-empty">هذه السلسلة غير متاحة حاليًا.</p>
        <Link href="/learn" className="lrn-back-link">← العودة لأبواب العلم</Link>
      </div>
    );
  }

  const { series, items } = detail;

  return (
    <div className="page-shell lrn-cat">
      <PageHeader
        eyebrow={`سلسلة دروس · ${LEVEL_LABEL[series.level] ?? series.level}`}
        title={series.title}
        subtitle={series.description ?? undefined}
      />

      <ol className="lrn-series-steps">
        {items.map((item, i) => (
          <li key={item.lesson.id} className="lrn-series-step">
            <span className="lrn-series-step__num">{i + 1}</span>
            <Link href={`/learn/lesson/${item.lesson.id}`} className="lrn-series-step__link">
              <span className="lrn-series-step__title">{item.lesson.title}</span>
              {item.lesson.description && <span className="lrn-series-step__desc">{item.lesson.description}</span>}
            </Link>
            <span className="lrn-series-step__status" aria-hidden="true">
              {item.isRequired ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </span>
          </li>
        ))}
      </ol>

      {items.length === 0 && <p className="lrn-empty">لا دروس في هذه السلسلة بعد.</p>}
    </div>
  );
}
