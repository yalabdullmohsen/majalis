import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SkeletonCardGrid } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import {
  fetchUserLearningStats,
  fetchUserProgress,
  fetchUserCertificates,
  fetchPersonalLibrary,
  fetchLearningNotes,
  type UserStats,
  type Certificate,
} from "@/lib/digital-learning-service";

export default function MyLearningPage() {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/my-learning",
      title: "تعلمي | المجلس العلمي",
      description: "مركز التعلم الشخصي، إحصائياتك وشهاداتك ومكتبتك وملاحظاتك في المجلس العلمي.",
      keywords: ["تعلمي", "تقدم التعلم", "شهادات إسلامية", "إحصائيات تعليمية"],
      robots: "noindex, follow",
    });
  }, []);
  const [progress, setProgress] = useState<any>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchUserLearningStats(),
      fetchUserProgress(),
      fetchUserCertificates(),
      fetchPersonalLibrary(),
      fetchLearningNotes(),
    ])
      .then(([s, p, c, l, n]) => {
        setStats(s);
        setProgress(p);
        setCertificates(c);
        setLibrary(l);
        setNotes(n);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonCardGrid />;

  return (
    <div className="page-shell">
      <h1 className="myl-title">لوحتي التعليمية</h1>
      <p className="myl-subtitle">تقدمك في طلب العلم، إحصاءات، إنجازات، ومكتبتك الشخصية</p>

      {stats && (
        <div className="myl-stats-grid">
          <StatCard label="دروس مكتملة"   value={stats.completed_lessons} />
          <StatCard label="مسارات مكتملة" value={stats.completed_paths} />
          <StatCard label="كتب محفوظة"    value={stats.books_read} />
          <StatCard label="اختبارات"      value={stats.quiz_attempts} />
          <StatCard label="نسبة الإنجاز"  value={`${stats.completion_pct}%`} />
          <StatCard label="إنجازات"       value={stats.achievements_count} />
        </div>
      )}

      <div className="myl-sections-grid">
        <section className="myl-section">
          <h2 className="myl-section-title">مساراتي</h2>
          {progress?.enrollments && Object.keys(progress.enrollments).length > 0 ? (
            Object.entries(progress.enrollments).map(([slug, e]: [string, any]) => (
              <Link key={slug} href={`/learning/paths/${slug}`} className="myl-path-link">
                {slug}، {e.progress_pct || 0}%
              </Link>
            ))
          ) : (
            <p className="myl-soft-text">
              لم تسجّل في مسار بعد. <Link href="/learning/paths">ابدأ الآن</Link>
            </p>
          )}
        </section>

        <section className="myl-section">
          <h2 className="myl-section-title">الشهادات</h2>
          {certificates.length > 0 ? (
            certificates.map((c) => (
              <div key={c.certificate_code} className="myl-cert-item">
                <strong>{c.title}</strong>
                <span className="myl-cert-code">
                  {c.certificate_code} · {new Date(c.issued_at).toLocaleDateString("ar-KW")}
                </span>
              </div>
            ))
          ) : (
            <p className="myl-soft-text">أكمل مسارًا للحصول على شهادة</p>
          )}
        </section>

        <section className="myl-section">
          <h2 className="myl-section-title">المكتبة الشخصية</h2>
          {library.length > 0 ? (
            library.slice(0, 8).map((item, i) => (
              <div key={i} className="myl-list-item">{item.title}</div>
            ))
          ) : (
            <p className="myl-soft-text">احفظ كتبًا ودروسًا من التطبيق</p>
          )}
        </section>

        <section className="myl-section">
          <h2 className="myl-section-title">ملاحظاتي</h2>
          {notes.length > 0 ? (
            notes.slice(0, 5).map((n, i) => (
              <div key={i} className="myl-list-item">{n.title || n.body?.slice(0, 60)}</div>
            ))
          ) : (
            <p className="myl-soft-text">دوّن ملاحظاتك أثناء الدراسة</p>
          )}
        </section>
      </div>

      {stats && stats.achievements && stats.achievements.length > 0 && (
        <section className="myl-achievements">
          <h2 className="myl-section-title">الإنجازات</h2>
          <div className="myl-achievements-wrap">
            {stats.achievements.map((a) => (
              <span key={a.key} className="myl-achievement-badge">{a.title}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="myl-stat-card">
      <div className="myl-stat-card__val">{value}</div>
      <div className="myl-stat-card__label">{label}</div>
    </div>
  );
}
