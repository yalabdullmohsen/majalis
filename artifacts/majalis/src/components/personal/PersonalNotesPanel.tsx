import { useEffect, useState } from "react";
import {
  fetchContentNote,
  saveContentNote,
  deleteContentNote,
  type ContentNote,
} from "@/lib/personal-learning";

type Props = {
  contentType: string;
  contentId: string;
  contentTitle?: string;
  compact?: boolean;
};

export function PersonalNotesPanel({ contentType, contentId, contentTitle, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<ContentNote | null>(null);
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [highlight, setHighlight] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchContentNote(contentType, contentId).then((n) => {
      if (n) {
        setNote(n);
        setBody(n.body);
        setTags((n.tags || []).join("، "));
        setHighlights(n.highlights || []);
        setPinned(n.is_pinned);
      }
    });
  }, [open, contentType, contentId]);

  const addHighlight = () => {
    const h = highlight.trim();
    if (!h || highlights.includes(h)) return;
    setHighlights([...highlights, h]);
    setHighlight("");
  };

  const save = async () => {
    setSaving(true);
    const saved = await saveContentNote({
      content_type: contentType,
      content_id: contentId,
      title: contentTitle,
      body,
      tags: tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
      highlights,
      is_pinned: pinned,
    });
    setSaving(false);
    if (saved) {
      setNote(saved);
      setOpen(false);
    } else {
      alert("يرجى تسجيل الدخول أولاً");
    }
  };

  const remove = async () => {
    if (!note?.id || !confirm("حذف هذه الملاحظة؟")) return;
    await deleteContentNote(note.id);
    setNote(null);
    setBody("");
    setHighlights([]);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`ds-btn ds-btn--ghost ds-btn--sm personal-notes-trigger${note ? " personal-notes-trigger--has" : ""}`}
        onClick={() => setOpen(true)}
      >
        {compact ? "ملاحظات" : "ملاحظاتي"}
      </button>

      {open && (
        <div className="personal-notes-overlay" role="dialog" aria-label="ملاحظاتي">
          <div className="personal-notes-drawer">
            <div className="personal-notes-header">
              <h3>ملاحظاتي — {contentTitle || "محتوى"}</h3>
              <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => setOpen(false)}>إغلاق</button>
            </div>
            <textarea
              className="ds-input personal-notes-body"
              rows={6}
              placeholder="اكتب ملاحظاتك الخاصة..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="personal-notes-row">
              <input
                className="ds-input"
                placeholder="وسوم (افصل بفاصلة)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="personal-notes-row">
              <input
                className="ds-input"
                placeholder="تمييز نص..."
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
              />
              <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={addHighlight}>إضافة</button>
            </div>
            {highlights.length > 0 && (
              <ul className="personal-notes-highlights">
                {highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            <label className="personal-notes-pin">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              تثبيت الملاحظة
            </label>
            <div className="personal-notes-actions">
              {note?.id && (
                <button type="button" className="ds-btn ds-btn--ghost" onClick={remove}>حذف</button>
              )}
              <button type="button" className="ds-btn ds-btn--primary" onClick={save} disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
