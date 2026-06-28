import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { fetchProductionHealth, type ProductionHealthPayload } from "@/lib/autonomous-platform-api";

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    PASS: { bg: "#DCFCE7", fg: C.emeraldDeep },
    WARNING: { bg: "#FEF3C7", fg: "#92400E" },
    FAIL: { bg: "#FEE2E2", fg: "#991B1B" },
  };
  const c = colors[status] || colors.FAIL;
  return (
    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

function BlockerBanner({ blockers }: { blockers: ProductionHealthPayload["blockers"] }) {
  const critical = blockers.filter((b) => b.severity !== "warning");
  if (critical.length === 0) return null;
  return (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1.25rem" }}>
      <strong style={{ color: "#991B1B" }}>Blockers ({critical.length}) — يمنع Production Readiness = 100%</strong>
      <ul style={{ margin: "0.5rem 0 0", paddingRight: "1.25rem", fontSize: "0.875rem" }}>
        {critical.map((b, i) => (
          <li key={i}>
            [{b.type}] {b.key || b.impact}
            {b.programmaticFix === false && " — يتطلب إجراء يدوي من المالك"}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChecklistContent() {
  const [health, setHealth] = useState<ProductionHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHealth(await fetchProductionHealth());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !health) return <Loading />;

  if (!health) return null;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: C.emeraldDeep }}>Production Checklist</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>
            Readiness: <strong>{health.readinessPct}%</strong> · Blockers: <strong>{health.blockersCount ?? health.blockers.length}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8125rem" }}>
          <Link href="/admin/platform/health" style={{ color: C.emeraldDeep }}>Production Health</Link>
          <button type="button" onClick={() => void load()} style={{ padding: "0.4rem 0.8rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>
            تحديث
          </button>
        </div>
      </div>

      <BlockerBanner blockers={health.blockers} />

      <div style={{ display: "grid", gap: "0.65rem" }}>
        {(health.checklist || []).map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.875rem", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem" }}>
            <StatusPill status={item.status} />
            <div style={{ flex: 1 }}>
              <strong>{item.label}</strong>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>{item.reason}</p>
            </div>
          </div>
        ))}
      </div>

      {health.autoActivationNote && (
        <p style={{ marginTop: "1.25rem", fontSize: "0.8125rem", color: C.emeraldDeep, background: "#EFF6FF", padding: "0.875rem", borderRadius: "0.5rem" }}>
          {health.autoActivationNote}
        </p>
      )}
    </div>
  );
}

export function PlatformChecklistPage() {
  return (
    <AdminShell section="lessons">
      <ChecklistContent />
    </AdminShell>
  );
}

export default PlatformChecklistPage;
