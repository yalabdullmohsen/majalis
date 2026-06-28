import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";

type DashboardData = {
  ok?: boolean;
  total_published?: number;
  today?: {
    day_key?: string;
    generated?: number;
    approved?: number;
    rejected?: number;
    duplicates?: number;
    avg_confidence?: number;
    db_total?: number;
    execution_ms?: number;
    categories?: Record<string, number>;
  };
  active_job?: { status?: string; approved_count?: number; target_count?: number; resume_cursor?: number };
  recent_reports?: Array<{
    day_key: string;
    generated: number;
    approved: number;
    rejected: number;
    duplicates: number;
    avg_confidence?: number;
    db_total: number;
  }>;
  recent_failures?: Array<{ reason_code: string; reason_detail?: string; category_slug?: string; created_at: string }>;
  metrics?: Array<{ day_key: string; total_approved: number; avg_confidence?: number }>;
};

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/question-answer?action=generation_dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action: "generation_dashboard" }),
  });
  return res.json();
}

async function triggerGeneration(force = false) {
  const res = await fetch("/api/question-answer?action=generation_run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action: "generation_run", force }),
  });
  return res.json();
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      style={{
        padding: "0.85rem 1rem",
        borderRadius: "0.75rem",
        border: `1px solid ${C.line}`,
        background: "#fafaf8",
        minWidth: "7rem",
      }}
    >
      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: C.inkSoft }}>{label}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: C.inkSoft, marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}

export function QuestionGenerationPanel() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchDashboard();
      setData(d);
    } catch {
      setMsg("تعذر تحميل تقارير التوليد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runNow = async (force = false) => {
    setRunning(true);
    setMsg("جاري التوليد اليومي...");
    try {
      const result = await triggerGeneration(force);
      if (result.ok) {
        setMsg(
          result.skipped
            ? "تم إكمال توليد اليوم مسبقاً"
            : `تم: ${result.report?.approved ?? 0} معتمد / ${result.report?.generated ?? 0} مولّد`,
        );
        await refresh();
      } else {
        setMsg(result.error || "فشل التوليد");
      }
    } catch {
      setMsg("فشل الاتصال بمحرك التوليد");
    } finally {
      setRunning(false);
    }
  };

  const today = data?.today;
  const reports = data?.recent_reports || [];
  const maxApproved = Math.max(1, ...reports.map((r) => r.approved || 0));

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, color: C.emeraldDeep, flex: 1 }}>محرك التوليد اليومي (50 سؤال/يوم)</h3>
        <button type="button" className="page-action-btn" disabled={running} onClick={() => runNow(false)}>
          {running ? "جاري التوليد..." : "▶ تشغيل اليوم"}
        </button>
        <button type="button" className="page-action-btn" disabled={running} onClick={() => runNow(true)}>
          إعادة تشغيل (force)
        </button>
        <button type="button" className="page-action-btn" onClick={() => void refresh()}>
          تحديث
        </button>
      </div>

      {msg && <p style={{ fontSize: "0.875rem", color: C.emeraldDeep, marginBottom: "0.75rem" }}>{msg}</p>}

      {loading ? (
        <p style={{ color: C.inkSoft }}>جاري التحميل...</p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginBottom: "1.25rem" }}>
            <StatCard label="إجمالي المنشور" value={data?.total_published ?? "—"} />
            <StatCard
              label="اليوم — معتمد"
              value={today?.approved ?? data?.active_job?.approved_count ?? 0}
              sub={today?.day_key || "لا تقرير بعد"}
            />
            <StatCard label="اليوم — مولّد" value={today?.generated ?? 0} />
            <StatCard label="مرفوض" value={today?.rejected ?? 0} />
            <StatCard label="مكرر" value={today?.duplicates ?? 0} />
            <StatCard
              label="متوسط الثقة"
              value={today?.avg_confidence ? `${(today.avg_confidence * 100).toFixed(1)}%` : "—"}
            />
            <StatCard
              label="حالة المهمة"
              value={data?.active_job?.status || "—"}
              sub={
                data?.active_job
                  ? `${data.active_job.resume_cursor ?? 0}/${data.active_job.target_count ?? 50}`
                  : undefined
              }
            />
          </div>

          <h4 style={{ color: C.emeraldDeep, marginBottom: "0.5rem" }}>نمو آخر 14 يوم</h4>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: 80, marginBottom: "1.25rem" }}>
            {reports.slice(0, 14).reverse().map((r) => (
              <div
                key={r.day_key}
                title={`${r.day_key}: ${r.approved} معتمد`}
                style={{
                  flex: 1,
                  minWidth: 12,
                  height: `${Math.max(8, (r.approved / maxApproved) * 72)}px`,
                  background: C.emeraldDeep,
                  borderRadius: "3px 3px 0 0",
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          {today?.categories && Object.keys(today.categories).length > 0 && (
            <>
              <h4 style={{ color: C.emeraldDeep, marginBottom: "0.5rem" }}>توزيع الفئات (اليوم)</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" }}>
                {Object.entries(today.categories as Record<string, number>)
                  .sort((a, b) => b[1] - a[1])
                  .map(([slug, count]) => (
                    <span
                      key={slug}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.5rem",
                        border: `1px solid ${C.line}`,
                        background: "#fff",
                      }}
                    >
                      {slug}: {count}
                    </span>
                  ))}
              </div>
            </>
          )}

          {data?.recent_failures && data.recent_failures.length > 0 && (
            <>
              <h4 style={{ color: C.emeraldDeep, marginBottom: "0.5rem" }}>آخر الإخفاقات</h4>
              <ul style={{ fontSize: "0.8125rem", color: C.inkSoft, paddingInlineStart: "1.2rem" }}>
                {data.recent_failures.slice(0, 5).map((f, i) => (
                  <li key={i}>
                    [{f.reason_code}] {f.category_slug || "—"} — {f.reason_detail?.slice(0, 60)}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.75rem" }}>
            Cron: 06:30 UTC يومياً + استكمال كل 15 دقيقة. الجودة أولاً — قد يُخزَّن أقل من 50 إذا لم تجتز الأسئلة
            التحقق.
          </p>
        </>
      )}
    </div>
  );
}

export default QuestionGenerationPanel;
