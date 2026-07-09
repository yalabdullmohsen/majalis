import { useEffect, useState } from "react";
import { ClipboardList, Download, FileText, Flame, FolderOpen, Link2, Pencil, Printer, Star } from "lucide-react";
import { Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import {
  type CitationFolder,
  type SavedCitation,
  CONTENT_TYPE_COLOR,
  CONTENT_TYPE_LABEL,
  createCitationFolder,
  exportCitations,
  fetchUserCitations,
} from "@/lib/citation-service";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";

const TABS = ["الكل", "المجلدات", "المفضلة", "الأكثر استخداماً"] as const;
type Tab = (typeof TABS)[number];

const FOLDER_COLORS = [
  "#065f46", "#1d4ed8", "#7c3aed", "#1F4D3A",
  "#dc2626", "#0369a1", "#047857", "#6b7280",
];

export default function MyCitationsPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();

  useEffect(() => {
    applyPageSeo({
      path: "/my-citations",
      title: "استشهاداتي | المجلس العلمي",
      description: "مجموعة استشهاداتي ومقتطفاتي العلمية المحفوظة — نظّمها في مجلدات وشاركها مع الآخرين.",
      keywords: ["استشهادات", "مقتطفات علمية", "حفظ نصوص", "مكتبة شخصية", "أكاديمية إسلامية"],
      robots: "noindex, follow",
    });
  }, []);
  const [tab, setTab] = useState<Tab>("الكل");
  const [saved, setSaved] = useState<SavedCitation[]>([]);
  const [folders, setFolders] = useState<CitationFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const fetchData = async (opts: { folder?: string; search?: string; favorite?: boolean; sort?: "saved_at" | "usage_count" } = {}) => {
    setLoading(true);
    const r = await fetchUserCitations(opts);
    if (r.ok) {
      setSaved(r.saved || []);
      setFolders(r.folders || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchData();
  }, [isLoggedIn]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setActiveFolder(null);
    if (t === "المفضلة") fetchData({ favorite: true });
    else if (t === "الأكثر استخداماً") fetchData({ sort: "usage_count" });
    else fetchData();
  };

  const handleFolderClick = (folderId: string) => {
    setActiveFolder(folderId);
    setTab("المجلدات");
    fetchData({ folder: folderId });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length > 1) fetchData({ search: q.trim() });
    else fetchData();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const r = await createCitationFolder(newFolderName.trim(), newFolderColor);
    if (r.ok) {
      setFolders((prev) => [...prev, r.folder!]);
      setNewFolderName("");
      setShowNewFolder(false);
    }
  };

  const handleToggleFavorite = async (item: SavedCitation) => {
    const { supabase } = await import("@/lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch(`/api/user/citations`, { method: "GET" }); // placeholder
    // تحديث محلي سريع
    setSaved((prev) =>
      prev.map((s) => s.id === item.id ? { ...s, is_favorite: !s.is_favorite } : s)
    );
    // sync مع الـ DB عبر supabase مباشرة
    await supabase
      .from("user_saved_citations")
      .update({ is_favorite: !item.is_favorite })
      .eq("id", item.id);
  };

  const handleSaveNote = async (item: SavedCitation) => {
    const { supabase } = await import("@/lib/supabase");
    await supabase
      .from("user_saved_citations")
      .update({ personal_note: editNoteText })
      .eq("id", item.id);
    setSaved((prev) =>
      prev.map((s) => s.id === item.id ? { ...s, personal_note: editNoteText } : s)
    );
    setEditNoteId(null);
  };

  const handleExport = async (format: "markdown" | "pdf") => {
    setExportStatus("جاري التصدير...");
    if (format === "markdown") {
      const blob = await exportCitations("markdown");
      if (blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "citations.md";
        a.click();
        URL.revokeObjectURL(url);
        setExportStatus("تم التصدير ✓");
        setTimeout(() => setExportStatus(null), 2500);
      }
    } else {
      // PDF: إرسال الى صفحة طباعة
      window.print();
      setExportStatus(null);
    }
  };

  // فلترة محلية
  const displayed = saved.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const citText = item.citation?.quoted_text?.toLowerCase() || "";
    const noteText = item.personal_note?.toLowerCase() || "";
    const srcTitle = (item.citation?.source as { title_ar?: string })?.title_ar?.toLowerCase() || "";
    return citText.includes(q) || noteText.includes(q) || srcTitle.includes(q);
  });

  if (authLoading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center">
        <Spinner className="size-10 text-[var(--majalis-emerald)]" aria-label="جارٍ التحميل" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--majalis-ink)]">مكتبة الاقتباسات</h1>
        <p className="text-[var(--majalis-ink-soft)]">يرجى تسجيل الدخول للوصول لمكتبتك الشخصية</p>
        <Link
          href="/login"
          className="px-6 py-3 citation-btn citation-btn--primary font-medium"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)] print:bg-white">
      {/* الرأس */}
      <div className="bg-[var(--majalis-panel)] border-b border-[var(--majalis-line)] px-4 py-5 print:hidden">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[var(--majalis-ink)]"><FileText size={20} className="inline ml-1" />اقتباساتي</h1>
              <p className="text-sm text-[var(--majalis-ink-soft)] mt-0.5">
                {saved.length} اقتباس محفوظ
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* تصدير */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--majalis-line)] rounded-lg bg-[var(--majalis-panel)] text-[var(--majalis-ink-soft)] hover:border-[var(--majalis-emerald)] transition-colors"
                >
                  <Download size={13} className="inline ml-1" /> تصدير
                </button>
                <div className="absolute top-full right-0 mt-1 bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-lg shadow-xl z-50 min-w-[140px] hidden group-hover:block">
                  <button
                    type="button"
                    onClick={() => handleExport("markdown")}
                    className="block w-full text-right px-4 py-2 text-sm text-[var(--majalis-ink-soft)] hover:bg-[var(--mn-surface-hover)]"
                  >
                    <FileText size={13} strokeWidth={1.8} aria-hidden="true" /> Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    className="block w-full text-right px-4 py-2 text-sm text-[var(--majalis-ink-soft)] hover:bg-[var(--mn-surface-hover)]"
                  >
                    <Printer size={13} className="inline ml-1" /> PDF (طباعة)
                  </button>
                </div>
              </div>
              {exportStatus && (
                <span className="text-xs text-[var(--majalis-emerald)]">{exportStatus}</span>
              )}
            </div>
          </div>

          {/* بحث */}
          <div className="mt-4">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ابحث في اقتباساتك وملاحظاتك..."
              className="w-full border border-[var(--majalis-line)] rounded-xl px-4 py-2.5 text-sm text-right
                bg-[var(--majalis-parchment)] text-[var(--majalis-ink)]
                focus:ring-2 focus:ring-[var(--majalis-emerald)] outline-none"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 print:block">
        {/* الشريط الجانبي */}
        <aside className="lg:w-56 print:hidden space-y-3">
          {/* التبويبات */}
          <nav className="bg-[var(--majalis-panel)] rounded-xl border border-[var(--majalis-line)] overflow-hidden">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTabChange(t)}
                className={`w-full text-right px-4 py-3 text-sm font-medium transition-colors border-b border-[var(--majalis-line)] last:border-0 ${
                  tab === t && activeFolder === null
                    ? "bg-[var(--majalis-emerald-muted)] text-[var(--majalis-emerald)]"
                    : "text-[var(--majalis-ink-soft)] hover:bg-[var(--mn-surface-hover)]"
                }`}
              >
                {t === "الكل" && <ClipboardList size={13} strokeWidth={1.8} aria-hidden="true" />}{" "}
                {t === "المجلدات" && <FolderOpen size={13} strokeWidth={1.8} aria-hidden="true" />}{" "}
                {t === "المفضلة" && <Star size={13} strokeWidth={1.8} aria-hidden="true" />}{" "}
                {t === "الأكثر استخداماً" && <Flame size={13} strokeWidth={1.8} aria-hidden="true" />}{" "}
                {t}
              </button>
            ))}
          </nav>

          {/* المجلدات */}
          <div className="bg-[var(--majalis-panel)] rounded-xl border border-[var(--majalis-line)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--majalis-line)]">
              <span className="text-xs font-semibold text-[var(--majalis-ink-soft)] uppercase tracking-wide">
                المجلدات
              </span>
              <button
                type="button"
                onClick={() => setShowNewFolder(!showNewFolder)}
                className="text-[var(--majalis-emerald)] text-lg leading-none hover:opacity-80"
                title="مجلد جديد"
              >
                +
              </button>
            </div>

            {showNewFolder && (
              <div className="p-3 border-b border-[var(--majalis-line)] space-y-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="اسم المجلد..."
                  className="w-full border border-[var(--majalis-line)] rounded-lg px-2 py-1.5 text-xs text-right
                    bg-[var(--majalis-panel)] focus:ring-2 focus:ring-[var(--majalis-emerald)] outline-none"
                  dir="rtl"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
                />
                <div className="flex flex-wrap gap-1">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-5 h-5 rounded-full border-2 cit-color-swatch ${newFolderColor === c ? "border-[var(--majalis-ink)]" : "border-transparent"}`}
                      style={{ "--swatch-bg": c } as React.CSSProperties}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="w-full py-1.5 text-xs citation-btn citation-btn--primary"
                >
                  إنشاء
                </button>
              </div>
            )}

            {folders.length === 0 ? (
              <p className="text-xs text-[var(--majalis-ink-soft)] opacity-60 text-center py-3">لا توجد مجلدات</p>
            ) : (
              folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFolderClick(f.id)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-right transition-colors border-b border-[var(--majalis-line)] last:border-0 ${
                    activeFolder === f.id
                      ? "bg-[var(--majalis-emerald-muted)]"
                      : "hover:bg-[var(--mn-surface-hover)]"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 cit-folder-dot" style={{ "--folder-dot-bg": f.color } as React.CSSProperties} />
                  <span className="truncate text-[var(--majalis-ink-soft)]">{f.folder_name}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* قائمة الاقتباسات */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-8 text-[var(--majalis-emerald)]" aria-label="جارٍ التحميل" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl"><FileText size={40} strokeWidth={1.3} /></p>
              <p className="text-[var(--majalis-ink-soft)] text-sm">
                {searchQuery ? "لا توجد نتائج مطابقة" : "لا توجد اقتباسات محفوظة بعد"}
              </p>
              {!searchQuery && (
                <p className="text-xs text-[var(--majalis-ink-soft)] opacity-60">
                  ابدأ بالاقتباس من أي محتوى في المنصة
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((item) => {
                const cit = item.citation;
                const src = cit?.source as { title_ar?: string; content_type?: string; author_name?: string; book_name?: string } | undefined;
                const typeColor = src?.content_type
                  ? CONTENT_TYPE_COLOR[src.content_type as keyof typeof CONTENT_TYPE_COLOR] || "#065f46"
                  : "#065f46";
                const typeLabel = src?.content_type
                  ? CONTENT_TYPE_LABEL[src.content_type as keyof typeof CONTENT_TYPE_LABEL] || ""
                  : "";

                return (
                  <div
                    key={item.id}
                    className="bg-[var(--majalis-panel)] rounded-xl border border-[var(--majalis-line)] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    style={{ "--cit-type-color": typeColor } as React.CSSProperties}
                  >
                    {/* شريط ملوَّن */}
                    <div className="h-1 cit-type-bar" />

                    <div className="p-4 space-y-3">
                      {/* العنوان والنوع */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {typeLabel && (
                            <span
                              className="px-1.5 py-0.5 rounded text-xs text-white font-medium flex-shrink-0 cit-type-badge"
                            >
                              {typeLabel}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-[var(--majalis-ink)] truncate">
                            {src?.title_ar || "اقتباس"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item)}
                          className={`text-lg flex-shrink-0 transition-transform hover:scale-110 ${item.is_favorite ? "text-[var(--majalis-emerald)]" : "text-[var(--majalis-ink-soft)] opacity-40"}`}
                          title={item.is_favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                        >
                          <Star size={16} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>

                      {/* النص */}
                      <blockquote className="border-r-2 border-[var(--majalis-emerald)] pr-3">
                        <p className="text-[var(--majalis-ink)] text-sm leading-relaxed line-clamp-3">
                          {cit?.quoted_text || ""}
                        </p>
                      </blockquote>

                      {/* بيانات المصدر */}
                      {(src?.author_name || src?.book_name) && (
                        <p className="text-xs text-[var(--majalis-ink-soft)]">
                          {src.author_name}{src.author_name && src.book_name && " — "}{src.book_name}
                        </p>
                      )}

                      {/* ملاحظة شخصية */}
                      {editNoteId === item.id ? (
                        <div className="space-y-1">
                          <textarea
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            rows={2}
                            className="w-full border border-[var(--majalis-line)] rounded-lg px-3 py-1.5 text-xs text-right
                              bg-[var(--majalis-parchment)] text-[var(--majalis-ink)] focus:ring-2 focus:ring-[var(--majalis-emerald)] outline-none resize-none"
                            dir="rtl"
                          />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleSaveNote(item)} className="text-xs px-3 py-1 citation-btn citation-btn--primary">حفظ</button>
                            <button type="button" onClick={() => setEditNoteId(null)} className="text-xs px-3 py-1 border border-[var(--majalis-line)] rounded-lg text-[var(--majalis-ink-soft)]">إلغاء</button>
                          </div>
                        </div>
                      ) : item.personal_note ? (
                        <div className="flex items-start gap-1.5">
                          <span className="text-xs text-[var(--majalis-ink-soft)] opacity-60" aria-hidden="true"><FileText size={12} strokeWidth={1.8} /></span>
                          <p className="text-xs text-[var(--majalis-ink-soft)] italic">{item.personal_note}</p>
                          <button
                            type="button"
                            onClick={() => { setEditNoteId(item.id); setEditNoteText(item.personal_note || ""); }}
                            className="text-xs text-[var(--majalis-ink-soft)] opacity-60 hover:opacity-100 hover:text-[var(--majalis-emerald)] flex-shrink-0"
                          >
                            <Pencil size={12} strokeWidth={1.8} aria-hidden="true" />
                          </button>
                        </div>
                      ) : null}

                      {/* أزرار */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--majalis-line)]">
                        {cit?.deep_link_slug && (
                          <Link
                            href={`/c/${cit.deep_link_slug}`}
                            className="text-xs text-[var(--majalis-emerald)] hover:underline"
                          >
                            <Link2 size={12} className="inline ml-1" /> عرض الاقتباس
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => { setEditNoteId(item.id); setEditNoteText(item.personal_note || ""); }}
                          className="text-xs text-[var(--majalis-ink-soft)] hover:text-[var(--majalis-emerald)]"
                        >
                          {item.personal_note ? "تعديل الملاحظة" : "إضافة ملاحظة"}
                        </button>
                        <span className="text-xs text-[var(--majalis-ink-soft)] opacity-60 mr-auto">
                          استُخدم {item.usage_count} مرة
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
