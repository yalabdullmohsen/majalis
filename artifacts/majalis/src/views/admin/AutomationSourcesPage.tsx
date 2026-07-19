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
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";
import { InstagramManualAssistPanel } from "@/views/admin/InstagramManualAssistPanel";

const EMPTY: TrustedLessonSource = {
  name: "",
  platform: "website",
  url: "",
  source_type: "website",
  trust_level: "unknown",
  auto_publish_allowed: false,
  country: "\u0627\u0644\u0643\u0648\u064a\u062a",
  city: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629",
  category: "\u062f\u0631\u0648\u0633",
  active: true,
};

function formatDt(iso?: string) {
  if (!iso) return "\u2014";
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
      showError(e instanceof Error ? e.message : "\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u0645\u0635\u062f\u0631.");
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
      <div className="asp-header">
        <div>
          <h2 className="asp-title">\u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u2014 \u0623\u0636\u0641 \u0648\u0627\u0646\u0633\u064e</h2>
          <p className="asp-subtitle">
            \u0623\u0636\u0641 \u0645\u0635\u062f\u0631\u064b\u0627 \u0648\u0627\u062d\u062f\u064b\u0627 (\u0625\u0646\u0633\u062a\u063a\u0631\u0627\u0645\u060c \u0645\u0648\u0642\u0639\u060c RSS\u060c \u062a\u064a\u0644\u064a\u062c\u0631\u0627\u0645\u060c \u064a\u0648\u062a\u064a\u0648\u0628\u060c X\u2026) \u2014 \u0627\u0644\u0646\u0638\u0627\u0645 \u064a\u062a\u0627\u0628\u0639\u0647 \u0643\u0644 15 \u062f\u0642\u064a\u0642\u0629 \u0648\u064a\u0633\u062a\u062e\u0631\u062c \u0648\u064a\u0646\u0634\u0631 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627.
          </p>
        </div>
        <div className="asp-links">
          <Link href="/admin/integrations/instagram" className="asp-link">Instagram API</Link>
          <Link href="/admin/automation/center" className="asp-link">Automation Center</Link>
          <Link href="/admin/automation/dashboard" className="asp-link">\u0644\u0648\u062d\u0629 \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629</Link>
          <Link href="/admin/review-center" className="asp-link">\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629</Link>
          <Link href="/admin" className="asp-link">\u2190 \u0644\u0648\u062d\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u0629</Link>
        </div>
      </div>

      <div className="asp-notice">
        <strong>Phase 5:</strong> \u0628\u0639\u062f \u0627\u0644\u062d\u0641\u0638 \u064a\u064f\u0646\u0634\u0623 Job \u062a\u0644\u0642\u0627\u0626\u064a (\u0643\u0644 15 \u062f\u0642\u064a\u0642\u0629) \u2014 Vision AI + Matching + SEO \u0628\u062f\u0648\u0646 build \u062c\u062f\u064a\u062f.{" "}
        <strong>Instagram:</strong> \u064a\u062a\u0637\u0644\u0628 Graph API \u0644\u0644\u062c\u0644\u0628 \u0627\u0644\u0643\u0627\u0645\u0644\u061b \u0628\u062f\u0648\u0646\u0647 \u062a\u064f\u0646\u0634\u0623 \u0645\u0633\u0648\u062f\u0627\u062a \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629.
      </div>

      <div className="asp-actions">
        <button type="button" disabled={busy} onClick={() => { setForm({ ...EMPTY }); setShowForm(true); }} className="asp-add-btn">
          + \u0625\u0636\u0627\u0641\u0629 \u0645\u0635\u062f\u0631
        </button>
        <button type="button" disabled={busy} onClick={() => onRunMonitor()} className="asp-run-btn">
          \u0641\u062d\u0635 \u0627\u0644\u0622\u0646 (\u0643\u0644 \u0627\u0644\u0645\u0635\u0627\u062f\u0631)
        </button>
      </div>

      {showForm && (
        <section className="asp-form">
          <h3 className="asp-form-h3">{form.id ? "\u062a\u0639\u062f\u064a\u0644 \u0645\u0635\u062f\u0631" : "\u0645\u0635\u062f\u0631 \u062c\u062f\u064a\u062f"}</h3>
          <div className="asp-form-grid">
            <input placeholder="\u0627\u0633\u0645 \u0627\u0644\u0645\u0635\u062f\u0631" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="adm-input" />
            <input placeholder="\u0627\u0644\u0631\u0627\u0628\u0637" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="adm-input" dir="ltr" />
            <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value, platform: e.target.value })} className="adm-input">
              {SOURCE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input placeholder="\u0627\u0644\u062f\u0648\u0644\u0629" value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} className="adm-input" />
            <input placeholder="\u0627\u0644\u0645\u062f\u064a\u0646\u0629" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="adm-input" />
            <select value={form.trust_level} onChange={(e) => setForm({ ...form, trust_level: e.target.value })} className="adm-input">
              {TRUST_LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input placeholder="feed URL (RSS)" value={form.feed_url || ""} onChange={(e) => setForm({ ...form, feed_url: e.target.value })} className="adm-input" dir="ltr" />
            <label className="asp-checkbox-label">
              <input type="checkbox" checked={form.auto_publish_allowed} onChange={(e) => setForm({ ...form, auto_publish_allowed: e.target.checked })} />
              Auto-Publish
            </label>
            <label className="asp-checkbox-label">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              \u0646\u0634\u0637
            </label>
          </div>
          <div className="asp-form-actions">
            <button type="button" disabled={busy} onClick={onSave} className="asp-save-btn">\u062d\u0641\u0638</button>
            <button type="button" onClick={() => setShowForm(false)} className="asp-cancel-btn">\u0625\u0644\u063a\u0627\u0621</button>
          </div>
        </section>
      )}

      {loading ? <SkeletonCardGrid count={6} /> : (
        <div className="asp-list">
          {sources.map((s) => (
            <article key={s.id} className="asp-card">
              <div className="asp-card-body">
                <div>
                  <strong className="asp-card-name">{s.name}</strong>
                  <p className="asp-card-meta">
                    {(s as TrustedLessonSource & { config?: { source_subtype?: string; handle?: string } }).config?.handle || s.source_type}
                    {" \u00b7 "}
                    {(s as TrustedLessonSource & { config?: { source_subtype?: string } }).config?.source_subtype || s.category}
                    {" \u00b7 "}
                    {s.trust_level} \u00b7 {s.active ? "\u0646\u0634\u0637" : "\u0645\u0639\u0637\u0651\u0644"}
                    {s.auto_publish_allowed ? " \u00b7 Auto-Publish \u2713" : ""}
                  </p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="asp-card-url">{s.url}</a>
                  <p className="asp-card-dates">
                    \u0622\u062e\u0631 \u0641\u062d\u0635: {formatDt(s.last_checked_at)} \u00b7 \u0646\u062c\u0627\u062d: {formatDt(s.last_success_at)} \u00b7 \u0623\u062e\u0637\u0627\u0621: {s.failure_count ?? 0}
                  </p>
                  {s.last_error && <p className="asp-card-error">{s.last_error}</p>}
                  {Boolean(s.content_types_allowed?.length) && (
                    <p className="asp-card-meta">
                      أنواع مسموحة: {(s.content_types_allowed || []).join("، ")}
                      {s.default_attribution_name ? ` · ينسب لـ: ${s.default_attribution_name}` : ""}
                      {s.default_organization_name ? ` · الجهة: ${s.default_organization_name}` : ""}
                    </p>
                  )}
                  <InstagramManualAssistPanel source={s} onDone={load} />
                </div>
                <div className="asp-card-actions">
                  <button type="button" disabled={busy} onClick={() => toggleTrustedSource(s.id!, !s.active).then(load).catch(() => showError("\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0645\u0635\u062f\u0631."))} className="asp-small-btn">
                    {s.active ? "\u062a\u0639\u0637\u064a\u0644" : "\u062a\u0641\u0639\u064a\u0644"}
                  </button>
                  <button type="button" disabled={busy} onClick={() => toggleAutoPublish(s.id!).then(load).catch(() => showError("\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0646\u0634\u0631 \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a."))} className="asp-small-btn">
                    Auto-Publish
                  </button>
                  <button type="button" disabled={busy} onClick={() => { setForm(s); setShowForm(true); }} className="asp-small-btn">\u062a\u0639\u062f\u064a\u0644</button>
                  <button type="button" disabled={busy} onClick={() => onRunMonitor(s.id)} className="asp-small-btn asp-small-btn--accent">
                    \u0641\u062d\u0635 \u0627\u0644\u0622\u0646
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
