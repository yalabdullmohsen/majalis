import { useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  fetchGovernanceDashboard,
  runSecurityAudit,
  runBackupCheck,
  generateGovernanceReport,
  fetchMaintenancePlan,
  GOVERNANCE_ROLES,
  LIFECYCLE_STAGES,
  type GovernanceDashboard,
} from "@/lib/governance-service";

export function GovernanceSection() {
  const { showSuccess, showError } = useAdminShell();
  const [dashboard, setDashboard] = useState<GovernanceDashboard | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [security, setSecurity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    Promise.all([fetchGovernanceDashboard(), fetchMaintenancePlan()])
      .then(([d, p]) => {
        setDashboard(d);
        setPlan(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSecurity = async () => {
    try {
      const audit = await runSecurityAudit();
      setSecurity(audit);
      showSuccess(`تدقيق الأمان: ${audit.score}/100`);
    } catch {
      showError("فشل تدقيق الأمان");
    }
  };

  const handleBackup = async () => {
    try {
      const backup = await runBackupCheck();
      showSuccess(`النسخ الاحتياطي — ${backup.snapshots?.length || 0} جدول`);
      refresh();
    } catch {
      showError("فشل النسخ الاحتياطي");
    }
  };

  const handleReport = async () => {
    try {
      const report = await generateGovernanceReport();
      if (report) showSuccess(`التقرير جاهز — جاهزية ${report.production_readiness_pct}%`);
      else showError("تعذر إنشاء التقرير");
    } catch {
      showError("تعذر إنشاء التقرير");
    }
  };

  if (loading) return <p>جاري تحميل منظومة الحوكمة...</p>;

  const m = dashboard?.monitoring;
  const q = dashboard?.quality;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>الحوكمة والإدارة المؤسسية</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={handleSecurity}>تدقيق الأمان</button>
          <button type="button" onClick={handleBackup}>نسخ احتياطي</button>
          <button type="button" onClick={handleReport}>التقرير النهائي</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="جاهزية الإنتاج" value={`${q?.overall_score ?? 0}%`} />
        <StatCard label="التوثيق" value={`${q?.verification_pct ?? 0}%`} />
        <StatCard label="اكتمال البيانات" value={`${q?.completeness_pct ?? 0}%`} />
        <StatCard label="يحتاج مراجعة" value={`${q?.needs_review_pct ?? 0}%`} color="#dc2626" />
        <StatCard label="تكرارات" value={q?.duplicate_count ?? 0} />
        <StatCard label="روابط معطلة" value={q?.broken_links_count ?? 0} color="#f59e0b" />
        <StatCard label="Queue مراجعة" value={m?.queue?.pending ?? dashboard?.review_queue?.length ?? 0} />
        <StatCard label="معدل النجاح" value={`${m?.performance?.success_rate ?? 0}%`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <Panel title="مراقبة النظام">
          <Row label="قاعدة البيانات" value={m?.database?.status || "—"} />
          <Row label="Vercel" value={m?.vercel?.status || "—"} />
          <Row label="Supabase" value={m?.supabase?.status || "—"} />
          <Row label="Cron Jobs" value={String(m?.cron_jobs?.total ?? "—")} />
          <Row label="AI" value={m?.ai?.status || "—"} />
          <Row label="النسخ الاحتياطي" value={m?.backups?.status || "—"} />
        </Panel>

        <Panel title="الأدوار ({GOVERNANCE_ROLES.length})">
          {GOVERNANCE_ROLES.map((r) => (
            <div key={r.id} style={{ fontSize: "0.8125rem", padding: "0.2rem 0" }}>{r.label}</div>
          ))}
        </Panel>

        <Panel title="دورة حياة المحتوى">
          {LIFECYCLE_STAGES.map((s, i) => (
            <div key={s} style={{ fontSize: "0.8125rem", padding: "0.15rem 0" }}>
              {i + 1}. {s.replace(/_/g, " ")}
            </div>
          ))}
        </Panel>

        <Panel title="سجل التدقيق">
          {(dashboard?.recent_audit || []).slice(0, 8).map((a, i) => (
            <div key={i} style={{ fontSize: "0.75rem", padding: "0.2rem 0" }}>
              {a.action} — {a.actor_id} ({a.outcome})
            </div>
          ))}
          {!dashboard?.recent_audit?.length && (
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا سجلات بعد</p>
          )}
        </Panel>

        {security && (
          <Panel title="تدقيق الأمان">
            <Row label="الدرجة" value={`${security.score}/100`} />
            <Row label="حرج" value={String(security.critical_count ?? 0)} />
            <Row label="تحذيرات" value={String(security.warning_count ?? 0)} />
            {(security.recommendations || []).slice(0, 3).map((r: string) => (
              <div key={r} style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>{r}</div>
            ))}
          </Panel>
        )}

        <Panel title="Queue المراجعة">
          {(dashboard?.review_queue || []).slice(0, 6).map((r, i) => (
            <div key={i} style={{ fontSize: "0.8125rem", padding: "0.2rem 0" }}>
              {r.content_kind}/{r.content_id} — {r.status}
            </div>
          ))}
          {!dashboard?.review_queue?.length && (
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا عناصر في الانتظار</p>
          )}
        </Panel>
      </div>

      {plan && (
        <section>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>خطة الصيانة</h3>
          {plan.schedule?.map((s: any) => (
            <div key={s.frequency} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid var(--line)", borderRadius: "0.5rem" }}>
              <strong>{s.frequency}</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.25rem", fontSize: "0.8125rem" }}>
                {s.tasks?.map((t: string) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          ))}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", padding: "0.25rem 0" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
