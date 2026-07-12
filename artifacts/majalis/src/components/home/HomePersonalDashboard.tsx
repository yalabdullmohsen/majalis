import { Link } from "wouter";
import { ArrowLeft, BookMarked, BookOpen, GraduationCap, PlayCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRecentProgress } from "@/hooks/useRecentProgress";

const CONTENT_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  lesson:        PlayCircle,
  lesson_detail: PlayCircle,
  course:        BookMarked,
  quran:         BookOpen,
};

/**
 * يظهر أعلى الصفحة الرئيسية للمستخدمين المسجلين فقط.
 * يعرض تحية شخصية وآخر نشاطين لاستئناف التعلم.
 */
export function HomePersonalDashboard() {
  const { isLoggedIn, user } = useAuth();
  const { items, loading } = useRecentProgress(2);

  if (!isLoggedIn) return null;

  const rawProfile = user?.profile as Record<string, unknown> | null | undefined;
  const fullName   = rawProfile?.full_name as string | undefined;
  const firstName  = fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";
  const greeting   = firstName ? `أهلاً، ${firstName}` : "أهلاً بك";

  return (
    <div className="hpd-wrap" dir="rtl" aria-label="لوحتي الشخصية">
      <div className="hpd-inner">
        {/* الرأس */}
        <div className="hpd-header">
          <div>
            <p className="hpd-greeting">{greeting}</p>
            <p className="hpd-sub">استمر في رحلتك العلمية</p>
          </div>
          <Link href="/my-learning" className="hpd-link">
            حسابي <ArrowLeft size={12} aria-hidden="true" />
          </Link>
        </div>

        {/* عناصر الاستئناف */}
        {!loading && items.length > 0 && (
          <div className="hpd-items">
            {items.map((item) => {
              const Icon = CONTENT_ICONS[item.content_type] ?? BookOpen;
              const pct  = Math.min(100, item.progress_pct ?? 0);
              return (
                <Link key={item.id} href={item.content_url ?? "#"} className="hpd-item">
                  <span className="hpd-item__icon"><Icon size={14} /></span>
                  <div className="hpd-item__body">
                    <p className="hpd-item__title">{item.content_title ?? "محتوى"}</p>
                    <div
                      className="hpd-item__bar"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="hpd-item__pct">{pct}%</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* حالة فارغة */}
        {!loading && items.length === 0 && (
          <div className="hpd-empty">
            <GraduationCap size={15} strokeWidth={1.6} aria-hidden="true" />
            <span>ابدأ درسك الأول</span>
            <Link href="/lessons" className="hpd-empty__cta">الدروس</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePersonalDashboard;
