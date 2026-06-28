import { useEffect, useState } from "react";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { getMutoonById, getMutoonLessons, getRelatedMutoon } from "@/lib/quran-circles-mutoon-service";
import { getUserMutoonProgress, upsertMutoonProgress } from "@/lib/progress-tracking-service";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";

export default function MutoonDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    getMutoonById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (!data) return undefined;
        return Promise.all([
          getMutoonLessons(data.id),
          getRelatedMutoon(data.id),
          getUserMutoonProgress(data.id),
        ]);
      })
      .then((result) => {
        if (result) {
          setLessons(result[0].data);
          setRelated(result[1]);
          setProgress(result[2].data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("mutoon", params.id);

  useEffect(() => {
    if (!item) return;
    const path = `/mutoon/${item.slug || item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | المتون — المجلس العلمي`,
      description: item.summary || item.title,
      keywords: [...(item.keywords || []), item.category, item.author, "متون"],
      ogType: "website",
      canonicalPath: path,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المتون", path: "/mutoon" },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item]);

  const updateProgress = async (pct: number, lastPage?: number) => {
    if (!item || !user) return;
    const { data } = await upsertMutoonProgress({ mutoon_id: item.id, progress_pct: pct, last_page: lastPage });
    if (data) setProgress(data);
  };

  if (loading) return <Loading />;
  if (!item) return <Empty text="المتن غير موجود." />;

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "المتون", href: "/mutoon" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={[item.author, item.level, item.total_pages ? `${item.total_pages} صفحة` : null].filter(Boolean).join(" · ")}
      tags={[item.category]}
      body={item.body}
      copyText={[item.title, item.summary, item.body].filter(Boolean).join("\n\n")}
      related={
        related.length > 0 ? (
          <RelatedLinks items={related.map((r) => ({ href: `/mutoon/${r.slug || r.id}`, title: r.title, meta: r.author }))} />
        ) : undefined
      }
    >
      {user && (
        <section className="content-detail-section">
          <h3>تقدّمك في المتن</h3>
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${progress?.progress_pct || 0}%` }} />
          </div>
          <p>{Math.round(progress?.progress_pct || 0)}% مكتمل</p>
          {progress?.last_page && <p>آخر صفحة: {progress.last_page}</p>}
          <div className="content-detail-actions">
            <button type="button" className="btn-secondary" onClick={() => void updateProgress(Math.min(100, (progress?.progress_pct || 0) + 10), (progress?.last_page || 0) + 5)}>
              تحديث التقدم
            </button>
          </div>
        </section>
      )}

      {lessons.length > 0 && (
        <section className="content-detail-section">
          <h3>دروس المتن ({lessons.length})</h3>
          <ul className="content-detail-list">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <strong>{lesson.title}</strong>
                {lesson.page_start && <span> — ص {lesson.page_start}{lesson.page_end ? `–${lesson.page_end}` : ""}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </ContentDetailLayout>
  );
}
