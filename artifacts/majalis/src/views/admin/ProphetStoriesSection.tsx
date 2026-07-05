import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminShell } from "./AdminShell";

type Citation = { surah: string; ayahs: string; note: string };

type ProphetStory = {
  id: number;
  slug: string;
  arabic_name: string;
  citations: Citation[];
  content: string;
  is_approved: boolean;
  verified_by: string | null;
  approved_at: string | null;
  created_at: string;
};

const CSS = `
.ps-wrap { direction: rtl; font-family: inherit; }
.ps-header { margin-bottom: 1.5rem; }
.ps-title { font-size: 1.375rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem; }
.ps-subtitle { font-size: 0.8125rem; color: #64748b; margin: 0; }
.ps-stats { display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
.ps-stat { background: #f1f5f9; border-radius: 0.5rem; padding: 0.5rem 0.9rem; font-size: 0.8125rem; }
.ps-stat strong { color: #0f172a; }
.ps-stat span { color: #64748b; margin-right: 0.25rem; }
.ps-list { display: flex; flex-direction: column; gap: 1rem; }
.ps-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; overflow: hidden; }
.ps-card.approved { border-color: #bbf7d0; }
.ps-card.editing { border-color: #93c5fd; }
.ps-card-head {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1.1rem;
  cursor: pointer;
  background: #f8fafc;
  border-bottom: 1px solid transparent;
  transition: background 0.15s;
}
.ps-card.approved .ps-card-head { background: #f0fdf4; }
.ps-card.editing .ps-card-head { background: #eff6ff; cursor: default; }
.ps-card-head:hover { background: #f1f5f9; }
.ps-card.approved .ps-card-head:hover { background: #dcfce7; }
.ps-card.editing .ps-card-head:hover { background: #eff6ff; }
.ps-name { font-size: 1.05rem; font-weight: 700; color: #1e293b; flex: 1; }
.ps-badge {
  font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.55rem;
  border-radius: 9999px; letter-spacing: 0.03em;
}
.ps-badge.pending { background: rgba(14,110,82,0.08); color: #0E6E52; border: 1px solid #fde68a; }
.ps-badge.done { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.ps-badge.edit-mode { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
.ps-toggle { font-size: 0.8rem; color: #94a3b8; }
.ps-body { padding: 1.1rem 1.25rem; border-top: 1px solid #e2e8f0; }
.ps-citations-label {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #64748b; margin-bottom: 0.6rem;
}
.ps-citations { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.ps-cit {
  display: flex; align-items: flex-start; gap: 0.6rem;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 0.375rem; padding: 0.45rem 0.65rem;
  font-size: 0.8125rem;
}
.ps-cit-ref { font-weight: 700; color: #0f172a; white-space: nowrap; }
.ps-cit-note { color: #475569; }
.ps-full-toggle {
  background: none; border: 1px solid #cbd5e1; border-radius: 0.375rem;
  padding: 0.35rem 0.75rem; font-size: 0.8rem; color: #475569;
  cursor: pointer; font-family: inherit; margin-bottom: 0.75rem;
  transition: border-color 0.15s;
}
.ps-full-toggle:hover { border-color: #94a3b8; color: #1e293b; }
.ps-content {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem;
  padding: 1rem 1.1rem; font-size: 0.875rem; line-height: 1.7;
  color: #334155; white-space: pre-wrap; margin-bottom: 0.9rem;
  max-height: 400px; overflow-y: auto;
}
.ps-actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
.ps-approve-btn {
  background: #16a34a; color: #fff; border: none;
  border-radius: 0.5rem; padding: 0.5rem 1.1rem;
  font-size: 0.875rem; font-weight: 700; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.ps-approve-btn:hover:not(:disabled) { background: #15803d; }
.ps-approve-btn:disabled { background: #86efac; cursor: not-allowed; }
.ps-revoke-btn {
  background: none; color: #dc2626; border: 1px solid #fca5a5;
  border-radius: 0.5rem; padding: 0.5rem 0.9rem;
  font-size: 0.8125rem; cursor: pointer; font-family: inherit;
  transition: background 0.15s;
}
.ps-revoke-btn:hover:not(:disabled) { background: #fee2e2; }
.ps-revoke-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ps-edit-btn {
  background: none; color: #2563eb; border: 1px solid #93c5fd;
  border-radius: 0.5rem; padding: 0.5rem 0.9rem;
  font-size: 0.8125rem; cursor: pointer; font-family: inherit;
  transition: background 0.15s;
}
.ps-edit-btn:hover:not(:disabled) { background: #dbeafe; }
.ps-edit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ps-approved-info { font-size: 0.8rem; color: #16a34a; }
.ps-error { color: #dc2626; font-size: 0.8125rem; }
.ps-loading { text-align: center; padding: 3rem; color: #64748b; }
.ps-empty { text-align: center; padding: 3rem; color: #64748b; }
.ps-warning {
  background: rgba(14,110,82,0.06); border: 1px solid #fde68a; border-radius: 0.5rem;
  padding: 0.75rem 1rem; font-size: 0.8125rem; color: #78350f;
  margin-bottom: 1.25rem; line-height: 1.6;
}

/* ── Edit Form ── */
.ps-edit-form { display: flex; flex-direction: column; gap: 1.1rem; }
.ps-edit-section-label {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #64748b; margin-bottom: 0.5rem;
}
.ps-edit-cits { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
.ps-edit-cit-row {
  display: grid; grid-template-columns: 1fr 1fr 2fr auto;
  gap: 0.4rem; align-items: center;
}
.ps-edit-input {
  border: 1px solid #cbd5e1; border-radius: 0.375rem;
  padding: 0.35rem 0.55rem; font-size: 0.8125rem;
  font-family: inherit; color: #0f172a; background: #fff;
  direction: rtl; width: 100%;
}
.ps-edit-input:focus { outline: none; border-color: #3b82f6; }
.ps-edit-del-cit {
  background: none; border: 1px solid #fca5a5; border-radius: 0.375rem;
  color: #dc2626; cursor: pointer; padding: 0.3rem 0.55rem;
  font-size: 0.8rem; font-family: inherit; white-space: nowrap;
  flex-shrink: 0;
}
.ps-edit-del-cit:hover { background: #fee2e2; }
.ps-add-cit-btn {
  background: none; border: 1px dashed #93c5fd; border-radius: 0.375rem;
  color: #2563eb; cursor: pointer; padding: 0.35rem 0.75rem;
  font-size: 0.8125rem; font-family: inherit; width: 100%;
  transition: background 0.15s;
}
.ps-add-cit-btn:hover { background: #dbeafe; }
.ps-edit-textarea {
  border: 1px solid #cbd5e1; border-radius: 0.5rem;
  padding: 0.75rem 0.9rem; font-size: 0.875rem; line-height: 1.7;
  font-family: inherit; color: #0f172a; background: #fff;
  direction: rtl; resize: vertical; min-height: 320px; width: 100%;
}
.ps-edit-textarea:focus { outline: none; border-color: #3b82f6; }
.ps-edit-actions { display: flex; gap: 0.6rem; align-items: center; }
.ps-save-btn {
  background: #2563eb; color: #fff; border: none;
  border-radius: 0.5rem; padding: 0.5rem 1.2rem;
  font-size: 0.875rem; font-weight: 700; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.ps-save-btn:hover:not(:disabled) { background: #1d4ed8; }
.ps-save-btn:disabled { background: #93c5fd; cursor: not-allowed; }
.ps-cancel-btn {
  background: none; color: #64748b; border: 1px solid #cbd5e1;
  border-radius: 0.5rem; padding: 0.5rem 0.9rem;
  font-size: 0.875rem; cursor: pointer; font-family: inherit;
  transition: background 0.15s;
}
.ps-cancel-btn:hover { background: #f1f5f9; color: #1e293b; }
.ps-edit-hint { font-size: 0.75rem; color: #94a3b8; }
`;

