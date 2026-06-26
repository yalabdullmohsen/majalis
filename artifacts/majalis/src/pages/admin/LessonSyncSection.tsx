import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "@/pages/admin/AdminShell";
import {
  fetchLessonSyncDashboard,
  runLessonSyncManual,
  type LessonSyncDashboard,
  type LessonSourceHealth,
} from "@/lib/lesson-sync-service";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  ok: C.emeraldDeep,
  error: "#991B1B",
  skipped: C.inkSoft,
  unknown: C.inkSoft,
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-KW", { timeZone: "Asia/Kuwait" });
  } catch {
    return value;
  }
}

function SourceRow({ source }: { source: LessonSourceHealth }) {
  const color = STATUS_COLORS[source.status] ?? C.inkSoft;
  return (
    <tr>
      <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{source.source_name}</td>
      <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{source.source_type}</td>
      <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}`, color, fontWeight: 600 }}>
        {source.status}
      </td>
      <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{source.items_fetched ?? 0}</td>
      <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{source.items_published ?? 0}</td>
      <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{formatDate(source.last_sync_at)}</td>
      <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}`, fontSize: "0.8rem", color: C.inkSoft }}>
        {source.last_error || "—"}
      </td>
    </tr>
  );
}

export function LessonSyncSection() {
  const { showSuccess, showError } = useAdminShell();
  const [data, setData] = useState<LessonSyncDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLessonSyncDashboard();
      setData(result);
    } catch {
      showError("تعذر تحميل لوحة مزامنة الدروس.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runLessonSyncManual({ useAi: true });
      const stats = result.stats ?? result.summary ?? {};
      showSuccess(
        `اكتملت المزامنة: ${stats.new ?? 0} جديد، ${stats.updated ?? 0} محدّث، ${stats.duplicates ?? 0} مكرر`,
      );
      await load();
    } catch {
      showError("فشلت مزامنة الدروس.");
    } finally {
      setRunning(false);
    }
  };

  if (loading && !data) return <Loading />;

  const latest = data?.latest_run;
  const stats = latest?.summary ?? latest?.stats ?? {};
  const registry = data?.registry;
  const report = data?.report as Record<string, unknown> | undefined;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, color: C.emeraldDeep }}>مزامنة إعلانات الدروس — الكويت</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: C.inkSoft }}>
            مصادر رسمية فقط — بدون مراقبة Instagram
          </p>
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "none",
            background: C.emerald,
            color: "#fff",
            cursor: running ? "wait" : "pointer",
            fontWeight: 600,
          }}
        >
          {running ? "جاري المزامنة…" : "تشغيل المزامنة الآن"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <StatCard label="آخر مزامنة" value={formatDate(latest?.finished_at ?? latest?.started_at)} />
        <StatCard label="جديد" value={stats.new ?? latest?.new_count ?? 0} />
        <StatCard label="محدّث" value={stats.updated ?? latest?.updated_count ?? 0} />
        <StatCard label="مكرر" value={stats.duplicates ?? latest?.duplicate_count ?? 0} />
        <StatCard label="للمراجعة" value={stats.review ?? latest?.review_count ?? 0} />
        <StatCard label="أخطاء" value={stats.errors ?? latest?.error_count ?? 0} />
        <StatCard label="مصادر نشطة" value={registry?.active ?? 0} sub={`${registry?.pending ?? 0} بانتظار تكامل`} />
        <StatCard
          label="السعة اليومية"
          value={registry?.estimated_daily_capacity ?? 0}
          sub={`${report?.automation_rate_percent ?? "—"}% أتمتة`}
        />
      </div>

      <h3 style={{ color: C.emeraldDeep, marginBottom: "0.5rem" }}>حالة المصادر</h3>
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ background: C.panel, textAlign: "right" }}>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>المصدر</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>النوع</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>الحالة</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>مُجلب</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>منشور</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>آخر مزامنة</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>خطأ</th>
            </tr>
          </thead>
          <tbody>
            {(data?.source_health ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "1rem", textAlign: "center", color: C.inkSoft }}>
                  لا توجد بيانات بعد — شغّل المزامنة الأولى
                </td>
              </tr>
            ) : (
              (data?.source_health ?? []).map((source) => <SourceRow key={source.source_id} source={source} />)
            )}
          </tbody>
        </table>
      </div>

      {registry?.pending_integration && registry.pending_integration.length > 0 && (
        <div style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}` }}>
          <h3 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep }}>مصادر بانتظار تكامل رسمي</h3>
          <ul style={{ margin: 0, paddingInlineStart: "1.25rem", color: C.inkSoft, fontSize: "0.875rem" }}>
            {registry.pending_integration.map((source) => (
              <li key={source.id}>
                <strong>{source.name}</strong>
                {source.notes ? ` — ${source.notes}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
