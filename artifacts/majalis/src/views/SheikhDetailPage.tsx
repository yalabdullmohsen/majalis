import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading, Empty, PageHeader } from "@/components/ui-common";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { getSheikhById } from "@/lib/supabase";
import { mapLessonRow, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";

export default function SheikhDetailPage({ params }: { params?: { id?: string } }) {
  const sheikhId = params?.id || "";
  const [sheikh, setSheikh] = useState<any>(null);
  const [lessons, setLessons] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sheikhId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getSheikhById(sheikhId)
      .then(({ sheikh: row, lessons: rows }) => {
        setSheikh(row);
        setLessons((rows || []).map(mapLessonRow));
      })
      .finally(() => setLoading(false));
  }, [sheikhId]);

  usePageView("sheikhs", sheikhId);

  useEffect(() => {
    if (!sheikh?.name) return;
    applyPageSeo({
      path: `/sheikhs/${sheikhId}`,
      title: `${sheikh.name} | المشايخ — المجلس العلمي`,
      description: [sheikh.ijazah, sheikh.city].filter(Boolean).join(" — "),
      canonicalPath: `/sheikhs/${sheikhId}`,
    });
  }, [sheikh, sheikhId]);

  if (loading) return <Loading />;
  if (!sheikh) return <Empty text="تعذر العثور على هذا الشيخ." />;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="المشايخ"
        title={sheikh.name}
        subtitle={[sheikh.city, sheikh.ijazah].filter(Boolean).join(" · ")}
      />

      {sheikh.bio && <p className="seo-listing-intro">{sheikh.bio}</p>}

      {Array.isArray(sheikh.specialties) && sheikh.specialties.length > 0 && (
        <div className="sheikh-detail-tags" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {sheikh.specialties.map((tag: string) => (
            <span key={tag} className="ui-tag">{tag}</span>
          ))}
        </div>
      )}

      <h2 className="home-section-title">الدروس المرتبطة</h2>
      {lessons.length === 0 ? (
        <Empty text="لا توجد دروس معتمدة مرتبطة بهذا الشيخ حالياً." />
      ) : (
        <div className="seo-listing-links">
          {lessons.map((lesson) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
              {lesson.title}
            </Link>
          ))}
        </div>
      )}

      <RelatedKnowledge query={sheikh.name} title="محتوى ذو صلة بالشيخ" limit={8} />
    </div>
  );
}
