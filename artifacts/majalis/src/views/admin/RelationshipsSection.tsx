import { useEffect, useState } from "react";
import {
  type KnowledgeRelationship,
  type KnowledgeRelType,
  type KnowledgeSourceType,
  getAllKnowledgeRelationshipsAdmin,
  upsertKnowledgeRelationship,
  setKnowledgeRelVerified,
  deleteKnowledgeRelationship,
} from "@/lib/supabase";
import { useAdminShell } from "./AdminShell";

const SOURCE_TYPES: { value: KnowledgeSourceType; label: string }[] = [
  { value: "scholar", label: "\u0639\u0627\u0644\u0645 / \u0634\u064a\u062e" },
  { value: "lesson",  label: "\u062f\u0631\u0633" },
  { value: "book",    label: "\u0643\u062a\u0627\u0628" },
  { value: "fatwa",   label: "\u0641\u062a\u0648\u0649" },
  { value: "fawaid",  label: "\u0641\u0627\u0626\u062f\u0629" },
  { value: "question",label: "\u0633\u0624\u0627\u0644" },
];

const REL_TYPES: { value: KnowledgeRelType; label: string }[] = [
  { value: "\u0634\u064a\u062e_\u062a\u0644\u0645\u064a\u0630",   label: "\u0634\u064a\u062e \u2192 \u062a\u0644\u0645\u064a\u0630" },
  { value: "\u0645\u0624\u0644\u0641_\u0643\u062a\u0627\u0628",   label: "\u0645\u0624\u0644\u0641 \u2192 \u0643\u062a\u0627\u0628" },
  { value: "\u0634\u0631\u062d_\u0644\u0643\u062a\u0627\u0628",   label: "\u0634\u0631\u062d \u2192 \u0643\u062a\u0627\u0628" },
  { value: "\u0641\u062a\u0648\u0649_\u0641\u064a_\u0628\u0627\u0628", label: "\u0641\u062a\u0648\u0649 \u0641\u064a \u0628\u0627\u0628 \u0641\u0642\u0647\u064a" },
  { value: "\u062f\u0631\u0633_\u0639\u0646_\u0643\u062a\u0627\u0628", label: "\u062f\u0631\u0633 \u0639\u0646 \u0643\u062a\u0627\u0628" },
  { value: "\u0645\u0631\u062a\u0628\u0637",       label: "\u0645\u0631\u062a\u0628\u0637 \u0639\u0645\u0648\u0645\u064b\u0627" },
];

const EMPTY_FORM = {
  source_type: "scholar" as KnowledgeSourceType,
  source_id: "",
  target_type: "lesson" as KnowledgeSourceType,
  target_id: "",
  relationship_type: "\u0645\u0631\u062a\u0628\u0637" as KnowledgeRelType,
  label: "",
  is_verified: false,
  source_reference: "",
};

