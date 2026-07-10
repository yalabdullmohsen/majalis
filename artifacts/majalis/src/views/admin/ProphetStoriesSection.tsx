import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminShell } from "./AdminShell";
import { AlertTriangle, BookOpen, Save } from "lucide-react";

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
          {saving ? "جاري الحفظ…" : <><Save size={13} className="inline ml-1" aria-hidden="true" /> حفظ التعديلات</>}
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
      <div
        className="ps-card-head"
        onClick={handleHeadClick}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`${open ? "طي" : "توسيع"} ${story.arabic_name}`}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleHeadClick()}
      >
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
                    ? `، ${new Date(story.approved_at).toLocaleDateString("ar-SA")}`
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

      <div className="ps-header">
        <h2 className="ps-title flex items-center gap-2"><BookOpen size={18} strokeWidth={1.6} aria-hidden="true" /> قصص الأنبياء، مراجعة الاعتماد</h2>
        <p className="ps-subtitle">
          كل قصة محفوظة كمسودة (is_approved = false) ولا تظهر للمستخدمين حتى تعتمدها يدوياً
        </p>
        <div className="ps-stats">
          <div className="ps-stat"><strong>{stories.length}</strong><span>إجمالي</span></div>
          <div className="ps-stat"><strong className="text-approved">{approved}</strong><span>معتمد</span></div>
          <div className="ps-stat"><strong className="text-forest">{pending}</strong><span>ينتظر</span></div>
        </div>
      </div>

      <div className="ps-warning">
        <AlertTriangle size={13} className="inline ml-1" aria-hidden="true" /> <strong>تنبيه ديني:</strong> كل قصة مصدرها «قصص الأنبياء» لابن كثير والآيات القرآنية المذكورة.
        اقرأ الاستشهادات أولاً، ثم النص الكامل إن أردت، ثم اضغط «اعتماد» إذا اقتنعت بدقّتها.
        لا تُنشر قصة واحدة تلقائياً، الاعتماد قرارك وحدك.
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
