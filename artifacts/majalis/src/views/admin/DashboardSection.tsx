import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminGetDashboardStats, adminResolveReport } from "@/lib/supabase";
import { getCmsDashboardStats } from "@/lib/cms/supabase-cms";
import { getTopSearchQueries } from "@/lib/search-history";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { Loading } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import { useAdminShell, type AdminSection } from "./AdminShell";

type DashboardData = Awaited<ReturnType<typeof adminGetDashboardStats>>;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return "طاب سهركم";
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء النور";
}

function getArabicDate(): string {
  return new Date().toLocaleDateString("ar-KW", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type StatCard = {
  label: string;
  value: number;
  icon: string;
  accent: string;
  section?: AdminSection;
};

type StatGroup = {
  title: string;
  cards: StatCard[];
};

type QuickAction =
  | { icon: string; label: string; action: () => void; href?: never; primary?: boolean }
  | { icon: string; label: string; href: string; action?: never; primary?: boolean };

export function DashboardSection() {
  const { showError, showSuccess, onSectionChange } = useAdminShell();
  const { user } = useAuth();

  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [cmsStats, setCmsStats]   = useState<Awaited<ReturnType<typeof getCmsDashboardStats>> | null>(null);
  const [localSearches, setLocalSearches] = useState<{ query: string; count: number }[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([adminGetDashboardStats(), getCmsDashboardStats()])
      .then(([result, cms]) => {
        setData(result);
        setCmsStats(cms);
      })
      .catch(() => {
        showError("تعذّر تحميل بيانات لوحة التحكم.");
      })
      .finally(() => setLoading(false));
    setLocalSearches(getTopSearchQueries(6));
  };

  useEffect(() => { load(); }, []);

  const resolveReport = async (id: string) => {
    const { error } = await adminResolveReport(id);
    if (error) { showError("تعذّر إغلاق البلاغ."); return; }
    showSuccess("تم إغلاق البلاغ.");
    load();
  };

  if (loading || !data) return <Loading />;

  const { stats, recentReports, recentLessons, topViewedLessons, topSearches } = data;
  const searches = topSearches.length > 0 ? topSearches : localSearches;
  const fullName = user?.profile?.full_name ?? "المشرف";

  const STAT_GROUPS: StatGroup[] = [
    {
      title: "المحتوى",
      cards: [
        { label: "الدروس",          value: stats.totalLessons,         icon: "🎬", accent: "#1a6b52", section: "lessons" },
        { label: "دورات",            value: stats.coursesCount,         icon: "🎓", accent: "#1a6b52" },
        { label: "المشايخ",          value: stats.totalSheikhs,         icon: "👤", accent: "#8a6d1e", section: "sheikhs" },
        { label: "الكتب",            value: stats.totalBooks,           icon: "📚", accent: "#8a6d1e" },
        { label: "الفوائد",          value: stats.totalBenefits,        icon: "💡", accent: "#1a6b52", section: "fawaid" },
        { label: "الأسئلة",          value: stats.totalQA,              icon: "❓", accent: "#1a6b52", section: "qa" },
        { label: "الإعجاز العلمي",  value: stats.totalMiracles,        icon: "✨", accent: "#0369a1", section: "miracles" },
        { label: "القصص",            value: stats.totalStories,         icon: "🕌", accent: "#1a6b52" },
      ],
    },
    {
      title: "الشريعة",
      cards: [
        { label: "الأحاديث",         value: stats.totalHadith,          icon: "📜", accent: "#8a6d1e" },
        { label: "الأحكام",          value: stats.totalRulings,         icon: "⚖️", accent: "#7c3aed", section: "rulings" },
        { label: "قرارات الفقه",     value: stats.totalFiqhItems,       icon: "🏛️", accent: "#c2410c", section: "fiqh-council" },
        { label: "التفريغات",        value: stats.totalTranscriptions,  icon: "📝", accent: "#0f766e" },
      ],
    },
    {
      title: "المستخدمون والنظام",
      cards: [
        { label: "المستخدمون",       value: stats.totalUsers,           icon: "👥", accent: "#1d4ed8", section: "users" },
        { label: "مشاهدات اليوم",    value: stats.todayViews,           icon: "👁️", accent: "#475569" },
        { label: "بلاغات معلّقة",    value: stats.pendingReports,       icon: "🚩", accent: stats.pendingReports > 0 ? "#dc2626" : "#475569" },
      ],
    },
  ];

  const QUICK_ACTIONS: QuickAction[] = [
    { icon: "🎬", label: "الدروس",          action: () => onSectionChange("lessons"), primary: true },
    { icon: "👤", label: "المشايخ",         action: () => onSectionChange("sheikhs") },
    { icon: "📚", label: "المكتبة",         action: () => onSectionChange("library") },
    { icon: "❓", label: "الأسئلة",         action: () => onSectionChange("qa") },
    { icon: "💡", label: "الفوائد",         action: () => onSectionChange("fawaid") },
    { icon: "🔍", label: "مراجعة المحتوى",  href: "/admin/automation/review" },
    { icon: "⬆️", label: "استيراد",         href: "/admin/auto-content" },
    { icon: "⚙️", label: "الأتمتة",         href: "/admin/automation/center" },
  ];

  const dbOk = isSupabaseConfigured() && stats.dbConnected !== false;

  return (
    <div>
      {/* ── بانر الترحيب ── */}
      <div className="admin-welcome">
        <div className="admin-welcome__text">
          <p className="admin-welcome__greeting">{getGreeting()}</p>
          <p className="admin-welcome__name">{fullName}</p>
          <p className="admin-welcome__date">{getArabicDate()}</p>
        </div>
        <div className="admin-welcome__icon" aria-hidden="true">🕌</div>
      </div>

      {/* ── حالة النظام ── */}
      <div className="admin-status-row">
        <span className={`admin-status-dot admin-status-dot--${dbOk ? "ok" : "warn"}`}>
          قاعدة البيانات: {dbOk ? "متصلة" : "غير متاحة"}
        </span>
        <span className={`admin-status-dot admin-status-dot--${stats.serverOk ? "ok" : "warn"}`}>
          الخادم: {stats.serverOk ? "يعمل" : "تحقق يدوياً"}
        </span>
        {stats.pendingReports > 0 && (
          <span className="admin-status-dot admin-status-dot--error">
            {stats.pendingReports} بلاغ معلّق
          </span>
        )}
        {cmsStats && (
          <span className="admin-status-dot admin-status-dot--ok">
            CMS: {cmsStats.indexTotal.toLocaleString("ar")} مفهرس
          </span>
        )}
      </div>

      {/* ── الأفعال السريعة ── */}
      <div className="admin-quick-actions">
        {QUICK_ACTIONS.map((qa) =>
          qa.href ? (
            <Link
              key={qa.label}
              href={qa.href}
              className={`admin-quick-action${qa.primary ? " admin-quick-action--primary" : ""}`}
            >
              <span>{qa.icon}</span>
              <span>{qa.label}</span>
            </Link>
          ) : (
            <button
              key={qa.label}
              type="button"
              onClick={qa.action}
              className={`admin-quick-action${qa.primary ? " admin-quick-action--primary" : ""}`}
            >
              <span>{qa.icon}</span>
              <span>{qa.label}</span>
            </button>
          )
        )}
      </div>

      {/* ── الإحصائيات ── */}
      {STAT_GROUPS.map((group) => (
        <div key={group.title} className="admin-stat-section">
          <p className="admin-stat-section__title">{group.title}</p>
          <div className="admin-stat-grid">
            {group.cards.map((card) => (
              <div
                key={card.label}
                className={`admin-stat-card${card.section ? " admin-stat-card--clickable" : ""}`}
                style={{ "--card-accent": card.accent } as React.CSSProperties}
                onClick={() => card.section && onSectionChange(card.section)}
                role={card.section ? "button" : undefined}
                tabIndex={card.section ? 0 : undefined}
                onKeyDown={(e) => {
                  if (card.section && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSectionChange(card.section);
                  }
                }}
              >
                <span className="admin-stat-card__icon">{card.icon}</span>
                <p className="admin-stat-card__value">
                  {card.value.toLocaleString("ar")}
                </p>
                <p className="admin-stat-card__label">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── بلاغات معلّقة ── */}
      {recentReports.length > 0 && (
        <div className="admin-reports-panel">
          <p className="admin-reports-panel__title">🚩 بلاغات تحتاج مراجعة</p>
          {recentReports.map((rep: any) => (
            <div key={rep.id} className="admin-report-item">
              <span className="admin-report-item__type">{rep.report_type}</span>
              <p className="admin-report-item__desc">{rep.description}</p>
              <button
                type="button"
                onClick={() => resolveReport(rep.id)}
                className="admin-report-item__btn"
              >
                تمت المراجعة
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── لوحات المعلومات ── */}
      <div className="admin-info-grid">
        {/* آخر الدروس */}
        <div className="admin-info-panel">
          <p className="admin-info-panel__title">🕒 آخر تحديثات الدروس</p>
          {recentLessons.length === 0 ? (
            <p className="admin-info-panel__empty">لا توجد تحديثات حديثة.</p>
          ) : (
            <ul className="admin-info-panel__list">
              {recentLessons.map((lesson: any) => (
                <li key={lesson.id} className="admin-info-panel__item">
                  <span className="admin-info-panel__item-title">{lesson.title}</span>
                  <span className="admin-info-panel__item-meta">
                    {lesson.updated_at
                      ? new Date(lesson.updated_at).toLocaleDateString("ar-KW")
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* أكثر الدروس مشاهدة */}
        <div className="admin-info-panel">
          <p className="admin-info-panel__title">🔥 أكثر الدروس مشاهدة</p>
          {topViewedLessons.length === 0 ? (
            <p className="admin-info-panel__empty">لا توجد مشاهدات مسجّلة بعد.</p>
          ) : (
            <ol className="admin-info-panel__list" style={{ paddingInlineStart: "1.25rem", listStyle: "decimal" }}>
              {topViewedLessons.map((item) => (
                <li key={item.id} className="admin-info-panel__item">
                  <Link
                    href={`/lessons/${item.id}`}
                    className="admin-info-panel__item-title"
                  >
                    {item.title}
                  </Link>
                  <span className="admin-info-panel__item-meta">{item.views} مشاهدة</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* عمليات البحث */}
        <div className="admin-info-panel">
          <p className="admin-info-panel__title">🔍 أكثر عمليات البحث</p>
          {searches.length === 0 ? (
            <p className="admin-info-panel__empty">لا توجد عمليات بحث مسجّلة بعد.</p>
          ) : (
            <ol className="admin-info-panel__list" style={{ paddingInlineStart: "1.25rem", listStyle: "decimal" }}>
              {searches.map((item) => (
                <li key={item.query} className="admin-info-panel__item">
                  <Link
                    href={`/search/${encodeURIComponent(item.query)}`}
                    className="admin-info-panel__item-title"
                  >
                    {item.query}
                  </Link>
                  <span className="admin-info-panel__item-meta">{item.count} مرة</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* حالة CMS */}
        {cmsStats && (
          <div className="admin-info-panel">
            <p className="admin-info-panel__title">📊 فهرس CMS</p>
            <ul className="admin-info-panel__list">
              {[
                { label: "إجمالي المفهرس",     value: cmsStats.indexTotal.toLocaleString("ar") },
                { label: "عمليات استيراد",      value: cmsStats.importJobsTotal.toLocaleString("ar") },
                { label: "أذكار موثقة",         value: cmsStats.verifiedAdhkarTotal.toLocaleString("ar") },
                { label: "سجل تدقيق اليوم",    value: cmsStats.auditLogsToday.toLocaleString("ar") },
                { label: "مجدولة للنشر",        value: cmsStats.scheduledCount.toLocaleString("ar") },
              ].map((row) => (
                <li key={row.label} className="admin-info-panel__item">
                  <span className="admin-info-panel__item-title">{row.label}</span>
                  <span className="admin-info-panel__item-meta">{row.value}</span>
                </li>
              ))}
              {cmsStats.lastImportAt && (
                <li className="admin-info-panel__item">
                  <span className="admin-info-panel__item-title">آخر استيراد</span>
                  <span className="admin-info-panel__item-meta">
                    {cmsStats.lastImportType} · {cmsStats.lastImportStatus}
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
