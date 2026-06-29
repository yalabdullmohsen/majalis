import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  getGkeDashboard,
  runGkeDryRun,
  validateGkeArchitecture,
  type GkeDashboard,
  type GkeLayerStatus,
} from "@/lib/global-knowledge-engine-api";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, minWidth: "100px" }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.35rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

function LayerBadge({ layer }: { layer: GkeLayerStatus }) {
  const pending = layer.status === "pending";
  return (
    <div
      style={{
        padding: "0.65rem 0.85rem",
        borderRadius: "0.45rem",
        border: `1px solid ${C.line}`,
        background: pending ? "#FEF3C7" : "#D1FAE5",
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
      }}
    >
      <strong style={{ fontSize: "0.85rem", color: C.emeraldDeep }}>{layer.label}</strong>
      <span style={{ fontSize: "0.72rem", color: C.inkSoft }}>
        مرحلة {layer.phase} · {pending ? "قيد التنفيذ" : "جاهز"}
      </span>
    </div>
  );
}

export function GlobalKnowledgeEngineSection() {
  const { showSuccess, showError } = useAdminShell();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<GkeDashboard | null>(null);
  const [running, setRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getGkeDashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleValidate = async () => {
    setRunning(true);
    try {
      const r = await validateGkeArchitecture();
      showSuccess(r.ok ? "البنية المعمارية سليمة" : "تحقق من الطبقات");
      load();
    } catch {
      showError("فشل التحقق");
    } finally {
      setRunning(false);
    }
  };

  const handleDryRun = async () => {
    setRunning(true);
    setDryRunResult(null);
    try {
      const r = await runGkeDryRun({
        title: "درس تجريبي — GKE",
        body: "نص تجريبي للتحقق من سلسلة المعالجة.",
        content_kind: "lesson",
      });
      setDryRunResult(r.ok ? `✓ Dry-run OK (${r.duration_ms}ms, ${r.stages?.length || 0} stages)` : `✗ ${r.error || "failed"}`);
      showSuccess("تم تشغيل dry-run");
    } catch {
      showError("فشل dry-run");
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <Loading />;

  const health = dashboard?.health;

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.35rem", color: C.emeraldDeep }}>
          Global Knowledge Engine (GKE)
        </h1>
        <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.9rem" }}>
          محرك المعرفة المركزي — v{dashboard?.version || "1.0.0"} · المرحلة {dashboard?.phase || 1} (Architecture)
        </p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginBottom: "1.25rem" }}>
        <StatCard label="Health Score" value={health?.score ?? "—"} sub={health?.status} />
        <StatCard label="Pipeline Layers" value={health?.layers?.length ?? 0} />
        <StatCard
          label="Architecture"
          value={dashboard?.validation?.ok ? "✓" : "!"}
          sub={dashboard?.validation?.ok ? "wired" : "check"}
        />
        <StatCard label="Phase" value={dashboard?.phase ?? 1} sub="Architecture First" />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button
          type="button"
          disabled={running}
          onClick={handleValidate}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.4rem",
            border: "none",
            background: C.emerald,
            color: C.parchment,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          التحقق من البنية
        </button>
        <button
          type="button"
          disabled={running}
          onClick={handleDryRun}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.4rem",
            border: `1px solid ${C.line}`,
            background: C.panel,
            color: C.emeraldDeep,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Dry-run Pipeline
        </button>
        <Link href="/admin/ake" style={{ padding: "0.5rem 1rem", color: C.emeraldDeep, fontWeight: 700 }}>
          AKE (legacy)
        </Link>
        <Link href="/admin/automation/platform" style={{ padding: "0.5rem 1rem", color: C.emeraldDeep, fontWeight: 700 }}>
          MKE Platform
        </Link>
      </div>

      {dryRunResult && (
        <p style={{ padding: "0.65rem", background: "#ECFDF5", borderRadius: "0.4rem", fontSize: "0.85rem" }}>
          {dryRunResult}
        </p>
      )}

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginBottom: "0.75rem" }}>Pipeline Layers</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
            gap: "0.5rem",
          }}
        >
          {(health?.layers || []).map((layer) => (
            <LayerBadge key={layer.id} layer={layer} />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginBottom: "0.75rem" }}>Subsystems (delegated)</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {Object.entries(health?.subsystems || {}).map(([key, val]) => (
            <StatCard
              key={key}
              label={key}
              value={(val as { count?: number; status?: string })?.count ?? (val as { status?: string })?.status ?? "—"}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginBottom: "0.5rem" }}>Principles</h2>
        <ul style={{ margin: 0, paddingInlineStart: "1.25rem", color: C.inkSoft, fontSize: "0.88rem", lineHeight: 1.7 }}>
          {(health?.principles || []).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default GlobalKnowledgeEngineSection;
