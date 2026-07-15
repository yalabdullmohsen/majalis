import { useState, useRef, useEffect, useCallback } from "react";
import { ShareButtons } from "@/components/ContentActions";
import { Link } from "wouter";
import {
  AlertTriangle, BookOpen, Clock, Download,
  FlaskConical, Inbox, Save, Search, X,
} from "lucide-react";
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
import { SectionQuiz } from "@/components/ui/SectionQuiz";

type View = "search" | "library";

const INTENT_LABELS: Record<string, string> = {
  all:      "الكل",
  fiqh:     "فقه",
  hadith:   "حديث",
  compare:  "مقارنة",
  evidence: "أدلة",
  source:   "مصادر",
  general:  "عام",
};

const INTENTS = ["all", "fiqh", "hadith", "compare", "evidence", "source", "general"] as const;

const MAX_CHAR = 400;
const HISTORY_KEY = "majalis:srp:history";
const MAX_HISTORY = 6;

function getSrpHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function addSrpHistory(q: string) {
  try {
    const prev = getSrpHistory().filter((x) => x !== q);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...prev].slice(0, MAX_HISTORY)));
  } catch { /* ignore */ }
}

function clearSrpHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
}

const LOADING_MESSAGES = [
  "يبحث في أحاديث الصحيحين…",
  "يستعرض الفتاوى الموثّقة…",
  "يفحص قرارات المجامع الفقهية…",
  "يراجع المصادر الأصيلة…",
];

function LoadingDots() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="srp-loading">
      <Spinner className="size-10 icon-emerald" aria-label="يبحث" />
      <p className="srp-loading__msg">{LOADING_MESSAGES[msgIdx]}</p>
    </div>
  );
}

