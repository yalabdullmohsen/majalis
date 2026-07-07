import { useState, useRef, useEffect, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ResearchAnswer } from "@/components/rag/ResearchAnswer";
import {
  searchRAG,
  saveResearch,
  fetchResearchLibrary,
  deleteResearch,
  QUICK_PROMPTS,
  type RAGResult,
  type SavedResearch,
} from "@/lib/rag-service";
import { useAuth } from "@/components/AuthProvider";

type View = "search" | "library";

export default function ScholarlyResearchPage() {
  const { isLoggedIn } = useAuth();
  const [view, setView] = useState<View>("search");

  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<RAGResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [saveMsg, setSaveMsg]   = useState<string | null>(null);
  const [library, setLibrary]   = useState<SavedResearch[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef   = useRef<HTMLDivElement>(null);

  /* ── Auto-resize textarea ─────────────────────────── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [query]);

  /* ── Load library when switching to it ────────────── */
  useEffect(() => {
    if (view !== "library" || !isLoggedIn) return;
    setLibLoading(true);
    fetchResearchLibrary({ limit: 50 })
      .then(setLibrary)
      .catch(() => setLibrary([]))
      .finally(() => setLibLoading(false));
  }, [view, isLoggedIn]);

  /* ── Run search ───────────────────────────────────── */
  const handleSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setLoading(true);
    setResult(null);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await searchRAG(trimmed);
      setResult(res);
      requestAnimationFrame(() => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  }, [query, handleSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch(query);
    }
  }, [query, handleSearch]);

  /* ── Save to library ──────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!result || !isLoggedIn) {
      setSaveMsg(isLoggedIn ? "لا توجد نتائج للحفظ" : "يجب تسجيل الدخول أولاً");
      return;
    }
    setSaveMsg("جارٍ الحفظ…");
    try {
      const saved = await saveResearch({
        title:            query.slice(0, 120),
        query_text:       query,
        answer_snapshot:  result.answer,
        sources_snapshot: result.sources,
      });
      setSaveMsg(saved.ok ? "✅ تم الحفظ في مكتبتك" : "❌ فشل الحفظ");
    } catch {
      setSaveMsg("❌ فشل الحفظ");
    } finally {
      setTimeout(() => setSaveMsg(null), 4000);
    }
  }, [result, isLoggedIn, query]);

  /* ── Delete from library ──────────────────────────── */
  const handleDelete = useCallback(async (id: string) => {
    const ok = await deleteResearch(id);
    if (ok) setLibrary((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /* ── Export as Markdown ───────────────────────────── */
  const handleExportMd = useCallback(() => {
    if (!result) return;
    const md = [
      `# ${query}`,
      "",
      result.answer,
      "",
      "## المصادر",
      ...(result.sources || []).map(
        (s, i) => `${i + 1}. **${s.title}** — ${s.source_ref}${s.source_url ? `  \n   ${s.source_url}` : ""}`
      ),
    ].join("\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `research-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, query]);

  return (
    <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)]">
      {/* ── Header ───────────────────────────────────── */}
      <div className="text-white py-10 px-4 ldb-hero">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">🔬 الباحث الشرعي</h1>
          <p className="text-emerald-100 text-sm leading-relaxed max-w-xl mx-auto">
            يُجيب من المصادر الموثّقة فقط — آيات وأحاديث وقرارات مجامع وفتاوى علماء.
            لا يُصدر فتاوى شخصية ولا يُصنّف الأحاديث بنفسه.
          </p>
        </div>
      </div>

      {/* ── Subnav ───────────────────────────────────── */}
      <div className="bg-[var(--majalis-panel)] border-b border-[var(--majalis-line)] sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex">
          {(["search", "library"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                view === v
                  ? "border-[var(--mn-border-active)] text-[var(--mn-text-active)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {v === "search" ? "🔍 البحث" : "📚 مكتبتي"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ═══════════════════════════════════ SEARCH VIEW */}
        {view === "search" && (
          <>
            {/* نموذج البحث */}
            <form onSubmit={handleSubmit} className="bg-[var(--majalis-panel)] rounded-2xl shadow-sm
              border border-[var(--majalis-line)] p-4 space-y-3">
              <textarea
                ref={textareaRef}
                dir="rtl"
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك الشرعي هنا… (Shift+Enter للسطر الجديد)"
                className="w-full resize-none rounded-xl border border-[var(--majalis-line)]
                  bg-[var(--majalis-parchment)] text-[var(--majalis-ink)] placeholder-gray-400
                  px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--majalis-emerald)]
                  transition-all overflow-hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="citation-btn citation-btn--primary flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "يبحث…" : "بحث"}
                </button>
                {result && (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      title="حفظ في مكتبتي"
                      className="px-3 py-2 text-sm bg-[var(--majalis-parchment-deep)] text-[var(--majalis-ink)]
                        rounded-xl hover:bg-[var(--mn-surface-hover)] transition-colors"
                    >
                      💾
                    </button>
                    <button
                      type="button"
                      onClick={handleExportMd}
                      title="تصدير Markdown"
                      className="px-3 py-2 text-sm bg-[var(--majalis-parchment-deep)] text-[var(--majalis-ink)]
                        rounded-xl hover:bg-[var(--mn-surface-hover)] transition-colors"
                    >
                      ⬇️
                    </button>
                  </>
                )}
                {saveMsg && (
                  <span className="text-xs text-[var(--majalis-ink-soft)] mr-auto">{saveMsg}</span>
                )}
              </div>
            </form>

            {/* أسئلة مقترحة */}
            {!result && !loading && (
              <div>
                <p className="text-xs text-[var(--majalis-ink-soft)] opacity-60 mb-2 font-medium">أسئلة مقترحة</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.text}
                      type="button"
                      onClick={() => handleSearch(p.text)}
                      className="text-xs px-3 py-1.5 rounded-full bg-[var(--majalis-panel)] border
                        border-[var(--majalis-line)] text-[var(--majalis-ink)]
                        hover:border-[var(--majalis-emerald)] hover:text-[var(--majalis-emerald)]
                        transition-colors"
                    >
                      {p.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* حالة التحميل */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <Spinner className="size-12 text-[var(--majalis-emerald)]" aria-label="يبحث في المصادر" />
                </div>
                <p className="text-sm text-[var(--majalis-ink-soft)] opacity-60">يبحث في المصادر الشرعية…</p>
              </div>
            )}

            {/* خطأ */}
            {error && !loading && (
              <div className="bg-[var(--majalis-danger-muted)] border border-[var(--majalis-danger)]
                rounded-xl p-4 text-sm text-[var(--majalis-danger)]">
                ⚠️ {error}
              </div>
            )}

            {/* نتيجة البحث */}
            {result && !loading && (
              <div ref={answerRef} className="bg-[var(--majalis-panel)] rounded-2xl shadow-sm
                border border-[var(--majalis-line)] p-5">
                <ResearchAnswer result={result} onSave={handleSave} />
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════ LIBRARY VIEW */}
        {view === "library" && (
          <div className="space-y-4">
            {!isLoggedIn && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800
                rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300 text-center">
                يجب <a href="/login" className="underline font-medium">تسجيل الدخول</a> لعرض مكتبتك البحثية الخاصة.
              </div>
            )}

            {isLoggedIn && libLoading && (
              <div className="text-center py-10 text-[var(--majalis-ink-soft)] opacity-60">جارٍ التحميل…</div>
            )}

            {isLoggedIn && !libLoading && library.length === 0 && (
              <div className="text-center py-10 text-[var(--majalis-ink-soft)] opacity-60">
                <p className="text-4xl mb-3">📭</p>
                <p>لم تحفظ أي بحث بعد.</p>
                <button
                  type="button"
                  onClick={() => setView("search")}
                  className="mt-4 text-sm text-[var(--majalis-emerald)] hover:underline"
                >
                  ابدأ بحثاً الآن ←
                </button>
              </div>
            )}

            {isLoggedIn && !libLoading && library.map((item) => (
              <div key={item.id} className="bg-[var(--majalis-panel)] border border-[var(--majalis-line)]
                rounded-2xl p-4 space-y-2 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[var(--majalis-ink)] text-sm leading-snug">
                    {item.title || item.query_text}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="flex-shrink-0 text-[var(--majalis-line)] hover:text-[var(--majalis-danger)] text-lg leading-none transition-colors"
                    title="حذف"
                  >
                    ×
                  </button>
                </div>

                <p className="text-xs text-[var(--majalis-ink-soft)] line-clamp-2">
                  {item.answer_snapshot}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  {item.tags?.map((tag) => (
                    <span key={tag} className="text-xs bg-[var(--majalis-emerald-muted)] text-[var(--majalis-emerald)] px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-[var(--majalis-ink-soft)] opacity-40 mr-auto">
                    {new Date(item.saved_at).toLocaleDateString("ar-SA")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setView("search");
                    setQuery(item.query_text);
                    handleSearch(item.query_text);
                  }}
                  className="text-xs text-[var(--majalis-emerald)] hover:underline"
                >
                  إعادة البحث ←
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
