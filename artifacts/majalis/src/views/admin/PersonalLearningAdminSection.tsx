import { useEffect, useState } from "react";
import { adminPersonalLearningStats, adminGetContentReports, adminUpdateReportStatus } from "@/lib/personal-learning";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "./AdminShell";

export function PersonalLearningAdminSection() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminPersonalLearningStats>> | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useAdminShell();

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([adminPersonalLearningStats(), adminGetContentReports(40)]);
      setStats(s);
      setReports(r.data || []);
    } catch {
      showError("تعذر تحميل إحصاءات التجربة الشخصية");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resolveReport = async (id: string, status: "reviewed" | "resolved") => {
    const { error } = await adminUpdateReportStatus(id, status);
    if (error) showError("تعذر تحديث البلاغ");
    else {
      showSuccess("تم تحديث حالة البلاغ");
      load();
    }
  };

  if (loading) return <Loading />;

  return (
    <div dir="rtl">
      <h2 style={{ margin: "0 0 1rem", color: C.emeraldDeep }}>تجربة المستخدم الشخصية</h2>

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            ["مجلدات", stats.folders],
            ["محفوظات", stats.bookmarks],
            ["ملاحظات", stats.notes],
            ["خطط", stats.plans],
            ["بلاغات معلقة", stats.pending_reports],
            ["أحداث نشاط", stats.activity_events],
          ].map(([label, val]) => (
            <div key={String(label)} style={{ padding: "0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.5rem", background: C.panel }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: C.emeraldDeep }}>{val}</div>
              <div style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {stats?.top_saved_types && stats.top_saved_types.length > 0 && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>أكثر المحتويات حفظاً</h3>
          <ul style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
            {stats.top_saved_types.map((t) => (
              <li key={t.type}>{t.type}: {t.count}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>البلاغات والاقتراحات</h3>
        {reports.length === 0 ? (
          <p style={{ color: C.inkSoft }}>لا توجد بلاغات</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: C.parchmentDeep }}>
                  {["النوع", "المحتوى", "الصفحة", "الحالة", "إجراء"].map((h) => (
                    <th key={h} style={{ padding: "0.5rem", textAlign: "right", borderBottom: `1px solid ${C.line}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "0.5rem" }}>{r.report_type}</td>
                    <td style={{ padding: "0.5rem" }}>{r.content_type}</td>
                    <td style={{ padding: "0.5rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.page_url || "—"}
                    </td>
                    <td style={{ padding: "0.5rem" }}>{r.status}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {r.status === "pending" && (
                        <button type="button" style={{ fontSize: "0.75rem", marginLeft: "0.25rem" }} onClick={() => resolveReport(r.id, "reviewed")}>مراجعة</button>
                      )}
                      {r.status !== "resolved" && (
                        <button type="button" style={{ fontSize: "0.75rem" }} onClick={() => resolveReport(r.id, "resolved")}>حل</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
