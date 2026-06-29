import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";

type AuditIssue = {
  id: string;
  title: string;
  lesson_time: string;
  issues: string[];
  repairs: { field: string; from: string; to: string; reason: string }[];
  effective_prayer_rank: string;
  needs_manual_review: boolean;
};

type AuditSummary = {
  total: number;
  with_issues: number;
  manual_review: number;
  prayer_rank_coverage_pct: number;
  issues: AuditIssue[];
};

export function LessonTimeValidationPanel() {
  const [loading, setLoading] = useState(true);
  const [repairing, setRepairing] = useState(false);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lesson-time-audit?action=audit", { credentials: "same-origin" });
      const data = await res.json();
      if (data.ok) setSummary(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runRepair = async () => {
    setRepairing(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/lesson-time-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "repair" }),
      });
      const data = await res.json();
      setMessage(`تم إصلاح ${data.repaired_count || 0} درس`);
      await load();
    } finally {
      setRepairing(false);
    }
  };

  const exportReport = () => {
    if (!summary) return;
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lesson-time-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  return (
    <section style={{ marginBottom: "1.5rem", padding: "1rem", borderRadius: "0.75rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <h3 style={{ margin: "0 0 0.75rem", fontWeight: 800, color: C.emeraldDeep }}>تدقيق أوقات الدروس</h3>
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.65rem", marginBottom: "1rem" }}>
          <Stat label="إجمالي" value={summary.total} />
          <Stat label="بها مشاكل" value={summary.with_issues} />
          <Stat label="مراجعة يدوية" value={summary.manual_review} />
          <Stat label="تغطية مرتبة الصلاة" value={`${summary.prayer_rank_coverage_pct}%`} />
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button type="button" onClick={() => void load()} style={btnStyle}>إعادة التدقيق</button>
        <button type="button" onClick={() => void runRepair()} disabled={repairing} style={btnPrimary}>
          {repairing ? "جاري الإصلاح…" : "إصلاح جماعي"}
        </button>
        <button type="button" onClick={exportReport} style={btnStyle}>تصدير التقرير</button>
      </div>
      {message && <p style={{ color: C.emeraldDeep, fontWeight: 700, marginBottom: "0.75rem" }}>{message}</p>}
      {summary?.issues?.length ? (
        <div style={{ maxHeight: 280, overflow: "auto", fontSize: "0.8125rem" }}>
          {summary.issues.slice(0, 30).map((item) => (
            <div key={item.id} style={{ padding: "0.5rem 0", borderBottom: `1px solid ${C.line}` }}>
              <strong>{item.title}</strong>
              <div style={{ color: C.inkSoft }}>{item.lesson_time}</div>
              <div style={{ color: item.needs_manual_review ? "#b45309" : C.emeraldDeep }}>
                {item.issues.join(" · ")} → {item.effective_prayer_rank}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: C.inkSoft }}>لا توجد مشاكل — جميع الأوقات سليمة.</p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center", padding: "0.5rem", borderRadius: "0.5rem", background: "#f8faf9" }}>
      <div style={{ fontWeight: 800, fontSize: "1.125rem" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#666" }}>{label}</div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.45rem 0.85rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.line}`,
  background: C.panel,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnPrimary: React.CSSProperties = {
  ...btnStyle,
  background: C.emeraldDeep,
  color: "#fff",
  border: "none",
};
