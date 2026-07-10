import { useState, useRef, useEffect, useCallback } from "react";
import { ShareButtons } from "@/components/ContentActions";
import { Link } from "wouter";
import { AlertTriangle, BookOpen, Download, FlaskConical, Inbox, Save, Search } from "lucide-react";
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
import { applyPageSeo } from "@/lib/seo";

type View = "search" | "library";

export default function ScholarlyResearchPage() {
  const { isLoggedIn } = useAuth();
  const [view, setView] = useState<View>("search");

  useEffect(() => {
    applyPageSeo({
      path: "/scholarly-research",
      title: "البحث العلمي الشرعي | المجلس العلمي",
      description: "محرك بحث شرعي ذكي بتقنية RAG، ابحث في المصادر الإسلامية واحصل على إجابات دقيقة موثّقة.",
      keywords: ["بحث علمي شرعي", "ذكاء اصطناعي إسلامي", "محرك بحث فقهي", "RAG إسلامي", "إجابات شرعية"],
    });
  }, []);

  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<RAGResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [saveMsg, setSaveMsg]   = useState<string | null>(null);
  const [library, setLibrary]   = useState<SavedResearch[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [query]);

  useEffect(() => {
    if (view !== "library" || !isLoggedIn) return;
    setLibLoading(true);
    fetchResearchLibrary({ limit: 50 })
      .then(setLibrary)
      .catch(() => setLibrary([]))
      .finally(() => setLibLoading(false));
  }, [view, isLoggedIn]);

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
      setSaveMsg(saved.ok ? "تم الحفظ في مكتبتك" : "فشل الحفظ");
    } catch {
      setSaveMsg("فشل الحفظ");
    } finally {
      setTimeout(() => setSaveMsg(null), 4000);
    }
  }, [result, isLoggedIn, query]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await deleteResearch(id);
    if (ok) setLibrary((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleExportMd = useCallback(() => {
    if (!result) return;
    const md = [
      `# ${query}`,
      "",
      result.answer,
      "",
      "## المصادر",
      ...(result.sources || []).map(
        (s, i) => `${i + 1}. **${s.title}**، ${s.source_ref}${s.source_url ? `  \n   ${s.source_url}` : ""}`
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
    <div dir="rtl" className="srp-root">
      {/* ── Header ───────────────────────────────────── */}
      <div className="text-white py-10 px-4 ldb-hero">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <FlaskConical size={22} strokeWidth={1.6} aria-hidden="true" /> الباحث الشرعي
          </h1>
          <p className="text-white/85 text-sm leading-relaxed max-w-xl mx-auto">
            يُجيب من المصادر الموثّقة فقط، آيات وأحاديث وقرارات مجامع وفتاوى علماء.
            لا يُصدر فتاوى شخصية ولا يُصنّف الأحاديث بنفسه.
          </p>
        </div>
      </div>

      {/* ── Subnav ───────────────────────────────────── */}
      <div className="srp-subnav">
        <div className="max-w-3xl mx-auto flex">
          {(["search", "library"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`srp-tab${view === v ? " srp-tab--active" : ""}`}
            >
              {v === "search"
                ? <><Search size={14} strokeWidth={1.8} aria-hidden="true" /> البحث</>
                : <><BookOpen size={14} strokeWidth={1.8} aria-hidden="true" /> مكتبتي</>
              }
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ═══════════════════════════════════ SEARCH VIEW */}
        {view === "search" && (
          <>
            {/* نموذج البحث */}
            <form onSubmit={handleSubmit} className="srp-form space-y-3">
              <textarea
                ref={textareaRef}
                dir="rtl"
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك الشرعي هنا… (Shift+Enter للسطر الجديد)"
                className="srp-textarea"
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
                    <button type="button" onClick={handleSave} title="حفظ في مكتبتي" className="srp-action-btn">
                      <Save size={15} />
                    </button>
                    <button type="button" onClick={handleExportMd} title="تصدير Markdown" className="srp-action-btn">
                      <Download size={15} />
                    </button>
                  </>
                )}
                {saveMsg && <span className="srp-save-msg">{saveMsg}</span>}
              </div>
            </form>

            {/* أسئلة مقترحة */}
            {!result && !loading && (
              <div>
                <p className="srp-suggestions-label">أسئلة مقترحة</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.text}
                      type="button"
                      onClick={() => handleSearch(p.text)}
                      className="srp-prompt-btn"
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
                <Spinner className="size-12 icon-emerald" aria-label="يبحث في المصادر" />
                <p className="srp-loading-text">يبحث في المصادر الشرعية…</p>
              </div>
            )}

            {/* خطأ */}
            {error && !loading && (
              <div className="srp-error">
                <AlertTriangle size={13} className="inline ml-1" />{error}
              </div>
            )}

            {/* نتيجة البحث */}
            {result && !loading && (
              <div ref={answerRef} className="srp-result-box">
                <ResearchAnswer result={result} onSave={handleSave} />
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════ LIBRARY VIEW */}
        {view === "library" && (
          <div className="space-y-4">
            {!isLoggedIn && (
              <div className="srp-login-notice">
                يجب <Link href="/login" className="underline font-medium">تسجيل الدخول</Link> لعرض مكتبتك البحثية الخاصة.
              </div>
            )}

            {isLoggedIn && libLoading && (
              <div className="srp-empty">جارٍ التحميل…</div>
            )}

            {isLoggedIn && !libLoading && library.length === 0 && (
              <div className="srp-empty">
                <p className="text-4xl mb-3"><Inbox size={40} strokeWidth={1.3} /></p>
                <p>لم تحفظ أي بحث بعد.</p>
                <button type="button" onClick={() => setView("search")} className="srp-start-search">
                  ابدأ بحثاً الآن ←
                </button>
              </div>
            )}

            {isLoggedIn && !libLoading && library.map((item) => (
              <div key={item.id} className="srp-lib-item">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="srp-lib-title">{item.title || item.query_text}</h3>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="srp-lib-del"
                    title="حذف"
                  >
                    ×
                  </button>
                </div>

                <p className="srp-lib-excerpt mb-2">{item.answer_snapshot}</p>

                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {item.tags?.map((tag) => (
                    <span key={tag} className="srp-lib-tag">{tag}</span>
                  ))}
                  <span className="srp-lib-date">{new Date(item.saved_at).toLocaleDateString("ar-SA")}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setView("search");
                    setQuery(item.query_text);
                    handleSearch(item.query_text);
                  }}
                  className="srp-lib-search-btn"
                >
                  إعادة البحث ←
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="twh-share">
        <ShareButtons title="الباحث الشرعي — المجلس العلمي" url="https://majlisilm.com/scholarly-research" />
      </div>
    </div>
  );
}
