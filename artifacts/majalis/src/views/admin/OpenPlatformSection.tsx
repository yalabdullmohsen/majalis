import { useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  fetchOpenPlatformDashboard,
  createApiKey,
  revokeApiKey,
  fetchApiLogs,
  createWebhook,
  fetchWebhooks,
  generateOpenPlatformReport,
  fetchReleasePlan,
  API_VERSIONS,
  WEBHOOK_EVENTS,
  type OpenPlatformDashboard,
} from "@/lib/open-platform-service";

export function OpenPlatformSection() {
  const { showSuccess, showError } = useAdminShell();
  const [dashboard, setDashboard] = useState<OpenPlatformDashboard | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([fetchOpenPlatformDashboard(), fetchApiLogs(20), fetchWebhooks(), fetchReleasePlan()])
      .then(([d, l, w, p]) => {
        setDashboard(d);
        setLogs(l);
        setWebhooks(w);
        setPlan(p);
      })
      .catch(() => showError("تعذّر تحميل بيانات المنصة المفتوحة."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateKey = async () => {
    try {
      const result = await createApiKey(newKeyName || "API Key");
      if (result.key) {
        setCreatedKey(result.key);
        showSuccess("تم إنشاء المفتاح — انسخه الآن");
        refresh();
      } else {
        showError("تعذّر إنشاء المفتاح.");
      }
    } catch {
      showError("فشل إنشاء المفتاح");
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await revokeApiKey(keyId);
      showSuccess("تم إلغاء المفتاح");
      refresh();
    } catch {
      showError("فشل الإلغاء");
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) {
      showError("أدخل رابطاً صحيحاً.");
      return;
    }
    try {
      await createWebhook(newWebhookUrl, WEBHOOK_EVENTS.slice(0, 3), "Webhook");
      showSuccess("تم إنشاء Webhook");
      setNewWebhookUrl("");
      refresh();
    } catch {
      showError("فشل إنشاء Webhook");
    }
  };

  const handleReport = async () => {
    try {
      const report = await generateOpenPlatformReport();
      if (report) showSuccess(`التقرير جاهز — ${report.api_endpoints} endpoint`);
      else showError("تعذر إنشاء التقرير");
    } catch {
      showError("تعذر إنشاء التقرير");
    }
  };

  if (loading) return <p>جاري تحميل لوحة المطورين...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0 }}>Open Islamic Platform — لوحة المطورين</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <a href="/api/v1/docs?format=html" target="_blank" rel="noreferrer" style={{ padding: "0.5rem 1rem", border: "1px solid var(--line)", borderRadius: "0.375rem", textDecoration: "none" }}>
            التوثيق
          </a>
          <button type="button" onClick={handleReport}>إنشاء التقرير</button>
        </div>
      </div>

      {createdKey && (
        <div style={{ padding: "1rem", marginBottom: "1rem", background: "rgba(14,110,82,0.08)", borderRadius: "0.5rem", fontSize: "0.875rem" }}>
          <strong>مفتاح API (يُعرض مرة واحدة):</strong>
          <code style={{ display: "block", marginTop: "0.5rem", wordBreak: "break-all" }}>{createdKey}</code>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Endpoints" value={API_VERSIONS.length * 20 + "+"} />
        <StatCard label="الأقسام" value={dashboard?.resources?.length ?? 0} />
        <StatCard label="مفاتيح API" value={dashboard?.keys?.length ?? 0} />
        <StatCard label="طلبات (30 يوم)" value={dashboard?.usage?.total ?? 0} />
        <StatCard label="متوسط الاستجابة" value={`${dashboard?.usage?.avg_response_ms ?? 0}ms`} />
        <StatCard label="Webhooks" value={webhooks.length} />
        <StatCard label="Cache" value={dashboard?.cache?.entries ?? 0} />
        <StatCard label="أخطاء" value={dashboard?.usage?.errors ?? 0} color="#dc2626" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <Panel title="إصدارات API">
          {API_VERSIONS.map((v) => (
            <div key={v} style={{ fontSize: "0.8125rem", padding: "0.25rem 0" }}>
              <a href={`/api/${v}/docs?format=html`} target="_blank" rel="noreferrer"><code>/api/{v}</code></a>
              {v === "v1" && " — Stable"}
              {v === "v2" && " — Enhanced metadata"}
              {v === "v3" && " — Relations + semantic"}
            </div>
          ))}
        </Panel>

        <Panel title="إنشاء مفتاح API">
          <input
            type="text"
            placeholder="اسم المفتاح"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
          />
          <button type="button" onClick={handleCreateKey}>إنشاء مفتاح</button>
        </Panel>

        <Panel title="مفاتيح API">
          {(dashboard?.keys || []).map((k) => (
            <div key={k.id} style={{ fontSize: "0.8125rem", padding: "0.35rem 0", display: "flex", justifyContent: "space-between" }}>
              <span>{k.name} ({k.key_prefix}...)</span>
              <button type="button" style={{ fontSize: "0.75rem" }} onClick={() => handleRevoke(k.id)}>إلغاء</button>
            </div>
          ))}
          {!dashboard?.keys?.length && <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا مفاتيح بعد</p>}
        </Panel>

        <Panel title="Webhooks">
          <input
            type="url"
            placeholder="https://example.com/webhook"
            value={newWebhookUrl}
            onChange={(e) => setNewWebhookUrl(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
          />
          <button type="button" onClick={handleCreateWebhook}>إضافة Webhook</button>
          {webhooks.map((w) => (
            <div key={w.id} style={{ fontSize: "0.75rem", marginTop: "0.5rem", wordBreak: "break-all" }}>{w.url}</div>
          ))}
        </Panel>

        <Panel title="الأقسام المغطاة">
          {(dashboard?.resources || []).slice(0, 12).map((r) => (
            <div key={r.id} style={{ fontSize: "0.8125rem", padding: "0.15rem 0" }}>
              <code>GET /api/v1/{r.id}</code> — {r.label}
            </div>
          ))}
        </Panel>

        <Panel title="سجل الطلبات">
          {logs.slice(0, 8).map((l) => (
            <div key={l.id} style={{ fontSize: "0.75rem", padding: "0.2rem 0" }}>
              {l.method} {l.path} — {l.status_code} ({l.response_ms}ms)
            </div>
          ))}
          {!logs.length && <p style={{ fontSize: "0.8125rem", color: "var(--ink-soft)" }}>لا سجلات بعد</p>}
        </Panel>
      </div>

      {plan && (
        <section>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>خطة الإصدار القادم</h3>
          {plan.roadmap?.map((r: any) => (
            <div key={r.version} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid var(--line)", borderRadius: "0.5rem" }}>
              <strong>{r.version}</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.25rem", fontSize: "0.8125rem" }}>
                {r.features?.map((f: string) => <li key={f}>{f}</li>)}
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
