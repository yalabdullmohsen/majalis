import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  CONTENT_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  createPlatformSource,
  deletePlatformSource,
  discoverPlatformFeeds,
  listPlatformSources,
  testPlatformSource,
  togglePlatformSource,
  type ManagedSource,
} from "@/lib/autonomous-platform-api";

const EMPTY: Partial<ManagedSource> = {
  name: "",
  source_url: "",
  source_type: "rss",
  content_types: ["benefits"],
  priority: 5,
  trust_score: 80,
  active: true,
};

function healthColor(score?: number) {
  if (score == null) return C.inkSoft;
  if (score >= 80) return C.emeraldDeep;
  if (score >= 60) return "#92400E";
  return "#991B1B";
}

function formatDt(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function PlatformSourcesContent() {
  const [sources, setSources] = useState<ManagedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Partial<ManagedSource>>({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);
  const [discoverUrl, setDiscoverUrl] = useState("");
  const [discoveries, setDiscoveries] = useState<Array<{ discovered_url: string; feed_type: string; confidence: number }>>([]);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    listPlatformSources()
      .then((r) => {
        if (!r.ok && r.message) {
          setLoadError(r.message);
          setSources([]);
        } else {
          setSources(r.sources || []);
        }
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "تعذر تحميل المصادر");
        setSources([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    if (!form.name?.trim() || !form.source_url?.trim()) return;
    setBusy(true);
    try {
      await createPlatformSource(form);
      setShowForm(false);
      setForm({ ...EMPTY });
      load();
    } finally {
      setBusy(false);
    }
  };

  const onTest = async (id: string) => {
    setBusy(true);
    setTestResult(null);
    try {
      const r = await testPlatformSource(id);
      const t = r.test;
      setTestResult(
        t
          ? `HTTP ${t.httpStatus} · ${t.responseMs}ms · ${t.itemsFound} عنصر · Health=${t.healthScore}`
          : r.error || "فشل الاختبار",
      );
      load();
    } finally {
      setBusy(false);
    }
  };

  const onDiscover = async () => {
    if (!discoverUrl.trim()) return;
    setBusy(true);
    try {
      const r = await discoverPlatformFeeds(discoverUrl.trim());
      setDiscoveries(r.discoveries || []);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Loading />
        <p style={{ textAlign: "center", color: C.inkSoft }}>جارٍ تحميل المصادر…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: C.emeraldDeep, fontSize: "1.5rem" }}>Admin → Sources</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>
            إدارة مصادر المحتوى من قاعدة البيانات — بدون تعديل ملفات المشروع
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.8125rem" }}>
          <Link href="/admin/platform/health" style={{ color: C.emeraldDeep }}>Production Health</Link>
          <Link href="/admin/platform/analytics" style={{ color: C.emeraldDeep }}>الإحصائيات</Link>
          <Link href="/admin/automation/center" style={{ color: C.emeraldDeep }}>Automation Center</Link>
          <Link href="/admin/import" style={{ color: C.emeraldDeep }}>مركز الاستيراد</Link>
        </div>
      </div>

      <div style={{ background: "#EFF6FF", border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.875rem", marginBottom: "1rem" }}>
        <strong>AKP v3:</strong> Health Score &lt; 60 يعطّل المصدر تلقائياً ويرسل تنبيهاً.
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button type="button" disabled={busy} onClick={() => { setForm({ ...EMPTY }); setShowForm(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>
          + إضافة مصدر
        </button>
      </div>

      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input value={discoverUrl} onChange={(e) => setDiscoverUrl(e.target.value)} placeholder="https://example.com — اكتشاف RSS/Atom/Sitemap" style={{ flex: 1, minWidth: "220px", padding: "0.5rem", borderRadius: "0.375rem", border: `1px solid ${C.line}` }} />
        <button type="button" disabled={busy} onClick={() => void onDiscover()} style={{ padding: "0.5rem 1rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel, cursor: "pointer" }}>
          اكتشاف تلقائي
        </button>
      </div>

      {discoveries.length > 0 && (
        <div style={{ marginBottom: "1rem", fontSize: "0.8125rem" }}>
          <strong>مقترحات:</strong>
          {discoveries.map((d) => (
            <div key={d.discovered_url} style={{ marginTop: "0.35rem" }}>
              {d.feed_type}: {d.discovered_url} ({d.confidence}%)
            </div>
          ))}
        </div>
      )}

      {testResult && <p style={{ fontSize: "0.8125rem", color: C.emeraldDeep }}>{testResult}</p>}

      <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: "0.5rem", background: C.panel }}>
        {sources.length === 0 ? (
          <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: C.emeraldDeep }}>لا توجد مصادر في قاعدة البيانات</p>
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", color: C.inkSoft, maxWidth: "560px", marginInline: "auto" }}>
              {loadError ||
                "السبب: Bootstrap/Seed لم يُنفَّذ — يتطلب SUPABASE_SERVICE_ROLE_KEY. بعد إضافته، يُفعِّل النظام Seed تلقائياً."}
            </p>
            <p style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem" }}>
              <Link href="/admin/platform/health" style={{ color: C.emeraldDeep }}>→ عرض Production Health للتفاصيل</Link>
            </p>
          </div>
        ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead>
            <tr style={{ background: C.parchmentDeep, textAlign: "right" }}>
              {["الاسم", "النوع", "Health", "عناصر", "سرعة", "آخر نجاح", "آخر خطأ", ""].map((h) => (
                <th key={h} style={{ padding: "0.5rem", fontSize: "0.75rem", color: C.inkSoft }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id || s.slug}>
                <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>
                  <div>{s.name}</div>
                  <div style={{ color: C.inkSoft, fontSize: "0.75rem" }}>{s.slug}</div>
                </td>
                <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{s.source_type}</td>
                <td style={{ padding: "0.5rem", fontWeight: 700, color: healthColor(s.health_score) }}>{s.health_score ?? "—"}</td>
                <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{s.items_extracted_total ?? 0}</td>
                <td style={{ padding: "0.5rem", fontSize: "0.8125rem" }}>{s.avg_fetch_ms ? `${s.avg_fetch_ms}ms` : s.last_response_ms ? `${s.last_response_ms}ms` : "—"}</td>
                <td style={{ padding: "0.5rem", fontSize: "0.75rem" }}>{formatDt(s.last_success_at)}</td>
                <td style={{ padding: "0.5rem", fontSize: "0.75rem", color: "#991B1B", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>{s.last_error || "—"}</td>
                <td style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
                  <button type="button" disabled={busy} onClick={() => s.id && onTest(s.id)} style={{ fontSize: "0.75rem", marginLeft: "0.25rem" }}>اختبار</button>
                  <button type="button" disabled={busy} onClick={() => s.id && togglePlatformSource(s.id, !s.active).then(load)} style={{ fontSize: "0.75rem" }}>
                    {s.active ? "تعطيل" : "تفعيل"}
                  </button>
                  {s.id && (
                    <button type="button" disabled={busy} onClick={() => deletePlatformSource(s.id!).then(load)} style={{ fontSize: "0.75rem", color: "#991B1B" }}>
                      حذف
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: C.parchment, padding: "1.25rem", borderRadius: "0.5rem", width: "100%", maxWidth: "480px", border: `1px solid ${C.line}` }}>
            <h3 style={{ marginTop: 0 }}>مصدر جديد</h3>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              الاسم
              <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.5rem" }} />
            </label>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              الرابط
              <input value={form.source_url || ""} onChange={(e) => setForm({ ...form, source_url: e.target.value })} style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.5rem" }} />
            </label>
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
              نوع المصدر
              <select value={form.source_type || "rss"} onChange={(e) => setForm({ ...form, source_type: e.target.value })} style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.5rem" }}>
                {SOURCE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
              أنواع المحتوى
              <select multiple value={form.content_types || []} onChange={(e) => setForm({ ...form, content_types: Array.from(e.target.selectedOptions, (o) => o.value) })} style={{ display: "block", width: "100%", marginTop: "0.25rem", padding: "0.5rem", minHeight: "80px" }}>
                {CONTENT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" disabled={busy} onClick={() => void onSave()} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem" }}>حفظ</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "0.5rem 1rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlatformSourcesPage() {
  return (
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <PlatformSourcesContent />
    </AdminShell>
  );
}

export default PlatformSourcesPage;
