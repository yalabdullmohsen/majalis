import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { fetchDailyGoals, fetchPlatformAnalytics, runPlatformCycle } from "@/lib/autonomous-platform-api";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem", flex: "1 1 140px" }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.35rem 0 0", fontSize: "1.35rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
    </div>
  );
}

function PlatformAnalyticsContent() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, g] = await Promise.all([fetchPlatformAnalytics(), fetchDailyGoals()]);
      setAnalytics(a.analytics || a);
      setGoals(g);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !analytics) {
    return (
      <div>
        <Loading />
        <p style={{ textAlign: "center", color: C.inkSoft }}>جارٍ تحميل الإحصائيات…</p>
      </div>
    );
  }

  const counts = analytics?.counts || {};
  const pipelines = analytics?.pipelines || {};

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: C.emeraldDeep }}>Production Analytics</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>AKP v3 — Zero Manual Operation</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>المصادر</Link>
          <button type="button" disabled={busy} onClick={() => { setBusy(true); runPlatformCycle("analytics").finally(() => { setBusy(false); load(); }); }} style={{ padding: "0.4rem 0.8rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>
            تشغيل دورة
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <Metric label="اليوم" value={counts.today ?? 0} />
        <Metric label="هذا الأسبوع" value={counts.week ?? 0} />
        <Metric label="هذا الشهر" value={counts.month ?? 0} />
        <Metric label="مرفوض" value={counts.rejected ?? 0} />
        <Metric label="مكرر" value={counts.duplicates ?? 0} />
      </div>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem" }}>الحصص اليومية</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {Object.entries(goals?.progress || pipelines).map(([type, p]: [string, any]) => (
            <div key={type} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.875rem" }}>
              <strong>{p.label || type}</strong>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem" }}>
                {p.produced ?? p.publishedToday ?? 0} / {p.target ?? p.quota ?? "—"}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: p.status === "met" || p.quotaMet ? C.emeraldDeep : "#92400E" }}>
                {p.status === "met" || p.quotaMet ? "✓ تحققت الحصة" : `متبقي ${p.gap ?? Math.max(0, (p.target || p.quota || 0) - (p.produced || p.publishedToday || 0))}`}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1rem" }}>أكثر المصادر نشاطاً</h2>
        <ul style={{ fontSize: "0.875rem" }}>
          {(analytics?.topSources || []).slice(0, 8).map((s: any) => (
            <li key={s.id}>{s.name}: {s.itemsExtracted ?? 0} عنصر (Health {s.healthScore ?? "—"})</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function PlatformAnalyticsPage() {
  return (
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <PlatformAnalyticsContent />
    </AdminShell>
  );
}

export default PlatformAnalyticsPage;
