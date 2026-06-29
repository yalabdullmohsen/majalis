import { useEffect, useState } from "react";
import { Link } from "wouter";
import { RequireAuth } from "@/components/personal/RequireAuth";
import { Loading, PageHeader } from "@/components/ui-common";
import { fetchFollowedSheikhUpdates, fetchFollowedSheikhs } from "@/lib/personal-learning/sheikh-follow";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

export default function MyUpdatesPage() {
  const [updates, setUpdates] = useState<KuwaitLessonRecord[]>([]);
  const [follows, setFollows] = useState<Array<{ sheikh_name?: string; sheikh_id: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchFollowedSheikhUpdates(30), fetchFollowedSheikhs()])
      .then(([u, f]) => {
        setUpdates(u);
        setFollows(f);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <RequireAuth>
      <div className="page-shell personal-page" dir="rtl">
        <PageHeader
          eyebrow="مساحتي"
          title="آخر تحديثاتي"
          subtitle="دروس جديدة من المشايخ الذين تتابعهم"
        />

        <div className="personal-hub-links">
          <Link href="/my-dashboard" className="ds-btn ds-btn--ghost ds-btn--sm">لوحة المستخدم</Link>
          <Link href="/sheikhs" className="ds-btn ds-btn--ghost ds-btn--sm">المشايخ</Link>
        </div>

        {loading ? (
          <Loading />
        ) : follows.length === 0 ? (
          <div className="personal-panel">
            <p>لم تتابع أي شيخ بعد.</p>
            <Link href="/sheikhs" className="ds-btn ds-btn--primary ds-btn--sm">استكشف المشايخ</Link>
          </div>
        ) : updates.length === 0 ? (
          <p className="personal-empty-hint">لا توجد دروس جديدة حالياً — عد لاحقاً.</p>
        ) : (
          <ul className="personal-updates-list">
            {updates.map((lesson) => (
              <li key={lesson.id} className="personal-panel">
                <Link href={`/lessons/${lesson.id}`} className="personal-update-title">{lesson.title}</Link>
                <p className="personal-stat-sub">{lesson.sheikhName} · {lesson.category}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </RequireAuth>
  );
}
