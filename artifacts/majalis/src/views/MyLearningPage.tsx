import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
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

  if (loading) return <Loading />;

  return (
    <div className="page-shell">
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>لوحتي التعليمية</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: "2rem" }}>تقدمك في طلب العلم — إحصاءات، إنجازات، ومكتبتك الشخصية</p>

      <div className="personal-hub-links" style={{ marginBottom: "1.5rem" }}>
        <Link href="/my-library" className="ds-btn ds-btn--ghost ds-btn--sm">مكتبتي</Link>
        <Link href="/my-academic-profile" className="ds-btn ds-btn--ghost ds-btn--sm">ملفي العلمي</Link>
        <Link href="/my-learning-plan" className="ds-btn ds-btn--ghost ds-btn--sm">خطة طلب العلم</Link>
      </div>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <StatCard label="دروس مكتملة" value={stats.completed_lessons} />
          <StatCard label="مسارات مكتملة" value={stats.completed_paths} />
          <StatCard label="كتب محفوظة" value={stats.books_read} />
          <StatCard label="اختبارات" value={stats.quiz_attempts} />
          <StatCard label="نسبة الإنجاز" value={`${stats.completion_pct}%`} />
          <StatCard label="إنجازات" value={stats.achievements_count} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <section style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>مساراتي</h2>
          {progress?.enrollments && Object.keys(progress.enrollments).length > 0 ? (
            Object.entries(progress.enrollments).map(([slug, e]: [string, any]) => (
              <Link key={slug} href={`/learning/paths/${slug}`} style={{ display: "block", padding: "0.5rem 0", textDecoration: "none" }}>
                {slug} — {e.progress_pct || 0}%
              </Link>
            ))
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>
              لم تسجّل في مسار بعد. <Link href="/learning/paths">ابدأ الآن</Link>
            </p>
          )}
        </section>

        <section style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>الشهادات</h2>
          {certificates.length > 0 ? (
            certificates.map((c) => (
              <div key={c.certificate_code} style={{ padding: "0.5rem 0", fontSize: "0.875rem" }}>
                <strong>{c.title}</strong>
                <span style={{ display: "block", color: "var(--ink-soft)", fontSize: "0.75rem" }}>
                  {c.certificate_code} · {new Date(c.issued_at).toLocaleDateString("ar-KW")}
                </span>
              </div>
            ))
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>أكمل مسارًا للحصول على شهادة</p>
          )}
        </section>

        <section style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>المكتبة الشخصية</h2>
          {library.length > 0 ? (
            library.slice(0, 8).map((item, i) => (
              <div key={i} style={{ fontSize: "0.8125rem", padding: "0.25rem 0" }}>{item.title}</div>
            ))
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>احفظ كتبًا ودروسًا من المنصة</p>
          )}
        </section>

        <section style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>ملاحظاتي</h2>
          {notes.length > 0 ? (
            notes.slice(0, 5).map((n, i) => (
              <div key={i} style={{ fontSize: "0.8125rem", padding: "0.25rem 0" }}>{n.title || n.body?.slice(0, 60)}</div>
            ))
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--ink-soft)" }}>دوّن ملاحظاتك أثناء الدراسة</p>
          )}
        </section>
      </div>

      {stats && stats.achievements && stats.achievements.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>الإنجازات</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {stats.achievements.map((a) => (
              <span key={a.key} style={{ padding: "0.375rem 0.75rem", borderRadius: "999px", background: "var(--emerald-light, #d1fae5)", fontSize: "0.8125rem" }}>
                {a.title}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)", textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}
