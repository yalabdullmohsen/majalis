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

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="ii-stat" style={color ? { "--ii-val-color": color } as React.CSSProperties : undefined}>
      <div className="ii-stat__label">{label}</div>
      <div className="ii-stat__value">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ii-panel">
      <h3 className="ii-panel-h3">{title}</h3>
      {children}
    </div>
  );
}

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
        showSuccess("تم إنشاء المفتاح، انسخه الآن");
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
      if (report) showSuccess(`التقرير جاهز، ${report.api_endpoints} endpoint`);
      else showError("تعذر إنشاء التقرير");
    } catch {
      showError("تعذر إنشاء التقرير");
    }
  };

  if (loading) return <p>جاري تحميل لوحة المطورين...</p>;

  return (
    <div>
      <div className="ops-header">
        <h2 className="ops-title">Open Islamic Platform، لوحة المطورين</h2>
        <div className="ops-btn-group">
          <a href="/api/v1/docs?format=html" target="_blank" rel="noreferrer" className="ops-docs-link">
            التوثيق
          </a>
          <button type="button" onClick={handleReport} className="ops-btn">إنشاء التقرير</button>
        </div>
      </div>

      {createdKey && (
        <div className="ops-created-key">
          <strong>مفتاح API (يُعرض مرة واحدة):</strong>
          <code className="ops-created-code">{createdKey}</code>
        </div>
      )}

      <div className="ii-stats-grid">
        <StatCard label="Endpoints" value={API_VERSIONS.length * 20 + "+"} />
        <StatCard label="الأقسام" value={dashboard?.resources?.length ?? 0} />
        <StatCard label="مفاتيح API" value={dashboard?.keys?.length ?? 0} />
        <StatCard label="طلبات (30 يوم)" value={dashboard?.usage?.total ?? 0} />
        <StatCard label="متوسط الاستجابة" value={`${dashboard?.usage?.avg_response_ms ?? 0}ms`} />
        <StatCard label="الـ Webhooks" value={webhooks.length} />
        <StatCard label="Cache" value={dashboard?.cache?.entries ?? 0} />
        <StatCard label="أخطاء" value={dashboard?.usage?.errors ?? 0} color="#dc2626" />
      </div>

      <div className="ii-panels-grid">
        <Panel title="إصدارات API">
          {API_VERSIONS.map((v) => (
            <div key={v} className="ops-api-row">
              <a href={`/api/${v}/docs?format=html`} target="_blank" rel="noreferrer"><code>/api/{v}</code></a>
              {v === "v1" && "، Stable"}
              {v === "v2" && "، Enhanced metadata"}
              {v === "v3" && "، Relations + semantic"}
            </div>
          ))}
        </Panel>

        <Panel title="إنشاء مفتاح API">
          <input
            type="text"
            placeholder="اسم المفتاح"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="ops-key-input"
          />
          <button type="button" onClick={handleCreateKey} className="ops-btn">إنشاء مفتاح</button>
        </Panel>

        <Panel title="مفاتيح API">
          {(dashboard?.keys || []).map((k) => (
            <div key={k.id} className="ops-key-row">
              <span>{k.name} ({k.key_prefix}...)</span>
              <button type="button" className="ops-revoke-btn" onClick={() => handleRevoke(k.id)}>إلغاء</button>
            </div>
          ))}
          {!dashboard?.keys?.length && <p className="ii-muted">لا مفاتيح بعد</p>}
        </Panel>

        <Panel title="الـ Webhooks">
          <input
            type="url"
            placeholder="https://example.com/webhook"
            value={newWebhookUrl}
            onChange={(e) => setNewWebhookUrl(e.target.value)}
            className="ops-key-input"
          />
          <button type="button" onClick={handleCreateWebhook} className="ops-btn">إضافة Webhook</button>
          {webhooks.map((w) => (
            <div key={w.id} className="ops-webhook-url">{w.url}</div>
          ))}
        </Panel>

        <Panel title="الأقسام المغطاة">
          {(dashboard?.resources || []).slice(0, 12).map((r) => (
            <div key={r.id} className="ops-resource-row">
              <code>GET /api/v1/{r.id}</code>، {r.label}
            </div>
          ))}
        </Panel>

        <Panel title="سجل الطلبات">
          {logs.slice(0, 8).map((l) => (
            <div key={l.id} className="ops-log-row">
              {l.method} {l.path}، {l.status_code} ({l.response_ms}ms)
            </div>
          ))}
          {!logs.length && <p className="ii-muted">لا سجلات بعد</p>}
        </Panel>
      </div>

      {plan && (
        <section>
          <h3 className="ops-plan-h3">خطة الإصدار القادم</h3>
          {plan.roadmap?.map((r: any) => (
            <div key={r.version} className="ops-release-box">
              <strong>{r.version}</strong>
              <ul className="ops-release-ul">
                {r.features?.map((f: string) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
