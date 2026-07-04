import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminGetDashboardStats, adminResolveReport } from "@/lib/supabase";
import { getCmsDashboardStats } from "@/lib/cms/supabase-cms";
import { CMS_KIND_LABELS, type CmsContentKind } from "@/lib/cms/content-types";
import { getTopSearchQueries } from "@/lib/search-history";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell, type AdminSection } from "./AdminShell";

type DashboardData = Awaited<ReturnType<typeof adminGetDashboardStats>>;

const EMPTY_DASHBOARD: DashboardData = {
  stats: {
    totalLessons: 0,
    coursesCount: 0,
    lecturesCount: 0,
    regularLessonsCount: 0,
    totalSheikhs: 0,
    totalUsers: 0,
    todayViews: 0,
    totalBooks: 0,
    totalBenefits: 0,
    totalQA: 0,
    totalHadith: 0,
    totalStories: 0,
    totalMiracles: 0,
    totalRulings: 0,
    totalFiqhItems: 0,
    pendingReports: 0,
    totalTranscriptions: 0,
    dbConnected: false,
    serverOk: false,
  },
  recentReports: [],
  recentLessons: [],
  topViewedLessons: [],
  topSearches: [],
} as unknown as DashboardData;

type QuickLink =
  | { icon: string; label: string; section: AdminSection; href?: never; color: string }
  | { icon: string; label: string; href: string; section?: never; color: string };

const QUICK_ADMIN_LINKS: QuickLink[] = [
  { icon: "📚", label: "إدارة الدروس",   section: "lessons",  color: C.emeraldDeep },
  { icon: "👤", label: "إدارة المشايخ",  section: "sheikhs",  color: C.brassDeep },
  { icon: "📖", label: "إدارة المكتبة",  section: "library",  color: C.emeraldDeep },
  { icon: "❓", label: "إدارة الأسئلة",  section: "qa",       color: C.emeraldDeep },
  { icon: "💡", label: "إدارة الفوائد",  section: "fawaid",   color: C.brassDeep },
  { icon: "🔍", label: "مراجعة المحتوى", href: "/admin/automation/review", color: "#c2410c" },
  { icon: "⬆️", label: "الاستيراد",      href: "/admin/auto-content",      color: "#0369a1" },
  { icon: "⚙️", label: "الأتمتة",        href: "/admin/automation/center", color: "#7c3aed" },
  { icon: "🛠️", label: "الإعدادات",     section: "settings", color: "#475569" },
];

