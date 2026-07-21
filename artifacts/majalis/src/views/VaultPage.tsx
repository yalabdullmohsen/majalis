import { useEffect, useRef, useState } from "react";
import { BookmarkCheck, BookOpen, FileText, GraduationCap, HelpCircle, Lightbulb, Lock, Pin, Scale, ScrollText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { PageHeader } from "@/components/ui-common";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import {
  getVaultData,
  addNote,
  deleteNote,
  updateNote,
  getContentTypeLabel,
  getContentTypeIcon,
  type VaultData,
  type VaultNote,
} from "@/lib/vault-service";

type Tab = "bookmarks" | "resume" | "notes";

const VAULT_ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap, BookOpen, ScrollText, Lightbulb, Scale, HelpCircle, FileText, Pin,
};
function VaultIcon({ type }: { type: string }) {
  const name = getContentTypeIcon(type);
  const I = VAULT_ICON_MAP[name] ?? FileText;
  return <I size={18} strokeWidth={1.5} />;
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────

function AddNoteModal({
  onSave,
  onClose,
}: {
  onSave: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // نُركِّز الحقل برمجيًا بدل خاصية autoFocus JSX — نفس السلوك المرغوب فعليًا
  // (نقل التركيز لداخل الحوار عند فتحه، وهو تطبيق ARIA سليم لصناديق الحوار لا
  // عطل وصول)، لكن jsx-a11y/no-autofocus يُحذِّر تحديدًا من الخاصية التصريحية
  // JSX (تخطف التركيز بلا سياق واضح للمستخدم أحيانًا)؛ .focus() البرمجي هنا
  // مقصود وواعٍ لسياق حوار مفتوح فعلاً، فلا يُخالف الفحص.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    onClose();
  };

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    <div className="vault-modal-backdrop" onClick={onClose} role="presentation">
      <div className="vault-modal" role="dialog" aria-modal="true" aria-label="إضافة ملاحظة" onClick={(e) => e.stopPropagation()}>
        <div className="vault-modal__head">
          <h3 className="vault-modal__title">إضافة ملاحظة</h3>
          <button type="button" className="vault-modal__close" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <textarea
          ref={textareaRef}
          className="vault-modal__textarea"
          aria-label="اكتب ملاحظتك هنا…" placeholder="اكتب ملاحظتك هنا…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
        />
        <div className="vault-modal__foot">
          <button type="button" className="vault-btn vault-btn--ghost" onClick={onClose}>إلغاء</button>
          <button
            type="button"
            className="vault-btn vault-btn--primary"
            onClick={handleSave}
            disabled={saving || !text.trim()}
          >
            {saving ? "…" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({
  notes,
  onAdd,
  onDelete,
  onEdit,
}: {
  notes: VaultNote[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onEdit: (note: VaultNote, newText: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // تركيز برمجي بدل autoFocus JSX (راجع نفس الشرح في AddNoteModal أعلاه) —
  // عنصر واحد فقط من هذا الـtextarea موجود في DOM في أي لحظة (الشرط الشرطي
  // أدناه يعرض واحدًا فقط لكل note.id يطابق editing)، فref مشترك واحد يكفي.
  useEffect(() => {
    if (editing) editTextareaRef.current?.focus();
  }, [editing]);

  const startEdit = (note: VaultNote) => {
    setEditing(note.id);
    setEditText(note.note_text);
  };

  const saveEdit = (note: VaultNote) => {
    if (editText.trim()) {
      onEdit(note, editText.trim());
    }
    setEditing(null);
  };

  return (
    <div className="vault-notes">
      <div className="vault-notes__toolbar">
        <button type="button" className="vault-btn vault-btn--primary" onClick={onAdd}>
          ＋ ملاحظة جديدة
        </button>
        <span className="vault-count">{notes.length} ملاحظة</span>
      </div>

      {notes.length === 0 && (
        <div className="vault-empty">
          <div className="vault-empty__icon" aria-hidden="true"><FileText size={40} strokeWidth={1.3} /></div>
          <p>لا توجد ملاحظات بعد. ابدأ بتدوين أفكارك وفوائدك.</p>
        </div>
      )}

      <div className="vault-notes__list">
        {notes.map((note) => (
          <div key={note.id} className="vault-note-card">
            {editing === note.id ? (
              <div className="vault-note-card__edit">
                <textarea
                  ref={editTextareaRef}
                  aria-label="تعديل النص"
                  className="vault-note-card__textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                />
                <div className="vault-note-card__edit-actions">
                  <button type="button" className="vault-btn vault-btn--sm vault-btn--primary" onClick={() => saveEdit(note)}>حفظ</button>
                  <button type="button" className="vault-btn vault-btn--sm vault-btn--ghost" onClick={() => setEditing(null)}>إلغاء</button>
                </div>
              </div>
            ) : (
              <>
                <p className="vault-note-card__text">{note.note_text}</p>
                <div className="vault-note-card__foot">
                  <span className="vault-note-card__date">
                    {new Date(note.updated_at).toLocaleDateString("ar-SA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <div className="vault-note-card__actions">
                    <button type="button" className="vault-note-card__action" onClick={() => startEdit(note)}>تعديل</button>
                    <button type="button" className="vault-note-card__action vault-note-card__action--danger" onClick={() => onDelete(note.id)}>حذف</button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VaultPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("bookmarks");

  useEffect(() => {
    applyPageSeo({
      path: "/vault",
      title: "خزينتي الشخصية | المجلس العلمي",
      description: "احفظ المحتوى الإسلامي المفضل، الإشارات المرجعية والملاحظات الشخصية وسجل القراءة في مكان واحد.",
      keywords: ["خزينة", "إشارات مرجعية", "حفظ المحتوى", "ملاحظات إسلامية", "مكتبة شخصية"],
      robots: "noindex, follow",
    });
  }, []);
  const [vaultData, setVaultData] = useState<VaultData>({ bookmarks: [], resume: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getVaultData(user.id)
      .then((data) => setVaultData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleAddNote = async (text: string) => {
    if (!user?.id) return;
    const note = await addNote(user.id, { note_text: text });
    if (note) setVaultData((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user?.id) return;
    await deleteNote(user.id, noteId);
    setVaultData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }));
  };

  const handleEditNote = async (note: VaultNote, newText: string) => {
    if (!user?.id) return;
    await updateNote(user.id, note.id, newText);
    setVaultData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => n.id === note.id ? { ...n, note_text: newText, updated_at: new Date().toISOString() } : n),
    }));
  };

  if (authLoading) {
    return (
      <div className="page-shell narrow" dir="rtl">
        <div className="profile-loading">
          <span className="profile-loading__dot" /><span className="profile-loading__dot" /><span className="profile-loading__dot" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="page-shell narrow vault-login-prompt" dir="rtl">
        <div className="vault-login-icon" aria-hidden="true"><Lock size={40} strokeWidth={1.3} /></div>
        <p className="vault-login-msg">
          سجّل الدخول للوصول إلى محفظتك العلمية.
        </p>
        <Link href="/login?next=/vault" className="ui-card-btn">تسجيل الدخول</Link>
      </div>
    );
  }

  const filteredBookmarks = vaultData.bookmarks.filter((b) =>
    arabicMatchAny([b.title ?? "", b.content_type], search),
  );
  const filteredResume = vaultData.resume.filter((r) =>
    arabicMatchAny([r.content_title ?? ""], search),
  );
  const filteredNotes = vaultData.notes.filter((n) =>
    arabicMatchAny([n.note_text], search),
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "bookmarks", label: "المحفوظات", count: vaultData.bookmarks.length },
    { key: "resume", label: "قيد القراءة", count: vaultData.resume.length },
    { key: "notes", label: "الملاحظات", count: vaultData.notes.length },
  ];

  return (
    <div className="page-shell narrow vault-page" dir="rtl">
      <PageHeader
        eyebrow="المعرفة"
        title="المحفظة العلمية"
        subtitle="مكان موحّد لكل ما حفظته وقرأته وسجّلته في رحلتك مع العلم."
      />

      {/* Search */}
      <div className="vault-search-wrap">
        <input
          type="text"
          className="vault-search"
          placeholder="ابحث في المحفظة…"
          aria-label="البحث في المحفظة"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          dir="rtl"
        />
        {search && (
          <button type="button" className="vault-search-clear" onClick={() => setSearch("")} aria-label="مسح البحث">✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="vault-tabs" role="tablist" aria-label="تبويبات مستودع المعرفة">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
              aria-controls={`vault-panel-${t.key}`}
            className={`vault-tab${tab === t.key ? " vault-tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="vault-tab__count">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="profile-loading vault-loading-wrap">
          <span className="profile-loading__dot" /><span className="profile-loading__dot" /><span className="profile-loading__dot" />
        </div>
      ) : (
        <>
          {/* Bookmarks Tab */}
          {tab === "bookmarks" && (
          <div role="tabpanel" id="vault-panel-bookmarks" aria-labelledby="vault-tab-bookmarks" className="vault-list">
              {filteredBookmarks.length === 0 && (
                <div className="vault-empty">
                  <div className="vault-empty__icon"><BookmarkCheck size={32} strokeWidth={1.3} /></div>
                  <p>{search ? "لا نتائج للبحث." : "لا توجد محفوظات بعد. احفظ دروساً وكتباً من صفحاتها."}</p>
                </div>
              )}
              {filteredBookmarks.map((b) => (
                <div key={b.id} className="vault-item-card">
                  <span className="vault-item-card__icon"><VaultIcon type={b.content_type} /></span>
                  <div className="vault-item-card__body">
                    <p className="vault-item-card__title">{b.title ?? b.content_id}</p>
                    <span className="vault-item-card__type">{getContentTypeLabel(b.content_type)}</span>
                  </div>
                  <span className="vault-item-card__date">
                    {new Date(b.created_at).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Resume Tab */}
          {tab === "resume" && (
          <div role="tabpanel" id="vault-panel-resume" aria-labelledby="vault-tab-resume" className="vault-list">
              {filteredResume.length === 0 && (
                <div className="vault-empty">
                  <div className="vault-empty__icon" aria-hidden="true"><BookOpen size={40} strokeWidth={1.3} /></div>
                  <p>{search ? "لا نتائج للبحث." : "لا يوجد محتوى قيد القراءة. سيُسجَّل هنا كل ما تفتحه."}</p>
                </div>
              )}
              {filteredResume.map((r) => (
                <div key={r.id} className="vault-item-card">
                  <span className="vault-item-card__icon"><VaultIcon type={r.content_type} /></span>
                  <div className="vault-item-card__body">
                    <p className="vault-item-card__title">{r.content_title ?? r.content_id}</p>
                    <span className="vault-item-card__type">{getContentTypeLabel(r.content_type)}</span>
                  </div>
                  <div className="vault-item-card__date-col">
                    <span className="vault-item-card__date">
                      {new Date(r.last_opened_at).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                    </span>
                    {r.content_url && (
                      <a href={r.content_url} className="vault-item-card__link" target="_blank" rel="noopener noreferrer">
                        فتح ←
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes Tab */}
          {tab === "notes" && (
            <div role="tabpanel" id="vault-panel-notes" aria-labelledby="vault-tab-notes">
              <NotesTab
                notes={filteredNotes}
                onAdd={() => setShowAddNote(true)}
                onDelete={handleDeleteNote}
                onEdit={handleEditNote}
              />
            </div>
          )}
        </>
      )}

      {showAddNote && (
        <AddNoteModal onSave={handleAddNote} onClose={() => setShowAddNote(false)} />
      )}

      <div className="twh-share">
        <ShareButtons title="مخزن المعرفة — المجلس العلمي" url="https://www.majlisilm.com/vault" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith"]} title="اختبر معلوماتك أثناء مراجعة مخزنك" count={4} />
      </div>
    </div>
  );
}
