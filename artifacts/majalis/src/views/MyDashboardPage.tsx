import { useEffect, useState } from "react";
import { Link } from "wouter";
import { RequireAuth } from "@/components/personal/RequireAuth";
import { Loading, PageHeader } from "@/components/ui-common";
import {
  fetchAcademicProfile,
  fetchAllNotes,
  fetchFollowedSheikhs,
  fetchLibraryItems,
  fetchLearningPlan,
  achievementProgress,
  type AcademicProfileStats,
} from "@/lib/personal-learning";
import { fetchFollowedSheikhUpdates } from "@/lib/personal-learning/sheikh-follow";

const HUB_LINKS = [
  { href: "/my-profile", label: "ملفي العلمي", icon: "📊" },
  { href: "/my-library", label: "مكتبتي", icon: "📚" },
  { href: "/my-learning-plan", label: "خطة طلب العلم", icon: "🗓️" },
  { href: "/my-updates", label: "آخر تحديثاتي", icon: "🔔" },
  { href: "/my-learning", label: "المسارات التعليمية", icon: "🎓" },
];

export default function MyDashboardPage() {
  const [profile, setProfile] = useState<AcademicProfileStats | null>(null);
  const [libraryCount, setLibraryCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [followsCount, setFollowsCount] = useState(0);
  const [hasPlan, setHasPlan] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<Array<{ id: string; title: string; sheikhName: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAcademicProfile(),
      fetchLibraryItems(),
      fetchAllNotes(),
      fetchFollowedSheikhs(),
      fetchLearningPlan(),
      fetchFollowedSheikhUpdates(5),
    ])
      .then(([p, lib, notes, follows, plan, updates]) => {
        setProfile(p);
        setLibraryCount(lib.length);
        setNotesCount(notes.length);
        setFollowsCount(follows.length);
        setHasPlan(Boolean(plan?.onboarding_done));
        setRecentUpdates(
          updates.map((u) => ({ id: u.id, title: u.title, sheikhName: u.sheikhName })),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const badges = profile ? achievementProgress(profile) : [];

  return (
    <RequireAuth>
      <div className="page-shell personal-page personal-dashboard" dir="rtl">
        <PageHeader
          eyebrow="مساحتي"
          title="لوحة المستخدم"
          subtitle="نقطة الدخول لمسارك العلمي — ملفك، مكتبتك، خطتك، وإنجازاتك"
        />

        <nav className="personal-hub-grid" aria-label="أقسام مساحتي">
          {HUB_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="personal-hub-card">
              <span className="personal-hub-card__icon" aria-hidden>{link.icon}</span>
              <span className="personal-hub-card__label">{link.label}</span>
            </Link>
          ))}
        </nav>

        {loading ? (
          <Loading />
        ) : profile ? (
          <>
            <div className="personal-stats-grid">
              <div className="personal-stat-card personal-stat-card--highlight">
                <span className="personal-stat-value">{profile.current_streak}</span>
                <span className="personal-stat-label">سلسلة الأيام</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{profile.saved_lessons}</span>
                <span className="personal-stat-label">دروس محفوظة</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{libraryCount}</span>
                <span className="personal-stat-label">عناصر المكتبة</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{notesCount}</span>
                <span className="personal-stat-label">ملاحظات</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{followsCount}</span>
                <span className="personal-stat-label">مشايخ أتابعهم</span>
              </div>
              <div className="personal-stat-card">
                <span className="personal-stat-value">{Math.round(profile.total_platform_minutes / 60 * 10) / 10}h</span>
                <span className="personal-stat-label">وقت المنصة</span>
              </div>
            </div>

            <div className="personal-profile-columns">
              <section className="personal-panel">
                <h2>ملخص سريع</h2>
                <ul className="personal-rank-list">
                  <li><span>دروس مكتملة</span><strong>{profile.completed_lessons}</strong></li>
                  <li><span>كتب</span><strong>{profile.books_read}</strong></li>
                  <li><span>أبحاث</span><strong>{profile.research_read}</strong></li>
                  <li><span>نسبة النجاح</span><strong>{profile.qa_success_rate}%</strong></li>
                  <li><span>خطة طلب العلم</span><strong>{hasPlan ? "مفعّلة" : "—"}</strong></li>
                </ul>
                {profile.last_activity && (
                  <p className="personal-last-activity">
                    آخر نشاط: {new Date(profile.last_activity).toLocaleString("ar-KW")}
                  </p>
                )}
              </section>

              <section className="personal-panel">
                <h2>آخر تحديثات المشايخ</h2>
                {recentUpdates.length ? (
                  <ul className="personal-rank-list">
                    {recentUpdates.map((u) => (
                      <li key={u.id}>
                        <Link href={`/lessons/${u.id}`}>{u.title}</Link>
                        <span className="personal-stat-sub">{u.sheikhName}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="personal-empty-hint">
                    <Link href="/sheikhs">تابع مشايخك</Link> لرؤية دروسهم الجديدة هنا
                  </p>
                )}
              </section>
            </div>

            <section className="personal-panel">
              <h2>الإنجازات العلمية</h2>
              <div className="personal-badges">
                {badges.map((b) => (
                  <span
                    key={b.key}
                    className={`ui-tag ${b.earned ? "ui-tag--verified" : ""}`}
                    title={b.description}
                  >
                    {b.icon} {b.title}{b.earned ? "" : ` (${b.progress}%)`}
                  </span>
                ))}
              </div>
            </section>
          </>
        ) : (
          <p>سجّل الدخول لعرض لوحتك.</p>
        )}
      </div>
    </RequireAuth>
  );
}
