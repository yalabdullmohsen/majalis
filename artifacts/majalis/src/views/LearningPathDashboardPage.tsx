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
      <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] flex flex-col items-center justify-center gap-4">
        <Lock size={40} strokeWidth={1.3} aria-hidden="true" />
        <p className="text-[var(--majalis-ink-soft)]">يجب تسجيل الدخول لعرض لوحتك التعليمية</p>
        <Link href="/login">
          <span className="px-6 py-2.5 citation-btn citation-btn--primary rounded-xl font-medium transition-colors cursor-pointer">
            تسجيل الدخول
          </span>
        </Link>
      </div>
    );
  }

  const completed   = progress.filter((p) => p.status === "completed");
  const inProgress  = progress.filter((p) => p.status === "in_progress");

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] pb-24">
      {/* Hero */}
      <div className="text-white px-4 py-10 ldb-hero">
        <div className="max-w-4xl mx-auto">
          <Link href="/learning-path">
            <span className="text-emerald-200 hover:text-white text-sm cursor-pointer inline-flex items-center gap-1 mb-3">
              ← خارطة طالب العلم
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1">لوحتي التعليمية</h1>
          <p className="text-emerald-100 text-sm">تابع تقدمك وإنجازاتك في مسيرة طلب العلم</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[var(--majalis-parchment-deep)] rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { value: completed.length,  label: "كتاب مكتمل",  bg: "#dcfce7", color: "#15803d" },
                { value: inProgress.length, label: "جاري حالياً", bg: "#E6EDE9", color: "#18362A" },
                { value: progress.length,   label: "كتاب بدأت",   bg: "#eff6ff", color: "#1d4ed8" },
                { value: achievements.length, label: "وسام حصلت",  bg: "#faf5ff", color: "#6b21a8" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4 text-center border ldb-stat-card"
                  style={{ "--stat-bg": stat.bg, "--stat-color": stat.color } as React.CSSProperties}
                >
                  <div className="text-3xl font-bold ldb-stat-val">{stat.value}</div>
                  <div className="text-xs mt-1 ldb-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* الأيام المتتالية */}
            <div className="mb-8">
              <h2 className="font-bold text-[var(--majalis-ink)] text-base mb-3 flex items-center gap-2"><Flame size={16} strokeWidth={1.8} aria-hidden="true" /> الأيام المتتالية</h2>
              <Suspense fallback={<div className="h-20 bg-[var(--majalis-parchment-deep)] rounded-2xl animate-pulse" />}>
                <StreakCounter streak={streak} />
              </Suspense>
            </div>

            {/* الكتب الجارية */}
            {inProgress.length > 0 && (
              <div className="mb-8">
                <h2 className="font-bold text-[var(--majalis-ink)] text-base mb-3 flex items-center gap-2"><Clock size={16} strokeWidth={1.8} aria-hidden="true" /> تابع من حيث توقفت</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inProgress.slice(0, 4).map((p) => (
                    <Link key={p.book_id} href={`/learning-path/book/${p.book_id}`}>
                      <div className="flex items-center gap-3 p-3 bg-[var(--majalis-panel)] rounded-xl border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-all cursor-pointer">
                        <span className="text-2xl" aria-hidden="true"><BookOpen size={22} strokeWidth={1.5} /></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--majalis-ink-soft)] line-clamp-1">كتاب جاري</p>
                          <div className="h-1.5 bg-[var(--majalis-parchment-deep)] rounded-full mt-1.5">
                            <div className="h-full bg-yellow-400 rounded-full ldb-prog-fill" style={{ "--ldb-prog": `${p.progress_percent}%` } as React.CSSProperties} />
                          </div>
                        </div>
                        <span className="text-xs text-[var(--majalis-ink-soft)] opacity-60">{p.progress_percent}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* الإنجازات */}
            <div className="mb-8">
              <h2 className="font-bold text-[var(--majalis-ink)] text-base mb-3 flex items-center gap-2"><Medal size={16} strokeWidth={1.8} aria-hidden="true" /> الأوسمة والإنجازات</h2>
              <div className="bg-[var(--majalis-panel)] rounded-2xl border border-[var(--majalis-line)] p-5">
                <Suspense fallback={<div className="h-24 bg-[var(--majalis-parchment-deep)] rounded-xl animate-pulse" />}>
                  <AchievementBadges achievements={achievements} />
                </Suspense>
              </div>
            </div>

            {/* اقتراح */}
            <div className="bg-[var(--majalis-emerald-muted)] rounded-2xl p-5 text-center ldb-suggest">
              <p className="text-[var(--majalis-emerald)] font-medium mb-3">
                {completed.length === 0
                  ? "ابدأ أول كتاب في مسيرتك العلمية اليوم!"
                  : `أحسنت! أكملت ${completed.length} كتاب. تابع مسيرتك!`}
              </p>
              <Link href="/learning-path">
                <span className="inline-block px-6 py-2.5 citation-btn citation-btn--primary rounded-xl font-medium transition-colors cursor-pointer text-sm">
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
