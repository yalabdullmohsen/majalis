import { Suspense, lazy, useEffect, useState } from "react";
import { BookOpen, Clock, Flame, Lock, Medal } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import type { LPProgress, LPAchievement, LPStreak } from "@/lib/learning-path-service";
import { fetchProgress, fetchAchievements, fetchStreak } from "@/lib/learning-path-service";

const AchievementBadges = lazy(() =>
  import("@/components/learning-path/AchievementBadges").then((m) => ({ default: m.AchievementBadges }))
);
const StreakCounter = lazy(() =>
  import("@/components/learning-path/StreakCounter").then((m) => ({ default: m.StreakCounter }))
);

export default function LearningPathDashboardPage() {
  const { isLoggedIn } = useAuth();
  const [progress, setProgress]         = useState<LPProgress[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/learning-path/dashboard",
      title: "لوحة تقدم التعلم | المجلس العلمي",
      description: "تابع تقدمك في مسارات التعلم الشرعي — إنجازاتك وسلسلة الأيام ونشاطك في الدراسة الإسلامية.",
      keywords: ["لوحة تعلم", "تقدم شرعي", "إنجازات علمية", "مسار تعليمي", "تعلم إسلامي"],
      robots: "noindex, follow",
    });
  }, []);
  const [achievements, setAchievements] = useState<LPAchievement[]>([]);
  const [streak, setStreak]             = useState<LPStreak>({ current_streak: 0, longest_streak: 0, last_activity_date: null });
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) { setLoading(false); return; }

      return Promise.all([
        fetchProgress(token).catch(() => [] as LPProgress[]),
        fetchAchievements(token).catch(() => [] as LPAchievement[]),
        fetchStreak(token).catch(() => ({ current_streak: 0, longest_streak: 0, last_activity_date: null })),
      ]).then(([p, a, s]) => {
        setProgress(p);
        setAchievements(a);
        setStreak(s);
      }).finally(() => setLoading(false));
    });
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="ldb-auth-gate">
        <Lock size={40} strokeWidth={1.3} aria-hidden="true" />
        <p className="ldb-auth-gate__text">يجب تسجيل الدخول لعرض لوحتك التعليمية</p>
        <Link href="/login">
          <span className="citation-btn citation-btn--primary cursor-pointer">
            تسجيل الدخول
          </span>
        </Link>
      </div>
    );
  }

  const completed  = progress.filter((p) => p.status === "completed");
  const inProgress = progress.filter((p) => p.status === "in_progress");

  return (
    <div dir="rtl" className="ldb-shell">
      <div className="ldb-hero">
        <div className="ldb-hero__inner">
          <Link href="/learning-path">
            <span className="ldb-hero__back">← خارطة طالب العلم</span>
          </Link>
          <h1 className="ldb-hero__title">لوحتي التعليمية</h1>
          <p className="ldb-hero__subtitle">تابع تقدمك وإنجازاتك في مسيرة طلب العلم</p>
        </div>
      </div>

      <div className="ldb-body">
        {loading ? (
          <div className="ldb-skeleton-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="ldb-skeleton-card" />
            ))}
          </div>
        ) : (
          <>
            {/* إحصائيات سريعة */}
            <div className="ldb-stats-grid">
              {[
                { value: completed.length,    label: "كتاب مكتمل",  mod: "ldb-stat--completed"  },
                { value: inProgress.length,   label: "جاري حالياً", mod: "ldb-stat--inprogress" },
                { value: progress.length,     label: "كتاب بدأت",   mod: "ldb-stat--started"    },
                { value: achievements.length, label: "وسام حصلت",   mod: "ldb-stat--achieve"    },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`ldb-stat-card ${stat.mod}`}
                >
                  <div className="ldb-stat-val">{stat.value}</div>
                  <div className="ldb-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* الأيام المتتالية */}
            <div className="ldb-section">
              <h2 className="ldb-section__title"><Flame size={16} strokeWidth={1.8} aria-hidden="true" /> الأيام المتتالية</h2>
              <Suspense fallback={<div className="ldb-skeleton-tall" />}>
                <StreakCounter streak={streak} />
              </Suspense>
            </div>

            {/* الكتب الجارية */}
            {inProgress.length > 0 && (
              <div className="ldb-section">
                <h2 className="ldb-section__title"><Clock size={16} strokeWidth={1.8} aria-hidden="true" /> تابع من حيث توقفت</h2>
                <div className="ldb-inprogress-grid">
                  {inProgress.slice(0, 4).map((p) => (
                    <Link key={p.book_id} href={`/learning-path/book/${p.book_id}`}>
                      <div className="ldb-book-card">
                        <span aria-hidden="true"><BookOpen size={22} strokeWidth={1.5} /></span>
                        <div className="ldb-book-card__body">
                          <p className="ldb-book-card__label">كتاب جاري</p>
                          <div className="ldb-book-card__track">
                            <div className="ldb-book-card__fill" style={{ "--ldb-prog": `${p.progress_percent}%` } as React.CSSProperties} />
                          </div>
                        </div>
                        <span className="ldb-book-card__pct">{p.progress_percent}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* الإنجازات */}
            <div className="ldb-section">
              <h2 className="ldb-section__title"><Medal size={16} strokeWidth={1.8} aria-hidden="true" /> الأوسمة والإنجازات</h2>
              <div className="ldb-achievements-wrap">
                <Suspense fallback={<div className="ldb-skeleton-medium" />}>
                  <AchievementBadges achievements={achievements} />
                </Suspense>
              </div>
            </div>

            {/* اقتراح */}
            <div className="ldb-suggest">
              <p className="ldb-suggest__text">
                {completed.length === 0
                  ? "ابدأ أول كتاب في مسيرتك العلمية اليوم!"
                  : `أحسنت! أكملت ${completed.length} كتاب. تابع مسيرتك!`}
              </p>
              <Link href="/learning-path">
                <span className="citation-btn citation-btn--primary cursor-pointer">
                  استعرض العلوم المتاحة
                </span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