export default function ScholarlyResearchPage() {
  const { isLoggedIn } = useAuth();
  const [view,      setView]      = useState<View>("search");
  const [query,     setQuery]     = useState("");
  const [intent,    setIntent]    = useState<string>("all");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<RAGResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [saveMsg,   setSaveMsg]   = useState<string | null>(null);
  const [library,   setLibrary]   = useState<SavedResearch[]>([]);
  const [libLoading,setLibLoading]= useState(false);
  const [history,   setHistory]   = useState<string[]>([]);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/scholarly-research",
      title: "الباحث الشرعي | المجلس العلمي",
      description: "محرك بحث شرعي ذكي بتقنية RAG، ابحث في المصادر الإسلامية واحصل على إجابات دقيقة موثّقة.",
      keywords: ["بحث علمي شرعي", "ذكاء اصطناعي إسلامي", "محرك بحث فقهي", "RAG إسلامي", "إجابات شرعية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "الباحث الشرعي",
          url: "https://www.majlisilm.com/scholarly-research",
          description: "محرك بحث شرعي ذكي بتقنية RAG للبحث في المصادر الإسلامية",
          applicationCategory: "EducationalApplication",
          inLanguage: "ar",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      ],
    });
    setHistory(getSrpHistory());
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [query]);

  // Load library when switching to library tab
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
    addSrpHistory(trimmed);
    setHistory(getSrpHistory());
    try {
      const res = await searchRAG(trimmed);
      setResult(res);
      requestAnimationFrame(() =>
        answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
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

  const filteredPrompts = intent === "all"
    ? QUICK_PROMPTS
    : QUICK_PROMPTS.filter((p) => p.intent === intent);

  const charPct = Math.min(100, (query.length / MAX_CHAR) * 100);
  const nearLimit = query.length > MAX_CHAR * 0.85;

  return (
    <div dir="rtl" className="srp-root">

      {/* ── Hero ── */}
      <div className="srp-hero">
        <FlaskConical size={24} strokeWidth={1.6} aria-hidden="true" className="srp-hero__icon" />
        <h1 className="srp-hero__title">الباحث الشرعي</h1>
        <p className="srp-hero__sub">
          يُجيب من المصادر الموثّقة فقط — آيات وأحاديث وقرارات مجامع وفتاوى علماء.
          لا يُصدر فتاوى شخصية ولا يُصنّف الأحاديث بنفسه.
        </p>
      </div>

      {/* ── Subnav ── */}
      <div className="srp-subnav" role="tablist" aria-label="تبويبات البحث العلمي">
        <div className="srp-subnav__inner">
          {(["search", "library"] as View[]).map((v) => (
            <button
              key={v}
              id={`srp-tab-${v}`}
              type="button"
              role="tab"
              aria-selected={view === v}
              aria-controls={`srp-panel-${v}`}
              onClick={() => setView(v)}
              className={`srp-tab${view === v ? " srp-tab--active" : ""}`}
            >
              {v === "search"
                ? <><Search  size={13} aria-hidden="true" /> البحث</>
                : <><BookOpen size={13} aria-hidden="true" /> مكتبتي</>
              }
            </button>
          ))}
        </div>
      </div>

      <div className="srp-body">

        {/* ══════════════════════════ SEARCH VIEW */}
        {view === "search" && (
          <div role="tabpanel" id="srp-panel-search" aria-labelledby="srp-tab-search">
            {/* نموذج البحث */}
            <form onSubmit={handleSubmit} className="srp-form" aria-label="البحث العلمي">
              <div className="srp-textarea-wrap">
                <textarea
                  ref={textareaRef}
                  dir="rtl"
                  rows={2}
                  value={query}
                  maxLength={MAX_CHAR}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="سؤالك الشرعي"
                  placeholder="اكتب سؤالك الشرعي هنا… (Shift+Enter للسطر الجديد)"
                  className="srp-textarea"
                />
                {/* عدّاد الأحرف */}
                <div className="srp-char-bar" aria-hidden="true">
                  <div
                    className={`srp-char-bar__fill${nearLimit ? " srp-char-bar__fill--warn" : ""}`}
                    style={{ width: `${charPct}%` }}
                  />
                </div>
                {nearLimit && (
                  <p className="srp-char-hint">{query.length} / {MAX_CHAR}</p>
                )}
              </div>

              <div className="srp-form-actions">
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="citation-btn citation-btn--primary srp-submit-btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "يبحث…" : <><Search size={14} aria-hidden="true" /> بحث</>}
                </button>
                {result && (
                  <>
                    <button type="button" onClick={handleSave} aria-label="حفظ في مكتبتي" className="srp-action-btn">
                      <Save size={15} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={handleExportMd} aria-label="تصدير Markdown" className="srp-action-btn">
                      <Download size={15} aria-hidden="true" />
                    </button>
                  </>
                )}
                {saveMsg && <span className="srp-save-msg" role="status">{saveMsg}</span>}
              </div>
            </form>

            {/* ── الأسئلة الأخيرة ── */}
            {!result && !loading && history.length > 0 && (
              <div className="srp-history">
                <div className="srp-history__head">
                  <span className="srp-history__label">
                    <Clock size={13} aria-hidden="true" /> أسئلة سابقة
                  </span>
                  <button
                    type="button"
                    className="srp-history__clear"
                    onClick={() => { clearSrpHistory(); setHistory([]); }}
                  >
                    مسح الكل
                  </button>
                </div>
                <div className="srp-history__chips">
                  {history.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className="srp-history__chip"
                      onClick={() => handleSearch(h)}
                    >
                      <Clock size={11} aria-hidden="true" />
                      <span className="srp-history__chip-text">{h}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── الأسئلة المقترحة مع فلتر النية ── */}
            {!result && !loading && (
              <div className="srp-suggestions">
                <div className="srp-intent-row" role="tablist" aria-label="تصفية الأسئلة">
                  {INTENTS.map((it) => (
                    <button
                      key={it}
                      role="tab"
                      type="button"
                      onClick={() => setIntent(it)}
                      className={`srp-intent-chip${intent === it ? " srp-intent-chip--active" : ""}`}
                      aria-selected={intent === it}
                    >
                      {INTENT_LABELS[it]}
                    </button>
                  ))}
                </div>
                <div className="srp-prompts">
                  {filteredPrompts.map((p) => (
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
            {loading && <LoadingDots />}

            {/* خطأ */}
            {error && !loading && (
              <div className="srp-error" role="alert">
                <AlertTriangle size={13} aria-hidden="true" className="inline ml-1" />
                {error}
              </div>
            )}

            {/* نتيجة البحث */}
            {result && !loading && (
              <div ref={answerRef} className="srp-result-box">
                <ResearchAnswer result={result} onSave={handleSave} />
                <div className="ai-disclaimer-bar" role="note">
                  <AlertTriangle size={13} className="ai-disclaimer-bar__icon" aria-hidden="true" />
                  <span>
                    هذه الإجابة ذات طابع <strong>تعليمي</strong> مبنية على مصادر موثّقة، وليست فتوى شخصية.
                    للمسائل الشخصية الحساسة يُرجى استشارة عالم متخصص.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════ LIBRARY VIEW */}
        {view === "library" && (
          <div role="tabpanel" id="srp-panel-library" aria-labelledby="srp-tab-library" className="srp-library">
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
                <Inbox size={40} strokeWidth={1.3} aria-hidden="true" className="srp-empty__icon" />
                <p>لم تحفظ أي بحث بعد.</p>
                <button type="button" onClick={() => setView("search")} className="srp-start-search">
                  ابدأ بحثاً الآن ←
                </button>
              </div>
            )}

            {isLoggedIn && !libLoading && library.map((item) => (
              <div key={item.id} className="srp-lib-item">
                <div className="srp-lib-item__head">
                  <h3 className="srp-lib-title">{item.title || item.query_text}</h3>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="srp-lib-del"
                    title="حذف"
                    aria-label="حذف هذا البحث"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>

                <p
                  className={`srp-lib-excerpt${expanded === item.id ? " srp-lib-excerpt--expanded" : ""}`}
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  {item.answer_snapshot}
                </p>

                <div className="srp-lib-item__footer">
                  <div className="srp-lib-tags">
                    {item.tags?.map((tag) => (
                      <span key={tag} className="srp-lib-tag">{tag}</span>
                    ))}
                    {item.sources_snapshot?.length > 0 && (
                      <span className="srp-lib-src-count">
                        {item.sources_snapshot.length} مصدر
                      </span>
                    )}
                  </div>
                  <span className="srp-lib-date">
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
        <ShareButtons title="الباحث الشرعي — المجلس العلمي" url="https://www.majlisilm.com/scholarly-research" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["hadith", "fiqh"]} title="اختبر معلوماتك في العلوم الشرعية" count={4} />
      </div>
    </div>
  );
}
