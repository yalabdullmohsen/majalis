import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getInstagramIntegrationStatus,
  testInstagramIntegration,
  refreshInstagramTokenInfo,
  type InstagramIntegrationStatus,
} from "@/lib/instagram-integration-api";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`igst-badge${ok ? " igst-badge--ok" : " igst-badge--err"}`}>
      {label}
    </span>
  );
}

function InstagramIntegrationContent() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<InstagramIntegrationStatus | null>(null);
  const [testResult, setTestResult] = useState<string>("");

  const load = useCallback(() => {
    setLoading(true);
    getInstagramIntegrationStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="igst-header">
        <div>
          <h2 className="igst-title">Instagram Graph API — Phase 7</h2>
          <p className="igst-desc">
            ربط Meta Business لجلب المنشورات تلقائيًا. بدون ربط: Manual Assist Mode من{" "}
            <Link href="/admin/sources" className="igst-link">/admin/sources</Link>.
          </p>
        </div>
        <Link href="/admin/sources" className="igst-back-link">← المصادر</Link>
      </div>

      {loading ? <SkeletonCardGrid count={6} /> : (
        <>
          <section className="igst-section">
            <h3 className="igst-section-h3">حالة الربط</h3>
            <div className="igst-info-grid">
              <div>الحالة: <StatusBadge ok={status?.configured ?? false} label={status?.configured ? "Graph API مُعدّ" : "Instagram connector not configured"} /></div>
              {status?.manualAssistMode && (
                <div className="igst-manual-note">Manual Assist Mode نشط — ارفع الإعلانات يدويًا من صفحة المصادر.</div>
              )}
              <div>App ID: {status?.appId || "—"}</div>
              <div>Business Account ID: {status?.businessAccountId || "—"}</div>
              <div>Access Token: {status?.accessTokenSet ? status.accessTokenPreview : "غير مُعدّ"}</div>
            </div>
            <div className="igst-btns">
              <button type="button" disabled={busy} onClick={onTest} className="igst-primary-btn">
                Test Connection
              </button>
              <button type="button" disabled={busy} onClick={onRefreshInfo} className="igst-secondary-btn">
                Refresh Token Info
              </button>
            </div>
            {testResult && <p className="igst-result">{testResult}</p>}
          </section>

          <section className="igst-env-section">
            <strong>متغيرات البيئة (Vercel Secrets):</strong>
            <ul className="igst-env-ul">
              <li>INSTAGRAM_GRAPH_ACCESS_TOKEN</li>
              <li>INSTAGRAM_APP_ID</li>
              <li>INSTAGRAM_APP_SECRET</li>
              <li>INSTAGRAM_BUSINESS_ACCOUNT_ID</li>
              <li>INSTAGRAM_WEBHOOK_VERIFY_TOKEN</li>
            </ul>
          </section>

          <section>
            <h3 className="igst-sources-h3">المصادر المرتبطة ({status?.linkedSources?.length ?? 0})</h3>
            <div className="igst-sources-grid">
              {(status?.linkedSources || []).map((s) => (
                <div key={s.id} className="igst-source-card">
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
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <InstagramIntegrationContent />
    </AdminShell>
  );
}

export { InstagramIntegrationContent };
