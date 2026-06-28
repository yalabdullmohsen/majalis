import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminGetDashboardStats, adminResolveReport } from "@/lib/supabase";
import { getCmsDashboardStats } from "@/lib/cms/supabase-cms";
import { CMS_KIND_LABELS, type CmsContentKind } from "@/lib/cms/content-types";
import { getTopSearchQueries } from "@/lib/search-history";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { runWithTimeout } from "@/lib/request-manager";
import { C } from "@/lib/theme";
import { TimedLoading, ErrorState } from "@/components/ui-common";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";

type DashboardData = Awaited<ReturnType<typeof adminGetDashboardStats>>;

export function DashboardSection() {
  const { showSuccess, showError } = useAdminShell();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [localSearches, setLocalSearches] = useState<{ query: string; count: number }[]>([]);

  const [cmsStats, setCmsStats] = useState<Awaited<ReturnType<typeof getCmsDashboardStats>> | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    void runWithTimeout("admin:dashboard", async () => {
      const [result, cms] = await Promise.all([adminGetDashboardStats(), getCmsDashboardStats()]);
      return { result, cms };
    }).then(({ data: payload, error }) => {
      if (error) {
        setLoadError(error);
        return;
      }
      if (payload) {
        setData(payload.result);
        setCmsStats(payload.cms);
      }
    }).finally(() => setLoading(false));
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

  if (loadError) {
    return <ErrorState text={loadError} onRetry={load} />;
  }

  if (loading || !data) {
    return (
      <TimedLoading
        timeoutText="تعذر تحميل لوحة التحكم. حاول مجدداً."
        onRetry={load}
      />
    );
  }

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
    { label: "بلاغات معلّقة", value: stats.pendingReports, tone: stats.pendingReports ? "#dc2626" : C.inkSoft },
    { label: "التفريغات", value: stats.totalTranscriptions, tone: "#0f766e" },
  ];

  return (
    <div className="admin-dashboard">
      <AdminSectionToolbar title="لوحة التحكم" />

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <p className="admin-stat-card__value" style={{ color: card.tone }}>{card.value.toLocaleString("ar")}</p>
            <p className="admin-stat-card__label">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="admin-panel-grid">
        <section className="admin-panel-card">
          <h3 className="admin-panel-card__title">حالة النظام</h3>
          <ul className="admin-panel-card__list">
            <li>Supabase: {isSupabaseConfigured() ? (stats.dbConnected !== false ? "متصل" : "غير متاح") : "وضع seed (بدون DB)"}</li>
            <li>الخادم: {stats.serverOk ? "يعمل" : "تحقق يدويًا"}</li>
            <li>التحديث التلقائي: <code>/api/cron/sync-data</code></li>
          </ul>
        </section>

        <section className="admin-panel-card">
          <h3 className="admin-panel-card__title">فهرس CMS</h3>
          {cmsStats ? (
            <ul className="admin-panel-card__list">
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
            <p className="admin-panel-card__empty">جاري تحميل إحصائيات CMS…</p>
          )}
        </section>

        <section className="admin-panel-card">
          <h3 className="admin-panel-card__title">آخر تحديثات الدروس</h3>
          {recentLessons.length === 0 ? (
            <p className="admin-panel-card__empty">لا توجد تحديثات حديثة.</p>
          ) : (
            <ul className="admin-panel-card__items">
              {recentLessons.map((lesson: any) => (
                <li key={lesson.id} className="admin-panel-card__item">
                  <strong>{lesson.title}</strong>
                  <span className="admin-panel-card__meta">
                    {lesson.updated_at ? new Date(lesson.updated_at).toLocaleDateString("ar-KW") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="admin-panel-grid">
        <section className="admin-panel-card">
          <h3 className="admin-panel-card__title">أكثر الدروس مشاهدة</h3>
          {topViewedLessons.length === 0 ? (
            <p className="admin-panel-card__empty">لا توجد مشاهدات مسجّلة بعد.</p>
          ) : (
            <ol className="admin-panel-card__list admin-panel-card__list--ordered">
              {topViewedLessons.map((item) => (
                <li key={item.id}>
                  <Link href={`/lessons/${item.id}`} className="admin-panel-card__link">{item.title}</Link>
                  <span className="admin-panel-card__meta"> ({item.views})</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="admin-panel-card">
          <h3 className="admin-panel-card__title">أكثر عمليات البحث</h3>
          {searches.length === 0 ? (
            <p className="admin-panel-card__empty">لا توجد عمليات بحث مسجّلة بعد.</p>
          ) : (
            <ol className="admin-panel-card__list admin-panel-card__list--ordered">
              {searches.map((item) => (
                <li key={item.query}>
                  <Link href={`/search/${encodeURIComponent(item.query)}`} className="admin-panel-card__link">{item.query}</Link>
                  <span className="admin-panel-card__meta"> ({item.count})</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {recentReports.length > 0 && (
        <section className="admin-reports-panel">
          <h3 className="admin-reports-panel__title">بلاغات تحتاج مراجعة</h3>
          <div className="admin-reports-panel__list">
            {recentReports.map((rep: any) => (
              <div key={rep.id} className="admin-reports-panel__item">
                <span className="admin-reports-panel__type">{rep.report_type}</span>
                <p className="admin-reports-panel__desc">{rep.description}</p>
                <button type="button" onClick={() => resolveReport(rep.id)} className="admin-reports-panel__btn">
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
