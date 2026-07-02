import { useEffect, useState } from "react";
import { Link } from "wouter";
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

const TABS = ["الكل", "المجلدات", "المفضلة", "الأكثر استخداماً"] as const;
type Tab = (typeof TABS)[number];

const FOLDER_COLORS = [
  "#065f46", "#1d4ed8", "#7c3aed", "#b45309",
  "#dc2626", "#0369a1", "#047857", "#6b7280",
];

export default function MyCitationsPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
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
        <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">مكتبة الاقتباسات</h1>
        <p className="text-gray-600 dark:text-gray-400">يرجى تسجيل الدخول للوصول لمكتبتك الشخصية</p>
        <Link
          href="/login"
          className="px-6 py-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 font-medium"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-950 print:bg-white">
      {/* الرأس */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-5 print:hidden">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">📑 اقتباساتي</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {saved.length} اقتباس محفوظ
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* تصدير */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-emerald-500 transition-colors"
                >
                  ⬇️ تصدير
                </button>
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 min-w-[140px] hidden group-hover:block">
                  <button
                    type="button"
                    onClick={() => handleExport("markdown")}
                    className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    📝 Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    🖨️ PDF (طباعة)
                  </button>
                </div>
              </div>
              {exportStatus && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400">{exportStatus}</span>
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
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-right
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                focus:ring-2 focus:ring-emerald-500 outline-none"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 print:block">
        {/* الشريط الجانبي */}
        <aside className="lg:w-56 print:hidden space-y-3">
          {/* التبويبات */}
          <nav className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTabChange(t)}
                className={`w-full text-right px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                  tab === t && activeFolder === null
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {t === "الكل" && "📋 "}
                {t === "المجلدات" && "📁 "}
                {t === "المفضلة" && "⭐ "}
                {t === "الأكثر استخداماً" && "🔥 "}
                {t}
              </button>
            ))}
          </nav>

          {/* المجلدات */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                المجلدات
              </span>
              <button
                type="button"
                onClick={() => setShowNewFolder(!showNewFolder)}
                className="text-emerald-600 text-lg leading-none hover:text-emerald-800"
                title="مجلد جديد"
              >
                +
              </button>
            </div>

            {showNewFolder && (
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 space-y-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="اسم المجلد..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs text-right
                    bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  dir="rtl"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
                />
                <div className="flex flex-wrap gap-1">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-5 h-5 rounded-full border-2 ${newFolderColor === c ? "border-gray-800 dark:border-white" : "border-transparent"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="w-full py-1.5 text-xs bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
                >
                  إنشاء
                </button>
              </div>
            )}

            {folders.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">لا توجد مجلدات</p>
            ) : (
              folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFolderClick(f.id)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-right transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 ${
                    activeFolder === f.id
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: f.color }} />
                  <span className="truncate text-gray-700 dark:text-gray-300">{f.folder_name}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* قائمة الاقتباسات */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">📑</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {searchQuery ? "لا توجد نتائج مطابقة" : "لا توجد اقتباسات محفوظة بعد"}
              </p>
              {!searchQuery && (
                <p className="text-xs text-gray-400">
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
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* شريط ملوَّن */}
                    <div className="h-1" style={{ background: typeColor }} />

                    <div className="p-4 space-y-3">
                      {/* العنوان والنوع */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {typeLabel && (
                            <span
                              className="px-1.5 py-0.5 rounded text-xs text-white font-medium flex-shrink-0"
                              style={{ background: typeColor }}
                            >
                              {typeLabel}
                            </span>
                          )}
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {src?.title_ar || "اقتباس"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item)}
                          className={`text-lg flex-shrink-0 transition-transform hover:scale-110 ${item.is_favorite ? "text-amber-400" : "text-gray-300"}`}
                          title={item.is_favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                        >
                          ⭐
                        </button>
                      </div>

                      {/* النص */}
                      <blockquote className="border-r-2 border-emerald-500 pr-3">
                        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed line-clamp-3">
                          {cit?.quoted_text || ""}
                        </p>
                      </blockquote>

                      {/* بيانات المصدر */}
                      {(src?.author_name || src?.book_name) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs text-right
                              bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            dir="rtl"
                          />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleSaveNote(item)} className="text-xs px-3 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800">حفظ</button>
                            <button type="button" onClick={() => setEditNoteId(null)} className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300">إلغاء</button>
                          </div>
                        </div>
                      ) : item.personal_note ? (
                        <div className="flex items-start gap-1.5">
                          <span className="text-xs text-gray-400">📝</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic">{item.personal_note}</p>
                          <button
                            type="button"
                            onClick={() => { setEditNoteId(item.id); setEditNoteText(item.personal_note || ""); }}
                            className="text-xs text-gray-400 hover:text-emerald-600 flex-shrink-0"
                          >
                            ✏️
                          </button>
                        </div>
                      ) : null}

                      {/* أزرار */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                        {cit?.deep_link_slug && (
                          <Link
                            href={`/c/${cit.deep_link_slug}`}
                            className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            🔗 عرض الاقتباس
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => { setEditNoteId(item.id); setEditNoteText(item.personal_note || ""); }}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400"
                        >
                          {item.personal_note ? "تعديل الملاحظة" : "إضافة ملاحظة"}
                        </button>
                        <span className="text-xs text-gray-400 mr-auto">
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
