import { useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  fetchIntelligenceDashboard,
  fetchIntelligenceAnalytics,
  runIntelligencePlatform,
  runIntelligenceAgent,
  generateIntelligenceReport,
  generateWeeklyIntelligenceReport,
  fetchDevelopmentPlan,
  AGENT_LABELS,
  type IntelligenceDashboard,
  type IntelligenceAnalytics,
} from "@/lib/islamic-intelligence-service";

export function IslamicIntelligenceSection() {
  const { showSuccess, showError } = useAdminShell();
  const [dashboard, setDashboard] = useState<IntelligenceDashboard | null>(null);
  const [analytics, setAnalytics] = useState<IntelligenceAnalytics | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([fetchIntelligenceDashboard(), fetchIntelligenceAnalytics(30), fetchDevelopmentPlan()])
      .then(([d, a, p]) => {
        setDashboard(d);
        setAnalytics(a || d?.analytics || null);
        setPlan(p);
      })
      .catch(() => showError("تعذّر تحميل الاستخبارات العلمية."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRunAll = async () => {
    setRunning(true);
    try {
      const result = await runIntelligencePlatform("full");
      showSuccess(`اكتملت الدورة — ${result.agents_run?.length || 0} وكيل`);
      refresh();
    } catch {
      showError("فشل تشغيل المنصة");
    } finally {
      setRunning(false);
    }
  };

  const handleRunAgent = async (agentId: string) => {
    setRunningAgent(agentId);
    try {
      await runIntelligenceAgent(agentId);
      showSuccess(`اكتمل ${AGENT_LABELS[agentId] || agentId}`);
      refresh();
    } catch {
      showError("فشل تشغيل الوكيل");
    } finally {
      setRunningAgent(null);
    }
  };

  const handleReport = async () => {
    try {
      const report = await generateIntelligenceReport();
      if (report) showSuccess(`التقرير جاهز — أتمتة ${report.automation_pct}%`);
      else showError("تعذر إنشاء التقرير");
    } catch {
      showError("تعذر إنشاء التقرير");
    }
  };

  const handleWeekly = async () => {
    try {
      const report = await generateWeeklyIntelligenceReport();
      if (report) showSuccess("التقرير الأسبوعي جاهز");
      else showError("تعذر إنشاء التقرير الأسبوعي");
    } catch {
      showError("تعذر إنشاء التقرير الأسبوعي");
    }
  };

  if (loading) return <p>جاري تحميل منصة الاستخبارات العلمية...</p>;

  const agents = dashboard?.agents ? Object.entries(dashboard.agents) : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>منصة الاستخبارات العلمية الإسلامية</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={handleRunAll} disabled={running}>
            {running ? "جاري التشغيل..." : "تشغيل جميع الوكلاء"}
          </button>
          <button type="button" onClick={handleWeekly}>التقرير الأسبوعي</button>
          <button type="button" onClick={handleReport}>التقرير النهائي</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="وكلاء AI" value={dashboard?.agent_count ?? 9} />
        <StatCard label="عمليات بحث" value={analytics?.most_searched?.length ?? 0} />
        <StatCard label="جودة متوسطة" value={analytics?.quality?.avg_score ?? 0} />
        <StatCard label="نسبة التوثيق" value={`${analytics?.verification_pct ?? 0}%`} />
        <StatCard label="محتوى جديد" value={analytics?.content_growth?.new_items ?? 0} />
        <StatCard label="يحتاج مراجعة" value={analytics?.quality?.needs_review ?? 0} color="#dc2626" />
        <StatCard label="معدل النجاح" value={`${analytics?.update_success_rate ?? 0}%`} />
        <StatCard label="زمن البحث" value={`${analytics?.avg_response_ms ?? 0}ms`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <Panel title="وكلاء الذكاء الاصطناعي (9)">
          {agents.map(([id, agent]) => (
            <div key={id} style={{ fontSize: "0.8125rem", padding: "0.35rem 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{agent.label_ar || AGENT_LABELS[id]}</span>
              <button
                type="button"
                style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}
                disabled={runningAgent === id}
                onClick={() => handleRunAgent(id)}
              >
                {runningAgent === id ? "..." : "تشغيل"}
              </button>
            </div>
          ))}
        </Panel>

        <Panel title="أكثر الموضوعات بحثاً">
          {(analytics?.most_read_topics || []).slice(0, 8).map((t) => (
            <div key={t.slug} style={{ fontSize: "0.8125rem", padding: "0.25rem 0", display: "flex", justifyContent: "space-between" }}>
              <span>{t.title}</span>
              <span>{t.count}</span>
            </div>
          ))}
          {!analytics?.most_read_topics?.length && (
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا توجد بيانات بعد</p>
          )}
        </Panel>

        <Panel title="صفحات تحتاج إثراء">
          {(analytics?.pages_needing_enrichment || []).slice(0, 6).map((p) => (
            <div key={p.query} style={{ fontSize: "0.8125rem", padding: "0.25rem 0" }}>
              {p.query} <span style={{ color: "var(--ink-soft)" }}>({p.search_count} بحث)</span>
            </div>
          ))}
          {!analytics?.pages_needing_enrichment?.length && (
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا فجوات حالياً</p>
          )}
        </Panel>

        <Panel title="آخر عمليات">
          {(dashboard?.recent_runs || []).slice(0, 6).map((r) => (
            <div key={r.id} style={{ fontSize: "0.8125rem", padding: "0.25rem 0", display: "flex", justifyContent: "space-between" }}>
              <span>{AGENT_LABELS[r.agent_id] || r.agent_id}</span>
              <span style={{ color: r.status === "completed" ? "var(--emerald-deep)" : "#dc2626" }}>
                {r.issues_found} مشكلة
              </span>
            </div>
          ))}
          {!dashboard?.recent_runs?.length && (
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لم تُشغَّل بعد</p>
          )}
        </Panel>
      </div>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>مهام تتطلب مراجعة بشرية</h3>
        <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.8125rem" }}>
          {(dashboard?.human_required || []).map((h) => (
            <li key={h.task} style={{ marginBottom: "0.25rem" }}>
              {h.task}
              <span style={{ color: "var(--ink-soft)", marginRight: "0.5rem" }}>— {h.reason}</span>
            </li>
          ))}
        </ul>
      </section>

      {plan && (
        <section>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>خطة التطوير</h3>
          {plan.phases?.map((phase: any) => (
            <div key={phase.phase} style={{ marginBottom: "1rem", padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
              <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{phase.title}</h4>
              <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.8125rem" }}>
                {phase.items?.map((item: any) => (
                  <li key={item.task}>{item.task}</li>
                ))}
              </ul>
            </div>
          ))}
          <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>{plan.principle}</p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: color || "inherit" }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem" }}>{title}</h3>
      {children}
    </div>
  );
}
