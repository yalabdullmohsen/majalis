import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  listTknSources,
  upsertTknSource,
  toggleTknSource,
  syncTknSource,
  listTknOperations,
  TKN_SOURCE_TYPES,
  TKN_CONTENT_TYPES,
  type TknSource,
  type TknOperation,
} from "@/lib/trusted-knowledge-network-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";

const EMPTY: TknSource = {
  name: "",
  source_type: "rss",
  source_url: "",
  category: "general",
  priority: 5,
  trust_score: 70,
  fetch_interval_hours: 6,
  active: true,
  content_types: ["benefits"],
  parser: "rss",
  publication_policy: { auto_publish: false, min_trust: 80 },
};

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.line}`,
  fontFamily: "inherit",
  fontSize: "0.875rem",
};

function formatDt(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

export function TrustedKnowledgeSourcesPanel() {
  const [sources, setSources] = useState<TknSource[]>([]);
  const [operations, setOperations] = useState<TknOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<TknSource>({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);
  const [showOps, setShowOps] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([listTknSources(), listTknOperations()])
      .then(([srcRes, opsRes]) => {
        setSources((srcRes.sources as TknSource[]) || []);
        setOperations((opsRes.operations as TknOperation[]) || []);
      })
      .catch(() => {
        setSources([]);
        setOperations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSave = async () => {
    if (!form.name.trim() || !form.source_url.trim()) return;
    setBusy(true);
    try {
      await upsertTknSource({ ...form, parser: form.parser || form.source_type });
      setShowForm(false);
      setForm({ ...EMPTY });
      load();
    } finally {
      setBusy(false);
    }
  };

  const onSync = async (source: TknSource) => {
    if (!source.id) return;
    setBusy(true);
    try {
      await syncTknSource(source.id, source.content_types?.[0]);
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.8125rem", color: "#1E40AF" }}>
        <strong>Trusted Knowledge Network (Phase 5):</strong> مصادر معرفية موثوقة — RSS, JSON, XML, REST, CSV, Markdown, HTML, Database.
        {" "}
        <Link href="/admin/automation/platform" style={{ color: C.emeraldDeep }}>لوحة المنصة ←</Link>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button type="button" disabled={busy} onClick={() => { setForm({ ...EMPTY }); setShowForm(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
          + إضافة مصدر معرفي
        </button>
        <button type="button" disabled={busy} onClick={() => setShowOps((v) => !v)} style={{ padding: "0.5rem 1rem", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
          {showOps ? "إخفاء السجل" : "سجل العمليات"}
        </button>
      </div>

      {showForm && (
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep }}>{form.id ? "تعديل مصدر" : "مصدر معرفي جديد"}</h3>
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <input placeholder="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputSt} />
            <input placeholder="الرابط" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} style={inputSt} dir="ltr" />
            <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value, parser: e.target.value })} style={inputSt}>
              {TKN_SOURCE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input placeholder="الفئة" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputSt} />
            <input type="number" placeholder="الأولوية (1-10)" value={form.priority ?? 5} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} style={inputSt} />
            <input type="number" placeholder="Trust Score" value={form.trust_score ?? 70} onChange={(e) => setForm({ ...form, trust_score: Number(e.target.value) })} style={inputSt} />
            <input type="number" placeholder="فترة التحديث (ساعات)" value={form.fetch_interval_hours ?? 6} onChange={(e) => setForm({ ...form, fetch_interval_hours: Number(e.target.value) })} style={inputSt} />
            <select
              value={form.content_types?.[0] || "benefits"}
              onChange={(e) => setForm({ ...form, content_types: [e.target.value] })}
              style={inputSt}
            >
              {TKN_CONTENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={form.publication_policy?.auto_publish} onChange={(e) => setForm({ ...form, publication_policy: { ...form.publication_policy, auto_publish: e.target.checked } })} />
              نشر تلقائي
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              نشط
            </label>
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
            <button type="button" disabled={busy} onClick={onSave} style={{ padding: "0.4rem 0.75rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>حفظ</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "0.4rem 0.75rem", cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
          </div>
        </section>
      )}

      {showOps && operations.length > 0 && (
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1rem", maxHeight: "240px", overflow: "auto" }}>
          <h4 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep }}>سجل العمليات</h4>
          {operations.slice(0, 20).map((op) => (
            <div key={op.id} style={{ fontSize: "0.75rem", padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
              <strong>{op.operation}</strong> · {op.status} · {op.items_published ?? 0} منشور · {formatDt(op.created_at)}
              {op.error_message && <span style={{ color: "#991B1B" }}> — {op.error_message}</span>}
            </div>
          ))}
        </section>
      )}

      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {sources.length === 0 && (
            <p style={{ color: C.inkSoft, fontSize: "0.875rem" }}>لا مصادر معرفية — أضف مصدرًا أو طبّق migration trusted_knowledge_network_v1.sql</p>
          )}
          {sources.map((s) => (
            <article key={s.id || s.slug} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <strong style={{ color: C.emeraldDeep }}>{s.name}</strong>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                    {s.type_label || s.source_type} · {s.category} · Trust {s.trust_score ?? 0}% · Success {s.success_rate ?? 0}%
                    {" · "}{s.active ? "نشط" : "معطّل"}
                  </p>
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{s.source_url}</a>
                  <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>
                    آخر مزامنة: {formatDt(s.last_sync_at)} · مستورد: {s.items_imported ?? 0} · منشور: {s.items_published ?? 0}
                  </p>
                  {s.last_error && <p style={{ margin: 0, fontSize: "0.75rem", color: "#991B1B" }}>{s.last_error}</p>}
                </div>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                  {s.id && (
                    <>
                      <button type="button" disabled={busy} onClick={() => toggleTknSource(s.id!, !s.active).then(load)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>
                        {s.active ? "إيقاف" : "تشغيل"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => onSync(s)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, color: C.emeraldDeep }}>
                        مزامنة
                      </button>
                      <button type="button" disabled={busy} onClick={() => { setForm(s); setShowForm(true); }} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>تعديل</button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
