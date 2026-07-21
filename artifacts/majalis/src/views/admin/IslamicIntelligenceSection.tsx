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

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="ii-stat" style={color ? { "--ii-val-color": color } as React.CSSProperties : undefined}>
      <div className="ii-stat__label">{label}</div>
      <div className="ii-stat__value">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ii-panel">
      <h3 className="ii-panel-h3">{title}</h3>
      {children}
    </div>
  );
}

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
      showSuccess(`اكتملت الدورة، ${result.agents_run?.length || 0} وكيل`);
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
      if (report) showSuccess(`التقرير جاهز، أتمتة ${report.automation_pct}%`);
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
      <div className="ii-header">
        <h2 className="ii-title">منصة الاستخبارات العلمية الإسلامية</h2>
        <div className="ii-btn-group">
          <button type="button" onClick={handleRunAll} disabled={running} className="ii-btn">
            {running ? "جاري التشغيل..." : "تشغيل جميع الوكلاء"}
          </button>
          <button type="button" onClick={handleWeekly} className="ii-btn">التقرير الأسبوعي</button>
          <button type="button" onClick={handleReport} className="ii-btn">التقرير النهائي</button>
        </div>
      </div>

      <div className="ii-stats-grid">
        <StatCard label="وكلاء AI" value={dashboard?.agent_count ?? 9} />
        <StatCard label="عمليات بحث" value={analytics?.most_searched?.length ?? 0} />
        <StatCard label="جودة متوسطة" value={analytics?.quality?.avg_score ?? 0} />
        <StatCard label="نسبة التوثيق" value={`${analytics?.verification_pct ?? 0}%`} />
        <StatCard label="محتوى جديد" value={analytics?.content_growth?.new_items ?? 0} />
        <StatCard label="يحتاج مراجعة" value={analytics?.quality?.needs_review ?? 0} color="#dc2626" />
        <StatCard label="معدل النجاح" value={`${analytics?.update_success_rate ?? 0}%`} />
        <StatCard label="زمن البحث" value={`${analytics?.avg_response_ms ?? 0}ms`} />
      </div>

      <div className="ii-panels-grid">
        <Panel title="وكلاء الذكاء الاصطناعي (9)">
          {agents.map(([id, agent]) => (
            <div key={id} className="ii-agent-row">
              <span>{agent.label_ar || AGENT_LABELS[id]}</span>
              <button
                type="button"
                className="ii-agent-btn"
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
            <div key={t.slug} className="ii-row">
              <span>{t.title}</span>
              <span>{t.count}</span>
            </div>
          ))}
          {!analytics?.most_read_topics?.length && (
            <p className="ii-muted">لا توجد بيانات بعد</p>
          )}
        </Panel>

        <Panel title="صفحات تحتاج إثراء">
          {(analytics?.pages_needing_enrichment || []).slice(0, 6).map((p) => (
            <div key={p.query} className="ii-page-row">
              {p.query} <span className="ii-page-count">({p.search_count} بحث)</span>
            </div>
          ))}
          {!analytics?.pages_needing_enrichment?.length && (
            <p className="ii-muted">لا فجوات حالياً</p>
          )}
        </Panel>

        <Panel title="آخر عمليات">
          {(dashboard?.recent_runs || []).slice(0, 6).map((r) => (
            <div key={r.id} className="ii-row">
              <span>{AGENT_LABELS[r.agent_id] || r.agent_id}</span>
              <span
                className="ii-run-status"
                style={{ "--ii-run-color": r.status === "completed" ? "var(--majalis-emerald-deep,#173D35)" : "#dc2626" } as React.CSSProperties}
              >
                {r.issues_found} مشكلة
              </span>
            </div>
          ))}
          {!dashboard?.recent_runs?.length && (
            <p className="ii-muted">لم تُشغَّل بعد</p>
          )}
        </Panel>
      </div>

      <section className="ii-section">
        <h3 className="ii-section-h3">مهام تتطلب مراجعة بشرية</h3>
        <ul className="ii-tasks">
          {(dashboard?.human_required || []).map((h) => (
            <li key={h.task} className="ii-task-li">
              {h.task}
              <span className="ii-task-reason">— {h.reason}</span>
            </li>
          ))}
        </ul>
      </section>

      {plan && (
        <section>
          <h3 className="ii-plan-h3">خطة التطوير</h3>
          {plan.phases?.map((phase: any) => (
            <div key={phase.phase} className="ii-phase">
              <h4 className="ii-phase-h4">{phase.title}</h4>
              <ul className="ii-phase-ul">
                {phase.items?.map((item: any) => (
                  <li key={item.task}>{item.task}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="ii-principle">{plan.principle}</p>
        </section>
      )}
    </div>
  );
}
