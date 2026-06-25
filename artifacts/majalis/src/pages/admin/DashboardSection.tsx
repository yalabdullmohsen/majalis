import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminGetDashboardStats, adminResolveReport } from "@/lib/supabase";
import { getTopSearchQueries } from "@/lib/search-history";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";

type DashboardData = Awaited<ReturnType<typeof adminGetDashboardStats>>;

export function DashboardSection() {
  const { showSuccess, showError } = useAdminShell();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localSearches, setLocalSearches] = useState<{ query: string; count: number }[]>([]);

  const load = () => {
    setLoading(true);
    adminGetDashboardStats()
      .then((result) => setData(result))
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
    { label: "محاضرات", value: stats.lecturesCount, tone: C.emeraldDeep },
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
    <div>
      <AdminSectionToolbar title="لوحة التحكم" />

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
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "1rem" }}>آخر التحديثات</h3>
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
