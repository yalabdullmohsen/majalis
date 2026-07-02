import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import type { LPProgress, LPAchievement, LPStreak } from "@/lib/learning-path-service";
import { fetchProgress, fetchAchievements, fetchStreak } from "@/lib/learning-path-service";

const AchievementBadges = lazy(() =>
  import("@/components/learning-path/AchievementBadges").then((m) => ({ default: m.AchievementBadges }))
);
const StreakCounter = lazy(() =>
  import("@/components/learning-path/StreakCounter").then((m) => ({ default: m.StreakCounter }))
);

export default function LearningPathDashboardPage() {
  const { session, isLoggedIn } = useAuth();
  const [progress, setProgress]         = useState<LPProgress[]>([]);
  const [achievements, setAchievements] = useState<LPAchievement[]>([]);
  const [streak, setStreak]             = useState<LPStreak>({ current_streak: 0, longest_streak: 0, last_activity_date: null });
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!session?.access_token) { setLoading(false); return; }
    const token = session.access_token;

    Promise.all([
      fetchProgress(token).catch(() => [] as LPProgress[]),
      fetchAchievements(token).catch(() => [] as LPAchievement[]),
      fetchStreak(token).catch(() => ({ current_streak: 0, longest_streak: 0, last_activity_date: null })),
    ]).then(([p, a, s]) => {
      setProgress(p);
      setAchievements(a);
      setStreak(s);
    }).finally(() => setLoading(false));
  }, [session?.access_token]);

  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">🔒</div>
        <p className="text-gray-600 dark:text-gray-400">يجب تسجيل الدخول لعرض لوحتك التعليمية</p>
        <Link href="/login">
          <span className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors cursor-pointer">
            تسجيل الدخول
          </span>
        </Link>
      </div>
    );
  }

  const completed   = progress.filter((p) => p.status === "completed");
  const inProgress  = progress.filter((p) => p.status === "in_progress");

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-l from-emerald-800 to-emerald-600 text-white px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/learning-path">
            <span className="text-emerald-200 hover:text-white text-sm cursor-pointer inline-flex items-center gap-1 mb-3">
              ← خارطة طالب العلم
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1">📊 لوحتي التعليمية</h1>
          <p className="text-emerald-100 text-sm">تابع تقدمك وإنجازاتك في مسيرة طلب العلم</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { value: completed.length,  label: "كتاب مكتمل",  bg: "#dcfce7", color: "#15803d" },
                { value: inProgress.length, label: "جاري حالياً", bg: "#fef9c3", color: "#854d0e" },
                { value: progress.length,   label: "كتاب بدأت",   bg: "#eff6ff", color: "#1d4ed8" },
                { value: achievements.length, label: "وسام حصلت",  bg: "#faf5ff", color: "#6b21a8" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4 text-center border"
                  style={{ background: stat.bg, borderColor: `${stat.color}30` }}
                >
                  <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs mt-1" style={{ color: stat.color }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* الأيام المتتالية */}
            <div className="mb-8">
              <h2 className="font-bold text-gray-800 dark:text-white text-base mb-3">🔥 الأيام المتتالية</h2>
              <Suspense fallback={<div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />}>
                <StreakCounter streak={streak} />
              </Suspense>
            </div>

            {/* الكتب الجارية */}
            {inProgress.length > 0 && (
              <div className="mb-8">
                <h2 className="font-bold text-gray-800 dark:text-white text-base mb-3">⏳ تابع من حيث توقفت</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inProgress.slice(0, 4).map((p) => (
                    <Link key={p.book_id} href={`/learning-path/book/${p.book_id}`}>
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-all cursor-pointer">
                        <span className="text-2xl">📖</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">كتاب جاري</p>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-1.5">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${p.progress_percent}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{p.progress_percent}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* الإنجازات */}
            <div className="mb-8">
              <h2 className="font-bold text-gray-800 dark:text-white text-base mb-3">🏅 الأوسمة والإنجازات</h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                <Suspense fallback={<div className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />}>
                  <AchievementBadges achievements={achievements} />
                </Suspense>
              </div>
            </div>

            {/* اقتراح */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center">
              <p className="text-emerald-800 dark:text-emerald-300 font-medium mb-3">
                {completed.length === 0
                  ? "ابدأ أول كتاب في مسيرتك العلمية اليوم!"
                  : `أحسنت! أكملت ${completed.length} كتاب. تابع مسيرتك!`}
              </p>
              <Link href="/learning-path">
                <span className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors cursor-pointer text-sm">
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
