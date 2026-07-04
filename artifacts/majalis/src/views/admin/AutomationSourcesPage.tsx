import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  listTrustedLessonSources,
  runLessonAutomationMonitor,
  toggleAutoPublish,
  toggleTrustedSource,
  upsertTrustedLessonSource,
  TRUST_LEVELS,
  SOURCE_TYPES,
  type TrustedLessonSource,
} from "@/lib/lesson-automation-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";
import { InstagramManualAssistPanel } from "@/views/admin/InstagramManualAssistPanel";

const EMPTY: TrustedLessonSource = {
  name: "",
  platform: "website",
  url: "",
  source_type: "website",
  trust_level: "unknown",
  auto_publish_allowed: false,
  country: "الكويت",
  city: "العاصمة",
  category: "دروس",
  active: true,
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

function AutomationSourcesContent() {
  const { showError } = useAdminShell();
  const [sources, setSources] = useState<TrustedLessonSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<TrustedLessonSource>({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listTrustedLessonSources()
      .then((r) => setSources((r.sources as TrustedLessonSource[]) || []))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setBusy(true);
    try {
      await upsertTrustedLessonSource(form);
      setShowForm(false);
      setForm({ ...EMPTY });
      load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "تعذر حفظ المصدر.");
    } finally {
      setBusy(false);
    }
  };

  const onRunMonitor = async (sourceId?: string) => {
    setBusy(true);
    try {
      await runLessonAutomationMonitor({ sourceId });
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>مصادر المحتوى — أضف وانسَ</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            أضف مصدرًا واحدًا (إنستغرام، موقع، RSS، تيليجرام، يوتيوب، X…) — النظام يتابعه كل 15 دقيقة ويستخرج وينشر تلقائيًا.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8125rem", flexWrap: "wrap" }}>
          <Link href="/admin/integrations/instagram" style={{ color: C.emeraldDeep }}>Instagram API</Link>
          <Link href="/admin/automation/center" style={{ color: C.emeraldDeep }}>Automation Center</Link>
          <Link href="/admin/automation/dashboard" style={{ color: C.emeraldDeep }}>لوحة المراقبة</Link>
          <Link href="/admin/review-center" style={{ color: C.emeraldDeep }}>مركز المراجعة</Link>
          <Link href="/admin" style={{ color: C.emeraldDeep }}>← لوحة الإدارة</Link>
        </div>
      </div>

      <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.8125rem", color: "#065F46" }}>
        <strong>Phase 5:</strong> بعد الحفظ يُنشأ Job تلقائي (كل 15 دقيقة) — Vision AI + Matching + SEO بدون build جديد.
        {" "}
        <strong>Instagram:</strong> يتطلب Graph API للجلب الكامل؛ بدونه تُنشأ مسودات للمراجعة.
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button type="button" disabled={busy} onClick={() => { setForm({ ...EMPTY }); setShowForm(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
          + إضافة مصدر
        </button>
        <button type="button" disabled={busy} onClick={() => onRunMonitor()} style={{ padding: "0.5rem 1rem", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          فحص الآن (كل المصادر)
        </button>
      </div>

      {showForm && (
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem", marginBottom: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep }}>{form.id ? "تعديل مصدر" : "مصدر جديد"}</h3>
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <input placeholder="اسم المصدر" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputSt} />
            <input placeholder="الرابط" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} style={inputSt} dir="ltr" />
            <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value, platform: e.target.value })} style={inputSt}>
              {SOURCE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input placeholder="الدولة" value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputSt} />
            <input placeholder="المدينة" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputSt} />
            <select value={form.trust_level} onChange={(e) => setForm({ ...form, trust_level: e.target.value })} style={inputSt}>
              {TRUST_LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input placeholder="feed URL (RSS)" value={form.feed_url || ""} onChange={(e) => setForm({ ...form, feed_url: e.target.value })} style={inputSt} dir="ltr" />
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={form.auto_publish_allowed} onChange={(e) => setForm({ ...form, auto_publish_allowed: e.target.checked })} />
              Auto-Publish
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              نشط
            </label>
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
            <button type="button" disabled={busy} onClick={onSave} style={{ padding: "0.4rem 0.75rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>حفظ</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "0.4rem 0.75rem", cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
          </div>
        </section>
      )}

      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {sources.map((s) => (
            <article key={s.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <strong style={{ color: C.emeraldDeep }}>{s.name}</strong>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                    {(s as TrustedLessonSource & { config?: { source_subtype?: string; handle?: string } }).config?.handle || s.source_type}
                    {" · "}
                    {(s as TrustedLessonSource & { config?: { source_subtype?: string } }).config?.source_subtype || s.category}
                    {" · "}
                    {s.trust_level} · {s.active ? "نشط" : "معطّل"}
                    {s.auto_publish_allowed ? " · Auto-Publish ✓" : ""}
                  </p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{s.url}</a>
                  <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>
                    آخر فحص: {formatDt(s.last_checked_at)} · نجاح: {formatDt(s.last_success_at)} · أخطاء: {s.failure_count ?? 0}
                  </p>
                  {s.last_error && <p style={{ margin: 0, fontSize: "0.75rem", color: "#991B1B" }}>{s.last_error}</p>}
                  <InstagramManualAssistPanel source={s} onDone={load} />
                </div>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                  <button type="button" disabled={busy} onClick={() => toggleTrustedSource(s.id!, !s.active).then(load).catch(() => showError("تعذر تحديث حالة المصدر."))} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>
                    {s.active ? "تعطيل" : "تفعيل"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => toggleAutoPublish(s.id!).then(load).catch(() => showError("تعذر تحديث النشر التلقائي."))} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>
                    Auto-Publish
                  </button>
                  <button type="button" disabled={busy} onClick={() => { setForm(s); setShowForm(true); }} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit" }}>تعديل</button>
                  <button type="button" disabled={busy} onClick={() => onRunMonitor(s.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, color: C.emeraldDeep }}>
                    فحص الآن
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AutomationSourcesPage() {
  return (
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <AutomationSourcesContent />
    </AdminShell>
  );
}

export { AutomationSourcesContent };
