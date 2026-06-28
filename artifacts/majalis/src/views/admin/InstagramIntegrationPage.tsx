import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getInstagramIntegrationStatus,
  testInstagramIntegration,
  refreshInstagramTokenInfo,
  getInstagramDiagnostics,
  type InstagramIntegrationStatus,
} from "@/lib/instagram-integration-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "0.2rem 0.5rem",
      borderRadius: "0.25rem",
      fontSize: "0.75rem",
      background: ok ? "#ECFDF5" : "#FEF2F2",
      color: ok ? "#065F46" : "#991B1B",
    }}>
      {label}
    </span>
  );
}

function InstagramIntegrationContent() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<InstagramIntegrationStatus | null>(null);
  const [testResult, setTestResult] = useState<string>("");

  const [diagnostics, setDiagnostics] = useState<InstagramIntegrationStatus | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      getInstagramIntegrationStatus(),
      getInstagramDiagnostics().catch(() => null),
    ])
      .then(([s, d]) => {
        setStatus(s);
        setDiagnostics(d);
      })
      .catch(() => {
        setStatus(null);
        setDiagnostics(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onTest = async () => {
    setBusy(true);
    setTestResult("");
    try {
      const r = await testInstagramIntegration();
      setTestResult(r.ok ? `✓ متصل: @${r.account?.username || "—"}` : `✗ ${r.error || "فشل"}`);
      load();
    } finally {
      setBusy(false);
    }
  };

  const onRefreshInfo = async () => {
    setBusy(true);
    try {
      const r = await refreshInstagramTokenInfo();
      setTestResult(r.message || "");
      setDiagnostics(r as InstagramIntegrationStatus);
      load();
    } finally {
      setBusy(false);
    }
  };

  const remediation = diagnostics?.remediation || status?.remediation;
  const tokenInfo = diagnostics?.token;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>Instagram Graph API — Phase 7</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            ربط Meta Business لجلب المنشورات تلقائيًا. بدون ربط: Manual Assist Mode من{" "}
            <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>/admin/sources</Link>.
          </p>
        </div>
        <Link href="/admin/sources" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>← المصادر</Link>
      </div>

      {loading ? <Loading /> : (
        <>
          <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem", marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "0.9375rem" }}>حالة الربط</h3>
            <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.8125rem" }}>
              <div>الحالة: <StatusBadge ok={status?.configured ?? false} label={status?.configured ? "Graph API مُعدّ" : "Instagram connector not configured"} /></div>
              {status?.manualAssistMode && (
                <div style={{ color: "#92400E" }}>Manual Assist Mode نشط — ارفع الإعلانات يدويًا من صفحة المصادر.</div>
              )}
              <div>App ID: {status?.appId || "—"}</div>
              <div>Business Account ID: {status?.businessAccountId || "—"}</div>
              <div>Access Token: {status?.accessTokenSet ? status.accessTokenPreview : "غير مُعدّ"}</div>
              {tokenInfo && (
                <>
                  <div>Token صالح: <StatusBadge ok={tokenInfo.valid !== false} label={tokenInfo.valid !== false ? "نعم" : "لا"} /></div>
                  {tokenInfo.expiresAt && <div>ينتهي: {tokenInfo.expiresAt}{tokenInfo.expiresInDays != null ? ` (${tokenInfo.expiresInDays} يوم)` : ""}</div>}
                  {tokenInfo.warning && <div style={{ color: "#92400E" }}>⚠ {tokenInfo.warning}</div>}
                  {(tokenInfo.scopes?.length ?? 0) > 0 && <div>Scopes: {tokenInfo.scopes!.join(", ")}</div>}
                </>
              )}
              {diagnostics?.pipelineImpact && (
                <div style={{ color: C.inkSoft, marginTop: "0.25rem" }}>{diagnostics.pipelineImpact}</div>
              )}
            </div>
            {remediation && remediation.steps.length > 0 && (
              <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#FEF3C7", borderRadius: "0.375rem", fontSize: "0.8125rem" }}>
                <strong>خطوات الإصلاح ({remediation.category}):</strong>
                <ol style={{ margin: "0.5rem 0 0", paddingRight: "1.25rem" }}>
                  {remediation.steps.map((step, i) => (
                    <li key={i} style={{ marginBottom: "0.35rem" }}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" disabled={busy} onClick={onTest} style={{ padding: "0.4rem 0.75rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
                Test Connection
              </button>
              <button type="button" disabled={busy} onClick={onRefreshInfo} style={{ padding: "0.4rem 0.75rem", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
                Refresh Token Info
              </button>
            </div>
            {testResult && <p style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem" }}>{testResult}</p>}
          </section>

          <section style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "0.5rem", padding: "1rem", marginBottom: "1rem", fontSize: "0.8125rem" }}>
            <strong>متغيرات البيئة (Vercel Secrets):</strong>
            <ul style={{ margin: "0.5rem 0 0", paddingRight: "1.25rem" }}>
              <li>INSTAGRAM_GRAPH_ACCESS_TOKEN</li>
              <li>INSTAGRAM_APP_ID</li>
              <li>INSTAGRAM_APP_SECRET</li>
              <li>INSTAGRAM_BUSINESS_ACCOUNT_ID</li>
              <li>INSTAGRAM_WEBHOOK_VERIFY_TOKEN (لـ /api/webhooks/instagram)</li>
            </ul>
          </section>

          <section>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>المصادر المرتبطة ({status?.linkedSources?.length ?? 0})</h3>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {(status?.linkedSources || []).map((s) => (
                <div key={s.id} style={{ fontSize: "0.8125rem", padding: "0.5rem", background: C.parchmentDeep, borderRadius: "0.375rem" }}>
                  <strong>{s.name}</strong> · @{s.handle} · {s.instagram_business_account_id ? `IG ID: ${s.instagram_business_account_id}` : "Business Discovery"}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function InstagramIntegrationPage() {
  return (
    <AdminShell section="lessons">
      <InstagramIntegrationContent />
    </AdminShell>
  );
}

export { InstagramIntegrationContent };
