import { useEffect, useRef, useState } from "react";
import { BookmarkCheck, BookOpen, FileText, GraduationCap, HelpCircle, Lightbulb, Lock, Pin, Scale, ScrollText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { PageHeader, PageStatusShell } from "@/components/ui-common";
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
import {
  listLocalBookmarks,
  removeLocalBookmark,
  type LocalBookmark,
} from "@/lib/local-bookmarks";
import {
  getAllReadingProgress,
  type ReadingSection,
} from "@/lib/reading-progress";
import {
  listOfflineReading,
  removeOfflineReading,
  type OfflineReadingItem,
} from "@/lib/offline-reading-pack";
import "@/styles/pages/vault.css";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";

const SECTION_HREF: Record<ReadingSection, string> = {
  adhkar: "/adhkar",
  qa: "/qa",
  fawaid: "/fawaid",
  hadith: "/hadith",
  rulings: "/rulings",
  stories: "/islamic-stories",
  assistant: "/assistant",
};

const SECTION_LABEL: Record<ReadingSection, string> = {
  adhkar: "الأذكار",
  qa: "الأسئلة والأجوبة",
  fawaid: "الفوائد",
  hadith: "الحديث",
  rulings: "الأحكام",
  stories: "القصص",
  assistant: "المساعد",
};

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
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
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

/** محفظة محلية للزائر: محفوظات الجهاز + استئناف القراءة بدون حساب. */
function GuestVault() {
  const [tab, setTab] = useState<"bookmarks" | "resume" | "offline">("bookmarks");
  const [bookmarks, setBookmarks] = useState<LocalBookmark[]>(() => listLocalBookmarks());
  const [offline, setOffline] = useState<OfflineReadingItem[]>(() => listOfflineReading());
  const [openOfflineId, setOpenOfflineId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const progressStore = getAllReadingProgress();
  const resume = (Object.keys(progressStore) as ReadingSection[])
    .map((section) => {
      const entry = progressStore[section];
      return entry ? { section, ...entry } : null;
    })
    .filter((row): row is { section: ReadingSection; id: string; title?: string; at: string; scrollY?: number } => Boolean(row));

  const filteredBookmarks = bookmarks.filter((b) =>
    arabicMatchAny([b.title, b.contentType], search),
  );
  const filteredResume = resume.filter((r) =>
    arabicMatchAny([r.title ?? "", SECTION_LABEL[r.section]], search),
  );
  const filteredOffline = offline.filter((o) =>
    arabicMatchAny([o.title, o.text.slice(0, 200)], search),
  );

  const removeBookmark = (b: LocalBookmark) => {
    removeLocalBookmark(b.contentType, b.contentId);
    setBookmarks(listLocalBookmarks());
  };

  const removeOffline = (id: string) => {
    removeOfflineReading(id);
    setOffline(listOfflineReading());
    if (openOfflineId === id) setOpenOfflineId(null);
  };

  return (
    <div className="page-shell narrow vault-page" dir="rtl">
      <PageHeader
        eyebrow="على هذا الجهاز"
        title="المحفظة العلمية"
        subtitle="محفوظاتك وموضع قراءتك محفوظان محليًا. سجّل الدخول للمزامنة بين الأجهزة."
      />

      <div className="vault-login-prompt vault-login-prompt--inline">
        <Lock size={18} strokeWidth={1.5} aria-hidden="true" />
        <p className="vault-login-msg">للمزامنة السحابية والملاحظات المشتركة:</p>
        <Link href="/login?next=/vault" className="ui-card-btn">تسجيل الدخول</Link>
      </div>

      <div className="vault-search-wrap">
        <input
          type="text"
          className="vault-search"
          placeholder="ابحث في المحفوظات…"
          aria-label="البحث في المحفظة المحلية"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          dir="rtl"
        />
      </div>

      <div className="vault-tabs" role="tablist" aria-label="تبويبات المحفظة المحلية">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "bookmarks"}
          className={`vault-tab${tab === "bookmarks" ? " vault-tab--active" : ""}`}
          onClick={() => setTab("bookmarks")}
        >
          المحفوظات
          <span className="vault-tab__count">{bookmarks.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "resume"}
          className={`vault-tab${tab === "resume" ? " vault-tab--active" : ""}`}
          onClick={() => setTab("resume")}
        >
          قيد القراءة
          <span className="vault-tab__count">{resume.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "offline"}
          className={`vault-tab${tab === "offline" ? " vault-tab--active" : ""}`}
          onClick={() => setTab("offline")}
        >
          قراءة لاحقًا
          <span className="vault-tab__count">{offline.length}</span>
        </button>
      </div>

      {tab === "bookmarks" && (
        <div role="tabpanel" className="vault-list">
          {filteredBookmarks.length === 0 && (
            <div className="vault-empty">
              <div className="vault-empty__icon"><BookmarkCheck size={32} strokeWidth={1.3} /></div>
              <p>{search ? "لا نتائج للبحث." : "لا توجد محفوظات بعد. استخدم زر «حفظ» على أي محتوى."}</p>
            </div>
          )}
          {filteredBookmarks.map((b) => (
            <div key={b.id} className="vault-item-card">
              <span className="vault-item-card__icon"><VaultIcon type={b.contentType} /></span>
              <div className="vault-item-card__body">
                <Link href={b.href} className="vault-item-card__title">
                  {b.title}
                </Link>
                <span className="vault-item-card__type">{getContentTypeLabel(b.contentType)} · محلي</span>
              </div>
              <div className="vault-item-card__date-col">
                <span className="vault-item-card__date">
                  {new Date(b.savedAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                </span>
                <button type="button" className="vault-item-card__link" onClick={() => removeBookmark(b)}>
                  إزالة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "resume" && (
        <div role="tabpanel" className="vault-list">
          {filteredResume.length === 0 && (
            <div className="vault-empty">
              <div className="vault-empty__icon" aria-hidden="true"><BookOpen size={40} strokeWidth={1.3} /></div>
              <p>{search ? "لا نتائج للبحث." : "ابدأ القراءة في الحديث أو الأذكار أو الفوائد ليُحفظ موضعك هنا."}</p>
            </div>
          )}
          {filteredResume.map((r) => (
            <div key={r.section} className="vault-item-card">
              <span className="vault-item-card__icon"><VaultIcon type={r.section} /></span>
              <div className="vault-item-card__body">
                <p className="vault-item-card__title">{r.title || SECTION_LABEL[r.section]}</p>
                <span className="vault-item-card__type">{SECTION_LABEL[r.section]}</span>
              </div>
              <div className="vault-item-card__date-col">
                <span className="vault-item-card__date">
                  {new Date(r.at).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                </span>
                <Link href={SECTION_HREF[r.section]} className="vault-item-card__link">
                  متابعة ←
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "offline" && (
        <div role="tabpanel" className="vault-list">
          {filteredOffline.length === 0 && (
            <div className="vault-empty">
              <div className="vault-empty__icon" aria-hidden="true"><FileText size={40} strokeWidth={1.3} /></div>
              <p>{search ? "لا نتائج للبحث." : "استخدم «قراءة لاحقًا» من شريط إجراءات المحتوى لحفظ النص على الجهاز."}</p>
            </div>
          )}
          {filteredOffline.map((o) => (
            <article key={o.id} className="vault-item-card vault-item-card--offline">
              <span className="vault-item-card__icon"><VaultIcon type={o.contentType || "article"} /></span>
              <div className="vault-item-card__body">
                <button
                  type="button"
                  className="vault-item-card__title"
                  onClick={() => setOpenOfflineId((id) => (id === o.id ? null : o.id))}
                >
                  {o.title}
                </button>
                <span className="vault-item-card__type">نص محفوظ على الجهاز</span>
                {openOfflineId === o.id && (
                  <p className="vault-offline-text" dir="rtl">{o.text}</p>
                )}
              </div>
              <div className="vault-item-card__date-col">
                <span className="vault-item-card__date">
                  {new Date(o.savedAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
                </span>
                <button type="button" className="vault-item-card__link" onClick={() => removeOffline(o.id)}>
                  إزالة
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
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
      <PageStatusShell title="المحفظة العلمية">
        <div className="profile-loading" aria-busy="true">
          <span className="profile-loading__dot" /><span className="profile-loading__dot" /><span className="profile-loading__dot" />
        </div>
      </PageStatusShell>
    );
  }

  if (!isLoggedIn) {
    return <GuestVault />;
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
      <RelatedKnowledge kind="fawaid" query="محفظة المحفوظات" title="مواد ذات صلة" limit={6} />
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith"]} title="اختبر معلوماتك أثناء مراجعة مخزنك" count={4} />
      </div>
    </div>
  );
}