export function DashboardSection() {
  const { showSuccess, showError, onSectionChange } = useAdminShell();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localSearches, setLocalSearches] = useState<{ query: string; count: number }[]>([]);

  const [cmsStats, setCmsStats] = useState<Awaited<ReturnType<typeof getCmsDashboardStats>> | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([adminGetDashboardStats(), getCmsDashboardStats()])
      .then(([result, cms]) => {
        setData(result);
        setCmsStats(cms);
      })
      .catch(() => {
        setData(EMPTY_DASHBOARD);
        showError("تعذّر تحميل بيانات لوحة التحكم.");
      })
      .finally(() => setLoading(false));
    setLocalSearches(getTopSearchQueries(6));
  };

  useEffect(() => {
    load();
  }, []);

  const resolveReport = async (id: string) => {
    const { error } = await adminResolveReport(id);
    if (error) {
      showError("تعذّر إغلاق البلاغ.");
      return;
    }
    showSuccess("تم إغلاق البلاغ.");
    load();
  };

  if (loading || !data) return <Loading />;

  const { stats, recentReports, recentLessons, topViewedLessons, topSearches } = data;
  const searches = topSearches.length > 0 ? topSearches : localSearches;

  const cards = [
    { label: "الدروس", value: stats.totalLessons, tone: C.emeraldDeep },
    { label: "دورات", value: stats.coursesCount, tone: C.emeraldDeep },
    { label: "دروس", value: stats.lecturesCount, tone: C.emeraldDeep },
    { label: "دروس عادية", value: stats.regularLessonsCount, tone: C.emeraldDeep },
    { label: "المشايخ", value: stats.totalSheikhs, tone: C.brassDeep },
    { label: "المستخدمون", value: stats.totalUsers, tone: "#1d4ed8" },
    { label: "مشاهدات اليوم", value: stats.todayViews, tone: "#475569" },
    { label: "الكتب", value: stats.totalBooks, tone: C.brassDeep },
    { label: "الفوائد", value: stats.totalBenefits, tone: C.emeraldDeep },
    { label: "الأسئلة", value: stats.totalQA, tone: C.emeraldDeep },
    { label: "الأحاديث", value: stats.totalHadith, tone: C.brassDeep },
    { label: "القصص", value: stats.totalStories, tone: C.emeraldDeep },
    { label: "الإعجاز العلمي", value: stats.totalMiracles, tone: "#0369a1" },
    { label: "الأحكام", value: stats.totalRulings, tone: "#7c3aed" },
    { label: "قرارات مجلس الفقه", value: stats.totalFiqhItems, tone: "#c2410c" },
    { label: "بلاغات معلّقة", value: stats.pendingReports, tone: stats.pendingReports ? "#dc2626" : C.inkSoft },
    { label: "التفريغات", value: stats.totalTranscriptions, tone: "#0f766e" },
  ];

  return (
    <div>
      <AdminSectionToolbar title="لوحة التحكم" />

      {/* قسم إدارة المحتوى — واضح على الجوال ومناسب للمس */}
      <section style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.ink }}>إدارة المحتوى</h2>
          <Link
            href="/admin/autonomous-platform"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              padding: "0.45rem 1rem", borderRadius: "0.5rem", textDecoration: "none",
              fontSize: "0.8125rem", fontWeight: 600,
              background: C.emerald, color: "#fff",
            }}
          >
            مركز الإدارة الكامل ←
          </Link>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "0.625rem",
        }}>
          {QUICK_ADMIN_LINKS.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "0.35rem", padding: "0.875rem 0.5rem",
                  background: C.panel, border: `2px solid ${C.line}`,
                  borderRadius: "0.75rem", textDecoration: "none",
                  fontSize: "0.8rem", fontWeight: 600, color: item.color,
                  minHeight: "5.5rem", cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = item.color; (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 0 3px ${item.color}22`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = C.line; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none"; }}
              >
                <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>{item.icon}</span>
                <span style={{ textAlign: "center", lineHeight: 1.25 }}>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={() => item.section && onSectionChange(item.section)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "0.35rem", padding: "0.875rem 0.5rem",
                  background: C.panel, border: `2px solid ${C.line}`,
                  borderRadius: "0.75rem",
                  fontSize: "0.8rem", fontWeight: 600, color: item.color,
                  minHeight: "5.5rem", cursor: "pointer", fontFamily: "inherit",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = item.color; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 3px ${item.color}22`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.line; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
              >
                <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>{item.icon}</span>
                <span style={{ textAlign: "center", lineHeight: 1.25 }}>{item.label}</span>
              </button>
            )
          )}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {cards.map((card) => (
          <div key={card.label} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: card.tone }}>{card.value.toLocaleString("ar")}</p>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>حالة النظام</h3>
          <ul style={{ margin: 0, paddingInlineStart: "1.1rem", color: C.inkSoft, fontSize: "0.875rem", lineHeight: 1.9 }}>
            <li>Supabase: {isSupabaseConfigured() ? (stats.dbConnected !== false ? "متصل" : "غير متاح") : "وضع seed (بدون DB)"}</li>
            <li>الخادم: {stats.serverOk ? "يعمل" : "تحقق يدويًا"}</li>
            <li>التحديث التلقائي: <code>/api/cron/sync-data</code></li>
          </ul>
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>فهرس CMS</h3>
          {cmsStats ? (
            <ul style={{ margin: 0, paddingInlineStart: "1.1rem", color: C.inkSoft, fontSize: "0.875rem", lineHeight: 1.9 }}>
              <li>إجمالي المفهرس: {cmsStats.indexTotal.toLocaleString("ar")}</li>
              <li>عمليات استيراد: {cmsStats.importJobsTotal.toLocaleString("ar")}</li>
              <li>أذكار موثقة: {cmsStats.verifiedAdhkarTotal.toLocaleString("ar")}</li>
              <li>سجل تدقيق اليوم: {cmsStats.auditLogsToday.toLocaleString("ar")}</li>
              <li>مجدولة للنشر: {cmsStats.scheduledCount.toLocaleString("ar")}</li>
              {cmsStats.lastImportAt && (
                <li>
                  آخر استيراد: {cmsStats.lastImportType} ({cmsStats.lastImportImported ?? 0} صف) — {cmsStats.lastImportStatus}
                </li>
              )}
              {Object.entries(cmsStats.indexByKind).slice(0, 5).map(([k, v]) => (
                <li key={k}>{CMS_KIND_LABELS[k as CmsContentKind] || k}: {v}</li>
              ))}
              {cmsStats.sources.length > 0 && (
                <li style={{ fontSize: "0.75rem" }}>مصادر: {cmsStats.sources.join("، ")}</li>
              )}
            </ul>
          ) : (
            <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>جاري تحميل إحصائيات CMS…</p>
          )}
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>آخر تحديثات الدروس</h3>
          {recentLessons.length === 0 ? (
            <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد تحديثات حديثة.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {recentLessons.map((lesson: any) => (
                <li key={lesson.id} style={{ padding: "0.35rem 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
                  <strong style={{ color: C.ink }}>{lesson.title}</strong>
                  <span style={{ color: C.inkSoft, marginInlineStart: "0.5rem" }}>
                    {lesson.updated_at ? new Date(lesson.updated_at).toLocaleDateString("ar-KW") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>أكثر الدروس مشاهدة</h3>
          {topViewedLessons.length === 0 ? (
            <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد مشاهدات مسجّلة بعد.</p>
          ) : (
            <ol style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.875rem", lineHeight: 1.8 }}>
              {topViewedLessons.map((item) => (
                <li key={item.id}>
                  <Link href={`/lessons/${item.id}`} style={{ color: C.brassDeep, textDecoration: "none" }}>{item.title}</Link>
                  <span style={{ color: C.inkSoft }}> ({item.views})</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>أكثر عمليات البحث</h3>
          {searches.length === 0 ? (
            <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد عمليات بحث مسجّلة بعد.</p>
          ) : (
            <ol style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.875rem", lineHeight: 1.8 }}>
              {searches.map((item) => (
                <li key={item.query}>
                  <Link href={`/search/${encodeURIComponent(item.query)}`} style={{ color: C.brassDeep, textDecoration: "none" }}>{item.query}</Link>
                  <span style={{ color: C.inkSoft }}> ({item.count})</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {recentReports.length > 0 && (
        <section style={{ background: "#FEF2F2", border: "1px solid #fecaca", borderRadius: "0.625rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: "#b91c1c", fontSize: "1rem" }}>بلاغات تحتاج مراجعة</h3>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {recentReports.map((rep: any) => (
              <div key={rep.id} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", background: C.panel, borderRadius: "0.5rem", padding: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#b91c1c", fontWeight: 700 }}>{rep.report_type}</span>
                <p style={{ flex: 1, margin: 0, fontSize: "0.8125rem", color: C.ink }}>{rep.description}</p>
                <button
                  type="button"
                  onClick={() => resolveReport(rep.id)}
                  style={{ padding: "0.35rem 0.75rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: C.parchment, cursor: "pointer", fontFamily: "inherit", fontSize: "0.75rem" }}
                >
                  تمت المراجعة
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
