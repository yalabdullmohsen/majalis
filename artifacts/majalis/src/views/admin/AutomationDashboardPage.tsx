import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { getAutomationDashboard } from "@/lib/lesson-automation-api";
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
    <div className="adp-stat" style={{ "--adp-val-color": color } as React.CSSProperties}>
      <div className="adp-stat__value">{value}</div>
      <div className="adp-stat__label">{label}</div>
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
      <div className="adp-header">
        <div>
          <h2 className="adp-title">لوحة مراقبة الأتمتة — Phase 5</h2>
          <p className="adp-desc">
            أضف مصدرًا وانسَ — النظام يتابع كل 15 دقيقة ويستخرج وينشر تلقائيًا.
          </p>
        </div>
        <div className="adp-nav-links">
          <Link href="/admin/content-production" className="adp-nav-link">إنتاج المحتوى</Link>
          <Link href="/admin/autonomous-platform" className="adp-nav-link">المنصة الذاتية</Link>
          <Link href="/admin/automation/platform" className="adp-nav-link">MKE Platform</Link>
          <Link href="/admin/sources" className="adp-nav-link">المصادر</Link>
          <Link href="/admin/review-center" className="adp-nav-link">مركز المراجعة</Link>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div className="adp-stats-row">
            <StatCard label="المصادر" value={stats?.sourcesCount ?? 0} />
            <StatCard label="نشط" value={stats?.activeSources ?? 0} />
            <StatCard label="بانتظار المراجعة" value={stats?.pendingReview ?? 0} color="#0E6E52" />
            <StatCard label="منشور تلقائيًا" value={stats?.autoPublished ?? 0} />
            <StatCard label="مكرر" value={stats?.duplicates ?? 0} />
            <StatCard label="أخطاء" value={stats?.errors ?? 0} color="#991B1B" />
          </div>

          <section className="adp-section--mb">
            <h3 className="adp-section-h3">Connectors المدعومة</h3>
            <p className="adp-section-p">{connectors.join(" · ")}</p>
          </section>

          <section>
            <h3 className="adp-section-h3">آخر خطوات Pipeline</h3>
            <div className="adp-steps-grid">
              {steps.length === 0 && <p className="adp-steps-empty">لا سجلات بعد — طبّق migration Phase 5.</p>}
              {steps.map((s, i) => (
                <div key={i} className="adp-step">
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