export function RelationshipsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [rows, setRows] = useState<KnowledgeRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "pending">("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getAllKnowledgeRelationshipsAdmin();
      setRows(data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
  }

  function startEdit(r: KnowledgeRelationship) {
    setEditId(r.id);
    setForm({
      source_type: r.source_type,
      source_id: r.source_id,
      target_type: r.target_type,
      target_id: r.target_id,
      relationship_type: r.relationship_type,
      label: r.label ?? "",
      is_verified: r.is_verified,
      source_reference: r.source_reference ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    if (!form.source_id.trim() || !form.target_id.trim()) {
      showError("\u064a\u062c\u0628 \u0625\u062f\u062e\u0627\u0644 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0635\u062f\u0631 \u0648\u0627\u0644\u0647\u062f\u0641");
      return;
    }
    setSaving(true);
    const result = await upsertKnowledgeRelationship({
      source_type: form.source_type,
      source_id: form.source_id.trim(),
      target_type: form.target_type,
      target_id: form.target_id.trim(),
      relationship_type: form.relationship_type,
      label: form.label.trim() || null,
      is_verified: form.is_verified,
      source_reference: form.source_reference.trim() || null,
    });
    setSaving(false);
    if (result.ok) {
      showSuccess(editId ? "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0639\u0644\u0627\u0642\u0629" : "\u062a\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0644\u0627\u0642\u0629");
      resetForm();
      await load();
    } else {
      showError(`\u0641\u0634\u0644 \u0627\u0644\u062d\u0641\u0638: ${result.error ?? "\u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641"}`);
    }
  }

  async function handleToggleVerified(r: KnowledgeRelationship) {
    const ok = await setKnowledgeRelVerified(r.id, !r.is_verified);
    if (ok) {
      showSuccess(r.is_verified ? "\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u062d\u0642\u0642" : "\u062a\u0645 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0639\u0644\u0627\u0642\u0629");
      await load();
    } else {
      showError("\u0641\u0634\u0644 \u062a\u063a\u064a\u064a\u0631 \u062d\u0627\u0644\u0629 \u0627\u0644\u062a\u062d\u0642\u0642");
    }
  }

  async function handleDelete(r: KnowledgeRelationship) {
    if (!window.confirm(`\u062d\u0630\u0641 \u0627\u0644\u0639\u0644\u0627\u0642\u0629: ${r.source_id} \u2192 ${r.target_id}?`)) return;
    const ok = await deleteKnowledgeRelationship(r.id);
    if (ok) { showSuccess("\u062a\u0645 \u0627\u0644\u062d\u0630\u0641"); await load(); }
    else showError("\u0641\u0634\u0644 \u0627\u0644\u062d\u0630\u0641");
  }

  const filtered = rows.filter((r) => {
    if (filterVerified === "verified" && !r.is_verified) return false;
    if (filterVerified === "pending" && r.is_verified) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.source_id.toLowerCase().includes(s) ||
        r.target_id.toLowerCase().includes(s) ||
        (r.label ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const stats = {
    total: rows.length,
    verified: rows.filter((r) => r.is_verified).length,
    pending: rows.filter((r) => !r.is_verified).length,
  };

  const F = form;

  return (
    <div className="rel-page">
      <h2 className="rel-title">
        \u0627\u0644\u0631\u0633\u0645 \u0627\u0644\u0628\u064a\u0627\u0646\u064a \u0627\u0644\u0645\u0639\u0631\u0641\u064a \u2014 \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062a
      </h2>

      <div className="rel-stats-row">
        {[
          { label: "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a", value: stats.total },
          { label: "\u0645\u062d\u0642\u0642\u0629", value: stats.verified },
          { label: "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629", value: stats.pending },
        ].map((s) => (
          <div key={s.label} className="rel-stat">
            <div className="rel-stat__value">{s.value}</div>
            <div className="rel-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rel-form">
        <h3 className="rel-form-h3">
          {editId ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0639\u0644\u0627\u0642\u0629" : "\u0625\u0636\u0627\u0641\u0629 \u0639\u0644\u0627\u0642\u0629 \u062c\u062f\u064a\u062f\u0629"}
        </h3>
        <div className="rel-form-grid">
          <div className="rel-field">
            <label className="rel-label">\u0646\u0648\u0639 \u0627\u0644\u0645\u0635\u062f\u0631</label>
            <select className="rel-select" value={F.source_type}
              onChange={(e) => setForm((p) => ({ ...p, source_type: e.target.value as KnowledgeSourceType }))}>
              {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="rel-field">
            <label className="rel-label">\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0645\u0635\u062f\u0631 (ID)</label>
            <input className="rel-input" value={F.source_id} placeholder="uuid \u0623\u0648 external_key..."
              onChange={(e) => setForm((p) => ({ ...p, source_id: e.target.value }))} />
          </div>
          <div className="rel-field">
            <label className="rel-label">\u0646\u0648\u0639 \u0627\u0644\u0647\u062f\u0641</label>
            <select className="rel-select" value={F.target_type}
              onChange={(e) => setForm((p) => ({ ...p, target_type: e.target.value as KnowledgeSourceType }))}>
              {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="rel-field">
            <label className="rel-label">\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0647\u062f\u0641 (ID)</label>
            <input className="rel-input" value={F.target_id} placeholder="uuid \u0623\u0648 external_key..."
              onChange={(e) => setForm((p) => ({ ...p, target_id: e.target.value }))} />
          </div>
          <div className="rel-field">
            <label className="rel-label">\u0646\u0648\u0639 \u0627\u0644\u0639\u0644\u0627\u0642\u0629</label>
            <select className="rel-select" value={F.relationship_type}
              onChange={(e) => setForm((p) => ({ ...p, relationship_type: e.target.value as KnowledgeRelType }))}>
              {REL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="rel-field">
            <label className="rel-label">\u062a\u0633\u0645\u064a\u0629 \u0645\u062e\u062a\u0635\u0631\u0629 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)</label>
            <input className="rel-input" value={F.label} placeholder="\u0634\u0631\u062d \u0627\u0628\u0646 \u0639\u062b\u064a\u0645\u064a\u0646..."
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
          </div>
          <div className="rel-field rel-full-col">
            <label className="rel-label">\u0627\u0644\u0645\u0635\u062f\u0631 \u0648\u0627\u0644\u0645\u0631\u062c\u0639 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)</label>
            <input className="rel-input" value={F.source_reference} placeholder="\u0643\u062a\u0627\u0628 \u0627\u0644\u0633\u064a\u0631 / \u0627\u0644\u0637\u0628\u0642\u0627\u062a \u0627\u0644\u0643\u0628\u0631\u0649..."
              onChange={(e) => setForm((p) => ({ ...p, source_reference: e.target.value }))} />
          </div>
          <div className="rel-verified-row">
            <input type="checkbox" id="is_verified_chk" checked={F.is_verified}
              onChange={(e) => setForm((p) => ({ ...p, is_verified: e.target.checked }))} />
            <label htmlFor="is_verified_chk" className="rel-verified-lbl">
              \u0645\u062d\u0642\u0642\u0629 \u0648\u0645\u0639\u062a\u0645\u062f\u0629
            </label>
          </div>
        </div>
        <div className="rel-form-actions">
          <button type="button" disabled={saving} onClick={handleSave} className="rel-save-btn">
            {saving ? "\u062c\u0627\u0631\u0650 \u0627\u0644\u062d\u0641\u0638..." : editId ? "\u062a\u062d\u062f\u064a\u062b" : "\u0625\u0636\u0627\u0641\u0629"}
          </button>
          {editId && (
            <button type="button" onClick={resetForm} className="rel-cancel-btn">
              \u0625\u0644\u063a\u0627\u0621
            </button>
          )}
        </div>
      </div>

      <div className="rel-filters">
        <input className="rel-search" value={search} placeholder="\u0628\u062d\u062b \u0628\u0627\u0644\u0645\u0639\u0631\u0651\u0641 \u0623\u0648 \u0627\u0644\u062a\u0633\u0645\u064a\u0629..."
          onChange={(e) => setSearch(e.target.value)} />
        {(["all", "verified", "pending"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setFilterVerified(v)}
            className="rel-filter-btn"
            style={filterVerified === v ? { "--rel-fb-bg": "#065f46", "--rel-fb-color": "#fff" } as React.CSSProperties : undefined}>
            {v === "all" ? "\u0627\u0644\u0643\u0644" : v === "verified" ? "\u0645\u062d\u0642\u0642\u0629" : "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="rel-empty">\u062c\u0627\u0631\u0650 \u0627\u0644\u062a\u062d\u0645\u064a\u0644...</p>
      ) : filtered.length === 0 ? (
        <p className="rel-empty">
          {rows.length === 0
            ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0644\u0627\u0642\u0627\u062a \u0628\u0639\u062f \u2014 \u0623\u0636\u0641 \u0623\u0648\u0644 \u0639\u0644\u0627\u0642\u0629 \u0623\u0639\u0644\u0627\u0647."
            : "\u0644\u0627 \u0646\u062a\u0627\u0626\u062c \u0644\u0644\u0641\u0644\u062a\u0631 \u0627\u0644\u0645\u062d\u062f\u062f."}
        </p>
      ) : (
        <div className="rel-list">
          {filtered.map((r) => (
            <div key={r.id} className="rel-card">
              <div className="rel-card-body">
                <div className="rel-card-info">
                  <div className="rel-card-tags">
                    <span className="rel-source-tag">
                      {SOURCE_TYPES.find((t) => t.value === r.source_type)?.label ?? r.source_type}
                    </span>
                    <code className="rel-code">{r.source_id.slice(0, 20)}{r.source_id.length > 20 ? "\u2026" : ""}</code>
                    <span className="rel-rel-type">
                      {REL_TYPES.find((t) => t.value === r.relationship_type)?.label ?? r.relationship_type}
                    </span>
                    <span className="rel-target-tag">
                      {SOURCE_TYPES.find((t) => t.value === r.target_type)?.label ?? r.target_type}
                    </span>
                    <code className="rel-code">{r.target_id.slice(0, 20)}{r.target_id.length > 20 ? "\u2026" : ""}</code>
                  </div>
                  {r.label && <span className="rel-label-text">{r.label}</span>}
                  {r.source_reference && <span className="rel-ref-text">\u0627\u0644\u0645\u0631\u062c\u0639: {r.source_reference}</span>}
                </div>
                <div className="rel-card-actions">
                  <span
                    className="rel-verified-badge"
                    style={{
                      "--rel-vb-bg": r.is_verified ? "#d1fae5" : "#E6EDE9",
                      "--rel-vb-color": r.is_verified ? "#065f46" : "#0E6E52",
                    } as React.CSSProperties}
                  >
                    {r.is_verified ? "\u0645\u062d\u0642\u0642\u0629" : "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629"}
                  </span>
                  <button type="button" onClick={() => handleToggleVerified(r)}
                    className="rel-toggle-btn"
                    style={{ "--rel-tb-bg": r.is_verified ? "rgba(14,110,82,0.08)" : "#d1fae5" } as React.CSSProperties}>
                    {r.is_verified ? "\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062a\u062d\u0642\u0642" : "\u062a\u062d\u0642\u0642"}
                  </button>
                  <button type="button" onClick={() => startEdit(r)} className="rel-edit-btn">
                    \u062a\u0639\u062f\u064a\u0644
                  </button>
                  <button type="button" onClick={() => handleDelete(r)} className="rel-del-btn">
                    \u062d\u0630\u0641
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
