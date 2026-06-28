import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { fetchVisionAiStatus } from "@/lib/lesson-import-api";

type AiStatus = {
  ok?: boolean;
  systemStatus?: string;
  primaryProvider?: string;
  fallbackProvider?: string;
  fallbackEnabled?: boolean;
  anthropic?: { configured?: boolean; billingDegraded?: boolean; status?: string };
  openai?: { configured?: boolean; status?: string };
  lastSuccess?: { at?: string; provider?: string } | null;
  lastError?: { at?: string; code?: string; message?: string } | null;
  lastProvider?: string | null;
  keys?: { anthropic?: boolean; openai?: boolean };
  env?: Record<string, string>;
};

function StatusPill({ status }: { status?: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    healthy: { bg: "#DCFCE7", fg: C.emeraldDeep, label: "سليم" },
    ready: { bg: "#DCFCE7", fg: C.emeraldDeep, label: "جاهز" },
    degraded: { bg: "#FEF3C7", fg: "#92400E", label: "متدهور" },
    manual_only: { bg: "#FEF3C7", fg: "#92400E", label: "يدوي فقط" },
    insufficient_credit: { bg: "#FEE2E2", fg: "#991B1B", label: "رصيد منخفض" },
    not_configured: { bg: "#E5E7EB", fg: "#374151", label: "غير مُعد" },
  };
  const s = map[status || ""] || { bg: "#E5E7EB", fg: "#374151", label: status || "—" };
  return (
    <span style={{ padding: "0.25rem 0.65rem", borderRadius: "999px", background: s.bg, color: s.fg, fontWeight: 700, fontSize: "0.8125rem" }}>
      {s.label}
    </span>
  );
}

function PlatformAiStatusContent() {
  const [data, setData] = useState<AiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchVisionAiStatus();
      setData(res as AiStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل حالة الذكاء الاصطناعي");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !data) return <Loading />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>حالة الذكاء الاصطناعي — Vision</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            Claude / OpenAI / OCR / مراجعة يدوية — لاستيراد صور الدروس
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/admin/platform/health" style={{ fontSize: "0.8125rem", color: C.emeraldDeep }}>صحة المنصة</Link>
          <Link href="/admin/content-import/image" style={{ fontSize: "0.8125rem", color: C.emeraldDeep }}>استيراد صورة</Link>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem", color: "#991B1B" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "1.5rem" }}>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginBottom: "0.35rem" }}>حالة النظام</div>
          <StatusPill status={data?.systemStatus} />
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginBottom: "0.35rem" }}>المزود الأساسي</div>
          <strong>{data?.primaryProvider || "—"}</strong>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginBottom: "0.35rem" }}>المزود الاحتياطي</div>
          <strong>{data?.fallbackProvider || "—"}</strong>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginBottom: "0.35rem" }}>Fallback مفعّل</div>
          <strong>{data?.fallbackEnabled ? "نعم" : "لا"}</strong>
        </div>
      </div>

      <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontSize: "0.9375rem" }}>المفاتيح والمزودين</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.5rem 0", color: C.inkSoft }}>ANTHROPIC_API_KEY</td>
              <td><StatusPill status={data?.keys?.anthropic ? "ready" : "not_configured"} /></td>
              <td><StatusPill status={data?.anthropic?.billingDegraded ? "insufficient_credit" : data?.anthropic?.status} /></td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem 0", color: C.inkSoft }}>OPENAI_API_KEY</td>
              <td><StatusPill status={data?.keys?.openai ? "ready" : "not_configured"} /></td>
              <td><StatusPill status={data?.openai?.status} /></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep, fontSize: "0.9375rem" }}>آخر نجاح</h3>
          <pre style={{ fontSize: "0.75rem", whiteSpace: "pre-wrap", margin: 0 }}>
            {data?.lastSuccess ? JSON.stringify(data.lastSuccess, null, 2) : "—"}
          </pre>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep, fontSize: "0.9375rem" }}>آخر خطأ</h3>
          <pre style={{ fontSize: "0.75rem", whiteSpace: "pre-wrap", margin: 0 }}>
            {data?.lastError ? JSON.stringify(data.lastError, null, 2) : "—"}
          </pre>
        </div>
      </section>

      {data?.env && (
        <section style={{ marginTop: "1rem", background: C.parchmentDeep, borderRadius: "0.5rem", padding: "0.75rem", fontSize: "0.8125rem" }}>
          <strong>Env:</strong> VISION_PRIMARY_PROVIDER={data.env.VISION_PRIMARY_PROVIDER}, VISION_FALLBACK_ENABLED={data.env.VISION_FALLBACK_ENABLED}
        </section>
      )}

      <button type="button" onClick={() => void load()} style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>
        تحديث
      </button>
    </div>
  );
}

export default function PlatformAiStatusPage() {
  return (
    <AdminShell section="dashboard">
      <PlatformAiStatusContent />
    </AdminShell>
  );
}