function CitationsList({ citations }: { citations: Citation[] }) {
  const list = citations ?? [];
  return (
    <div>
      <div className="ps-citations-label">الاستشهادات القرآنية ({list.length})</div>
      <div className="ps-citations">
        {list.map((c, i) => (
          <div key={i} className="ps-cit">
            <span className="ps-cit-ref">سورة {c.surah}: {c.ayahs}</span>
            <span className="ps-cit-note">— {c.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditForm({
  story,
  onSave,
  onCancel,
}: {
  story: ProphetStory;
  onSave: (id: number, citations: Citation[], content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [citations, setCitations] = useState<Citation[]>(
    (story.citations ?? []).map((c) => ({ ...c }))
  );
  const [content, setContent] = useState(story.content);
  const [saving, setSaving] = useState(false);

  const updateCit = (i: number, field: keyof Citation, val: string) => {
    setCitations((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  };

  const removeCit = (i: number) => {
    setCitations((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addCit = () => {
    setCitations((prev) => [...prev, { surah: "", ayahs: "", note: "" }]);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(story.id, citations, content);
    setSaving(false);
  };

  return (
    <div className="ps-edit-form">
      <div>
        <div className="ps-edit-section-label">الاستشهادات القرآنية</div>
        <div className="ps-edit-cits">
          {citations.map((c, i) => (
            <div key={i} className="ps-edit-cit-row">
              <input
                className="ps-edit-input"
                placeholder="السورة"
                value={c.surah}
                onChange={(e) => updateCit(i, "surah", e.target.value)}
              />
              <input
                className="ps-edit-input"
                placeholder="الآيات (مثال: 30–33)"
                value={c.ayahs}
                onChange={(e) => updateCit(i, "ayahs", e.target.value)}
              />
              <input
                className="ps-edit-input"
                placeholder="ملاحظة"
                value={c.note}
                onChange={(e) => updateCit(i, "note", e.target.value)}
              />
              <button type="button" className="ps-edit-del-cit" onClick={() => removeCit(i)}>
                حذف
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="ps-add-cit-btn" onClick={addCit}>
          + إضافة استشهاد
        </button>
      </div>

      <div>
        <div className="ps-edit-section-label">نص القصة</div>
        <textarea
          className="ps-edit-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="ps-edit-actions">
        <button type="button" className="ps-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "جاري الحفظ…" : "💾 حفظ التعديلات"}
        </button>
        <button type="button" className="ps-cancel-btn" onClick={onCancel} disabled={saving}>
          إلغاء
        </button>
        <span className="ps-edit-hint">التعديل لا يغيّر حالة الاعتماد</span>
      </div>
    </div>
  );
}

function StoryCard({
  story,
  onApprove,
  onRevoke,
  onSave,
}: {
  story: ProphetStory;
  onApprove: (id: number) => Promise<void>;
  onRevoke: (id: number) => Promise<void>;
  onSave: (id: number, citations: Citation[], content: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleApprove = async () => { setBusy(true); await onApprove(story.id); setBusy(false); };
  const handleRevoke  = async () => { setBusy(true); await onRevoke(story.id);  setBusy(false); };

  const handleHeadClick = () => {
    if (!editing) setOpen((p) => !p);
  };

  const handleSave = async (id: number, citations: Citation[], content: string) => {
    await onSave(id, citations, content);
    setEditing(false);
  };

  return (
    <div className={`ps-card ${story.is_approved ? "approved" : ""} ${editing ? "editing" : ""}`}>
      <div className="ps-card-head" onClick={handleHeadClick}>
        <span className="ps-name">{story.arabic_name}</span>
        {editing
          ? <span className="ps-badge edit-mode">✏ تعديل</span>
          : <span className={`ps-badge ${story.is_approved ? "done" : "pending"}`}>
              {story.is_approved ? "✓ معتمد" : "⏳ ينتظر"}
            </span>
        }
        {!editing && <span className="ps-toggle">{open ? "▲" : "▼"}</span>}
      </div>

      {open && !editing && (
        <div className="ps-body">
          <CitationsList citations={story.citations} />

          <button
            type="button"
            className="ps-full-toggle"
            onClick={() => setShowFull((p) => !p)}
          >
            {showFull ? "▲ إخفاء النص الكامل" : "▼ عرض النص الكامل"}
          </button>

          {showFull && <div className="ps-content">{story.content}</div>}

          <div className="ps-actions">
            {!story.is_approved ? (
              <button type="button" className="ps-approve-btn" onClick={handleApprove} disabled={busy}>
                {busy ? "جاري الاعتماد…" : "✓ اعتماد هذه القصة"}
              </button>
            ) : (
              <>
                <span className="ps-approved-info">
                  ✓ معتمدة
                  {story.approved_at
                    ? ` — ${new Date(story.approved_at).toLocaleDateString("ar-SA")}`
                    : ""}
                </span>
                <button type="button" className="ps-revoke-btn" onClick={handleRevoke} disabled={busy}>
                  {busy ? "…" : "سحب الاعتماد"}
                </button>
              </>
            )}
            <button
              type="button"
              className="ps-edit-btn"
              onClick={() => { setShowFull(false); setEditing(true); }}
              disabled={busy}
            >
              ✏ تعديل القصة
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="ps-body">
          <EditForm
            story={story}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  );
}

export function ProphetStoriesSection() {
  const { showSuccess, showError } = useAdminShell();
  const [stories, setStories] = useState<ProphetStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("prophet_stories")
      .select("*")
      .order("id", { ascending: true });
    if (err) { setError(err.message); }
    else { setStories((data as ProphetStory[]) ?? []); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => {
    const { error: err } = await supabase
      .from("prophet_stories")
      .update({ is_approved: true, approved_at: new Date().toISOString(), verified_by: "admin" })
      .eq("id", id);
    if (err) { showError(`خطأ: ${err.message}`); return; }
    showSuccess("تم اعتماد القصة بنجاح");
    setStories((prev) =>
      prev.map((s) => s.id === id
        ? { ...s, is_approved: true, approved_at: new Date().toISOString(), verified_by: "admin" }
        : s
      )
    );
  };

  const handleRevoke = async (id: number) => {
    const { error: err } = await supabase
      .from("prophet_stories")
      .update({ is_approved: false, approved_at: null, verified_by: null })
      .eq("id", id);
    if (err) { showError(`خطأ: ${err.message}`); return; }
    showSuccess("تم سحب اعتماد القصة");
    setStories((prev) =>
      prev.map((s) => s.id === id
        ? { ...s, is_approved: false, approved_at: null, verified_by: null }
        : s
      )
    );
  };

  const handleSave = async (id: number, citations: Citation[], content: string) => {
    const { error: err } = await supabase
      .from("prophet_stories")
      .update({ citations: citations as unknown as Record<string, unknown>[], content })
      .eq("id", id);
    if (err) { showError(`خطأ في الحفظ: ${err.message}`); return; }
    showSuccess("تم حفظ التعديلات");
    setStories((prev) =>
      prev.map((s) => s.id === id ? { ...s, citations, content } : s)
    );
  };

  const approved = stories.filter((s) => s.is_approved).length;
  const pending = stories.length - approved;

  return (
    <div className="ps-wrap">
      <style>{CSS}</style>

      <div className="ps-header">
        <h2 className="ps-title">📖 قصص الأنبياء — مراجعة الاعتماد</h2>
        <p className="ps-subtitle">
          كل قصة محفوظة كمسودة (is_approved = false) ولا تظهر للمستخدمين حتى تعتمدها يدوياً
        </p>
        <div className="ps-stats">
          <div className="ps-stat"><strong>{stories.length}</strong><span>إجمالي</span></div>
          <div className="ps-stat"><strong style={{ color: "#16a34a" }}>{approved}</strong><span>معتمد</span></div>
          <div className="ps-stat"><strong style={{ color: "#d97706" }}>{pending}</strong><span>ينتظر</span></div>
        </div>
      </div>

      <div className="ps-warning">
        ⚠️ <strong>تنبيه ديني:</strong> كل قصة مصدرها «قصص الأنبياء» لابن كثير والآيات القرآنية المذكورة.
        اقرأ الاستشهادات أولاً، ثم النص الكامل إن أردت، ثم اضغط «اعتماد» إذا اقتنعت بدقّتها.
        لا تُنشر قصة واحدة تلقائياً — الاعتماد قرارك وحدك.
      </div>

      {loading && <div className="ps-loading">جاري التحميل…</div>}
      {error && <div className="ps-error">خطأ في التحميل: {error}</div>}

      {!loading && !error && stories.length === 0 && (
        <div className="ps-empty">لا توجد قصص في قاعدة البيانات</div>
      )}

      {!loading && !error && stories.length > 0 && (
        <div className="ps-list">
          {stories.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              onApprove={handleApprove}
              onRevoke={handleRevoke}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
