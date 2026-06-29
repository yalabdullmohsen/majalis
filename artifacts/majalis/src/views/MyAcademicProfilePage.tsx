import { useEffect, useState } from "react";
import { Link } from "wouter";
import { RequireAuth } from "@/components/personal/RequireAuth";
import { Loading, PageHeader } from "@/components/ui-common";
import { fetchAcademicProfile, type AcademicProfileStats } from "@/lib/personal-learning";

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="personal-stat-bar">
      <div className="personal-stat-bar-head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="personal-stat-bar-track">
        <div className="personal-stat-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MyAcademicProfilePage() {
  const [stats, setStats] = useState<AcademicProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcademicProfile().then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <RequireAuth>
      <div className="page-shell personal-page" dir="rtl">
        <PageHeader
          eyebrow="مساحتي العلمية"
          title="ملفي العلمي"
          subtitle="إحصاءات طلب العلم — تتزامن مع مكتبتك ودروسك واختباراتك"
        />

        <div className="personal-hub-links">
          <Link href="/my-library" className="ds-btn ds-btn--ghost ds-btn--sm">مكتبتي</Link>
          <Link href="/my-learning-plan" className="ds-btn ds-btn--ghost ds-btn--sm">خطة طلب العلم</Link>
          <Link href="/my-learning" className="ds-btn ds-btn--ghost ds-btn--sm">لوحتي التعليمية</Link>
        </div>

        {loading ? (
          <Loading />
        ) : !stats ? (
          <p>تعذر تحميل الملف العلمي.</p>
        ) : (
          <>
            <div className="personal-stats-grid">
              <div className="personal-stat-card personal-stat-card--highlight">
                <span className="personal-stat-value">{stats.current_streak}</span>
                <span className="personal-stat-label">سلسلة الأيام 🔥</span>
                <span className="personal-stat-sub">أطول سلسلة: {stats.longest_streak}</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{stats.scientific_level}</span>
                <span className="personal-stat-label">المستوى العلمي</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{stats.study_hours}</span>
                <span className="personal-stat-label">ساعات طلب العلم</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{stats.completed_lessons}</span>
                <span className="personal-stat-label">دروس مكتملة</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{stats.books_read}</span>
                <span className="personal-stat-label">كتب</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{stats.mutoon_studied}</span>
                <span className="personal-stat-label">متون</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{stats.research_read}</span>
                <span className="personal-stat-label">أبحاث</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{stats.qa_success_rate}%</span>
                <span className="personal-stat-label">نسبة الإنجاز</span>
              </div>
            </div>

            <section className="personal-chart-section">
              <h2>توزيع النشاط</h2>
              <StatBar label="المكتبة الشخصية" value={stats.library_total} max={50} />
              <StatBar label="الملاحظات" value={stats.notes_total} max={30} />
              <StatBar label="أسئلة محلولة" value={stats.questions_answered} max={100} />
              <StatBar label="دروس مكتملة" value={stats.completed_lessons} max={50} />
            </section>

            <div className="personal-profile-columns">
              <section className="personal-panel">
                <h2>أكثر المواد دراسة</h2>
                {stats.top_subjects.length ? (
                  <ul className="personal-rank-list">
                    {stats.top_subjects.map((s) => (
                      <li key={s.name}><span>{s.name}</span><strong>{s.count}</strong></li>
                    ))}
                  </ul>
                ) : (
                  <p className="personal-empty-hint">ابدأ بحفظ الدروس حسب التخصص</p>
                )}
              </section>

              <section className="personal-panel">
                <h2>أكثر المشايخ متابعة</h2>
                {stats.top_scholars.length ? (
                  <ul className="personal-rank-list">
                    {stats.top_scholars.map((s) => (
                      <li key={s.name}><span>{s.name}</span><strong>{s.count}</strong></li>
                    ))}
                  </ul>
                ) : (
                  <p className="personal-empty-hint">احفظ دروس مشايخك المفضّلين</p>
                )}
              </section>
            </div>

            {stats.achievements.length > 0 && (
              <section className="personal-panel">
                <h2>الإنجازات</h2>
                <div className="personal-badges">
                  {stats.achievements.map((a) => (
                    <span key={a.key} className="ui-tag ui-tag--verified">{a.title}</span>
                  ))}
                </div>
              </section>
            )}

            {stats.certificates.length > 0 && (
              <section className="personal-panel">
                <h2>الشهادات</h2>
                <ul className="personal-rank-list">
                  {stats.certificates.map((c) => (
                    <li key={c.code}>
                      <span>{c.title}</span>
                      <Link href={`/learning/certificates/${c.code}`}>عرض</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {stats.last_activity && (
              <p className="personal-last-activity">آخر نشاط: {new Date(stats.last_activity).toLocaleString("ar-KW")}</p>
            )}
          </>
        )}
      </div>
    </RequireAuth>
  );
}
