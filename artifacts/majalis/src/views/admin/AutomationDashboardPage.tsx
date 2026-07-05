import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { getAutomationDashboard } from "@/lib/lesson-automation-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

type DashboardStats = {
  sourcesCount: number;
  activeSources: number;
  pendingReview: number;
  autoPublished: number;
  duplicates: number;
  errors: number;
  lastRun?: { started_at?: string; duration_ms?: number; items_new?: number };
};

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem", minWidth: "120px" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function AutomationDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [steps, setSteps] = useState<Array<{ step: string; status: string; detail?: string; created_at: string }>>([]);
  const [connectors, setConnectors] = useState<string[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    getAutomationDashboard()
      .then((r) => {
        setStats(r.stats as DashboardStats);
        setSteps((r.recentSteps as typeof steps) || []);
        setConnectors((r.connectors as string[]) || []);
      })
      .catch(() => {
        setStats(null);
        setSteps([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>لوحة مراقبة الأتمتة — Phase 5</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            أضف مصدرًا وانسَ — النظام يتابع كل 15 دقيقة ويستخرج وينشر تلقائيًا.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8125rem" }}>
          <Link href="/admin/content-production" style={{ color: C.emeraldDeep }}>إنتاج المحتوى</Link>
          <Link href="/admin/autonomous-platform" style={{ color: C.emeraldDeep }}>المنصة الذاتية</Link>
          <Link href="/admin/automation/platform" style={{ color: C.emeraldDeep }}>MKE Platform</Link>
          <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>المصادر</Link>
          <Link href="/admin/review-center" style={{ color: C.emeraldDeep }}>مركز المراجعة</Link>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <StatCard label="المصادر" value={stats?.sourcesCount ?? 0} />
            <StatCard label="نشط" value={stats?.activeSources ?? 0} />
            <StatCard label="بانتظار المراجعة" value={stats?.pendingReview ?? 0} color="#0E6E52" />
            <StatCard label="منشور تلقائيًا" value={stats?.autoPublished ?? 0} />
            <StatCard label="مكرر" value={stats?.duplicates ?? 0} />
            <StatCard label="أخطاء" value={stats?.errors ?? 0} color="#991B1B" />
          </div>

          <section style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>Connectors المدعومة</h3>
            <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{connectors.join(" · ")}</p>
          </section>

          <section>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>آخر خطوات Pipeline</h3>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {steps.length === 0 && <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا سجلات بعد — طبّق migration Phase 5.</p>}
              {steps.map((s, i) => (
                <div key={i} style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem", background: C.parchmentDeep, borderRadius: "0.25rem" }}>
                  <strong>{s.step}</strong> · {s.status} · {s.detail?.slice(0, 80) || ""}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function AutomationDashboardPage() {
  return (
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <AutomationDashboardContent />
    </AdminShell>
  );
}

export { AutomationDashboardContent };
