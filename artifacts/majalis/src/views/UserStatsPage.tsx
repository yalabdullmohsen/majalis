import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/ui-common";
import { computeStreakDays, computeTasbeehStats, readTasbeehAwrad } from "@/lib/tasbeeh-storage";
import { getDailyWirdState } from "@/lib/quran-api";
import { getMyRegistrations } from "@/lib/supabase";

type Stat = { label: string; value: string | number; sub?: string };

function StatCard({ label, value, sub }: Stat) {
  return (
    <div className="ui-card user-stat-card">
      <span className="user-stat-card__label">{label}</span>
      <strong className="user-stat-card__value">{value}</strong>
      {sub && <span className="user-stat-card__sub">{sub}</span>}
    </div>
  );
}

export default function UserStatsPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [registrations, setRegistrations] = useState<{ lesson_id: string }[]>([]);
  const [regsLoading, setRegsLoading] = useState(false);

  // Local stats (from localStorage)
  const tasbihItems = useMemo(() => readTasbeehAwrad(), []);
  const tasbihStreak = useMemo(() => computeStreakDays(tasbihItems), [tasbihItems]);
  const tasbihTotal = useMemo(
    () => tasbihItems.reduce((s, w) => s + computeTasbeehStats(w).total, 0),
    [tasbihItems],
  );
  const tasbihToday = useMemo(
    () => tasbihItems.reduce((s, w) => s + computeTasbeehStats(w).today, 0),
    [tasbihItems],
  );

  // Quran progress
  const wird = useMemo(() => {
    try { return getDailyWirdState(); } catch { return null; }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    setRegsLoading(true);
    getMyRegistrations(user.id)
      .then((rows) => setRegistrations(rows ?? []))
      .catch(() => setRegistrations([]))
      .finally(() => setRegsLoading(false));
  }, [isLoggedIn, user?.id]);

  if (authLoading) {
    return <div className="page-shell narrow" dir="rtl"><p style={{ color: "#9ca3af" }}>جارٍ التحميل…</p></div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="page-shell narrow" dir="rtl" style={{ textAlign: "center", paddingTop: "3rem" }}>
        <p style={{ marginBottom: "1rem", color: "#6b7280" }}>سجّل الدخول لعرض إحصاءاتك الشخصية.</p>
        <Link href="/login?next=/stats" className="ui-card-btn">تسجيل الدخول</Link>
      </div>
    );
  }

  const displayName = user?.profile?.full_name || user?.email?.split("@")[0] || "مستخدم";

  return (
    <div className="page-shell narrow" dir="rtl">
      <PageHeader
        eyebrow="حسابك"
        title={`أهلاً، ${displayName}`}
        subtitle="ملخص نشاطك وإحصاءاتك على المنصة."
      />

      {/* ── التسبيح ── */}
      <section className="user-stats-section">
        <h2 className="user-stats-section__title">الأذكار والتسبيح</h2>
        <div className="user-stats-grid">
          <StatCard label="إجمالي التسبيح" value={tasbihTotal.toLocaleString("ar-KW")} sub="منذ البداية" />
          <StatCard label="اليوم" value={tasbihToday.toLocaleString("ar-KW")} />
          <StatCard label="التتابع" value={tasbihStreak > 0 ? `${tasbihStreak} 🔥` : "—"} sub="يوم متتالي" />
          <StatCard label="الأوراد" value={tasbihItems.length} sub="وِرد مضاف" />
        </div>
      </section>

      {/* ── القرآن ── */}
      {wird && (
        <section className="user-stats-section">
          <h2 className="user-stats-section__title">القرآن الكريم</h2>
          <div className="user-stats-grid">
            <StatCard label="آخر موضع" value={`سورة ${wird.currentSurah} — آية ${wird.currentAyah}`} />
            <StatCard label="صفحات هذا الشهر" value={wird.monthlyTotal ?? 0} sub="صفحة" />
            <StatCard label="الهدف اليومي" value={`${wird.pagesPerDay} صفحة/يوم`} />
          </div>
        </section>
      )}

      {/* ── الدروس ── */}
      <section className="user-stats-section">
        <h2 className="user-stats-section__title">الدروس العلمية</h2>
        {regsLoading ? (
          <p style={{ color: "#9ca3af" }}>جارٍ التحميل…</p>
        ) : (
          <div className="user-stats-grid">
            <StatCard label="الدروس المسجّلة" value={registrations.length} sub="درس" />
          </div>
        )}
        <Link href="/lessons" className="user-stats-link">تصفح الدروس ←</Link>
      </section>

      {/* ── معلومات الحساب ── */}
      <section className="user-stats-section">
        <h2 className="user-stats-section__title">معلومات الحساب</h2>
        <div className="ui-card" style={{ padding: "1rem", display: "grid", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span style={{ color: "#6b7280" }}>البريد</span>
            <span>{user?.email ?? "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span style={{ color: "#6b7280" }}>تاريخ الانضمام</span>
            <span>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("ar-KW", { dateStyle: "medium" })
                : "—"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
