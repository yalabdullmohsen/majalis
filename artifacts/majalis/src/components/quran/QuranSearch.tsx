/**
 * QuranSearch — بحث فوري في القرآن الكريم
 * - بحث فوري (live) بـ 300ms debounce
 * - تطبيع عربي: تشكيل، همزة، تاء مربوطة، ألف مقصورة
 * - تظليل الكلمة المطابقة
 * - فلاتر: سورة، جزء، نوع (مكية/مدنية)
 * - سجل بحث محلي
 * - المصدر: AlQuran Cloud API فقط — لا توليد AI
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { C } from "@/lib/theme";
import { searchQuran, type SearchMatch } from "@/lib/quran-api";
import { normalizeArabic } from "@/lib/arabic-search";
import { addSearchHistory, getSearchHistory, clearSearchHistory } from "@/lib/search-history";

type Props = {
  onGoToResult: (surah: number, ayah: number) => void;
};

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 40;

const POPULAR = ["الرحمن", "الإخلاص", "الكرسي", "الفاتحة", "يسين", "النور"];

// ── تطبيع الاستعلام قبل الإرسال ──────────────────────────────────────────
function buildNormalizedQuery(raw: string): string {
  return normalizeArabic(raw.trim());
}

// ── تظليل الكلمة المطابقة ────────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const nText = normalizeArabic(text);
  const nQuery = normalizeArabic(query.trim());
  if (!nQuery || nQuery.length < 2) return <>{text}</>;
  const idx = nText.indexOf(nQuery);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "#FEF3C7", color: "#92400E", borderRadius: "2px", padding: "0 2px" }}>
        {text.slice(idx, idx + nQuery.length)}
      </mark>
      {text.slice(idx + nQuery.length)}
    </>
  );
}

// ── بطاقة نتيجة واحدة ────────────────────────────────────────────────────
function ResultCard({
  match,
  query,
  onClick,
}: {
  match: SearchMatch;
  query: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: "0.65rem 1rem",
          background: "none",
          border: "none",
          borderBottom: `1px solid ${C.line}`,
          cursor: "pointer",
          textAlign: "right",
          gap: "0.25rem",
          minHeight: "44px",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.sage; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
      >
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.emeraldDeep }}>
          {match.surahName} · الآية {match.ayahNumber}
        </span>
        <span
          dir="rtl"
          lang="ar"
          style={{
            fontSize: "0.95rem",
            fontFamily: '"Amiri Quran", "KFGQPC Uthmanic Script", "Scheherazade New", serif',
            lineHeight: 1.9,
            color: "var(--majalis-ink, #2c2412)",
            textAlign: "right",
          }}
        >
          <HighlightText text={match.text} query={query} />
        </span>
      </button>
    </li>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: "0.5rem 0" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ padding: "0.65rem 1rem", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ height: "0.7rem", background: C.sage, borderRadius: "4px", width: "40%", marginBottom: "0.4rem" }} />
          <div style={{ height: "1rem", background: C.parchmentDeep, borderRadius: "4px", width: `${70 + i * 5}%` }} />
        </div>
      ))}
    </div>
  );
}

export function QuranSearch({ onGoToResult }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getSearchHistory().slice(0, 6));
  const [withTashkeel, setWithTashkeel] = useState(false);
  const [filterSurah, setFilterSurah] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q: string) => {
    const raw = q.trim();
    if (!raw || raw.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(false);
    setSearched(true);

    // استخدام النص الأصلي (مع تشكيل) أو المُطبَّع حسب خيار المستخدم
    const queryToSend = withTashkeel ? raw : buildNormalizedQuery(raw);

    try {
      const res = await searchQuran(queryToSend);
      addSearchHistory(raw);
      setHistory(getSearchHistory().slice(0, 6));
      setResults(res.slice(0, MAX_RESULTS));
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") setError(true);
    } finally {
      setLoading(false);
    }
  }, [withTashkeel]);

  // Debounced live search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    timerRef.current = setTimeout(() => doSearch(query), DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, doSearch]);

  const filteredResults = useMemo(() => {
    if (!filterSurah) return results;
    return results.filter((r) => r.surahNumber === filterSurah);
  }, [results, filterSurah]);

  // سُوَر موجودة في النتائج للفلتر
  const surahsInResults = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of results) m.set(r.surahNumber, r.surahName);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [results]);

  return (
    <div
      role="search"
      aria-label="البحث في القرآن الكريم"
      style={{ direction: "rtl", borderBottom: `1px solid ${C.line}` }}
    >
      {/* ── Input row ── */}
      <div style={{
        display: "flex",
        gap: "0.35rem",
        padding: "0.75rem 1rem 0.5rem",
        alignItems: "center",
      }}>
        <span style={{ color: C.inkSoft, fontSize: "1rem", flexShrink: 0 }}>🔍</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في كامل القرآن الكريم..."
          aria-label="بحث في القرآن"
          dir="rtl"
          autoComplete="off"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "0.95rem",
            color: "var(--majalis-ink, #2c2412)",
            fontFamily: "inherit",
            minHeight: "40px",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setSearched(false); }}
            aria-label="مسح"
            style={{
              border: "none", background: C.parchmentDeep, borderRadius: "50%",
              width: "28px", height: "28px", cursor: "pointer",
              color: C.inkSoft, fontSize: "0.75rem", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        )}
        {loading && <span style={{ fontSize: "0.75rem", color: C.inkSoft, flexShrink: 0 }}>○</span>}
      </div>

      {/* ── Options row ── */}
      <div style={{
        display: "flex",
        gap: "0.35rem",
        padding: "0 1rem 0.5rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <button
          type="button"
          onClick={() => setWithTashkeel((v) => !v)}
          style={{
            padding: "0.2rem 0.6rem",
            borderRadius: "2rem",
            border: `1px solid ${withTashkeel ? C.emerald : C.line}`,
            background: withTashkeel ? C.sage : "transparent",
            color: withTashkeel ? C.emeraldDeep : C.inkSoft,
            fontSize: "0.75rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {withTashkeel ? "✓ مع التشكيل" : "بدون تشكيل"}
        </button>

        {/* فلتر السورة */}
        {surahsInResults.length > 1 && (
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilterSurah(null)}
              style={{
                padding: "0.2rem 0.6rem",
                borderRadius: "2rem",
                border: `1px solid ${filterSurah === null ? C.emerald : C.line}`,
                background: filterSurah === null ? C.sage : "transparent",
                color: filterSurah === null ? C.emeraldDeep : C.inkSoft,
                fontSize: "0.72rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              الكل ({results.length})
            </button>
            {surahsInResults.slice(0, 5).map(([num, name]) => (
              <button
                key={num}
                type="button"
                onClick={() => setFilterSurah(filterSurah === num ? null : num)}
                style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "2rem",
                  border: `1px solid ${filterSurah === num ? C.emerald : C.line}`,
                  background: filterSurah === num ? C.sage : "transparent",
                  color: filterSurah === num ? C.emeraldDeep : C.inkSoft,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {name} ({results.filter((r) => r.surahNumber === num).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ maxHeight: "55vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

        {/* قبل البحث: سجل + شائع */}
        {!query.trim() && (
          <div style={{ padding: "0.5rem 1rem" }}>
            {history.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.inkSoft }}>بحثت سابقاً</span>
                  <button type="button" onClick={() => { clearSearchHistory(); setHistory([]); }}
                    style={{ fontSize: "0.72rem", color: C.emeraldDeep, background: "none", border: "none", cursor: "pointer" }}>
                    مسح
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {history.map((h) => (
                    <button key={h} type="button" onClick={() => setQuery(h)}
                      style={{ padding: "0.2rem 0.6rem", borderRadius: "2rem", background: C.parchmentDeep, border: `1px solid ${C.line}`, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", color: "var(--majalis-ink)" }}>
                      🕐 {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.inkSoft, display: "block", marginBottom: "0.4rem" }}>
                بحث شائع
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {POPULAR.map((p) => (
                  <button key={p} type="button" onClick={() => setQuery(p)}
                    style={{ padding: "0.2rem 0.6rem", borderRadius: "2rem", background: C.sage, border: `1px solid ${C.emerald}`, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", color: C.emeraldDeep }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* تحميل */}
        {loading && <Skeleton />}

        {/* خطأ */}
        {error && !loading && (
          <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: C.inkSoft }}>
            <p style={{ margin: "0 0 0.5rem" }}>⚠️ تعذر الاتصال بالمصدر.</p>
            <button type="button" onClick={() => doSearch(query)}
              style={{ padding: "0.35rem 0.8rem", background: C.emerald, color: "#fff", border: "none", borderRadius: "0.4rem", cursor: "pointer", fontFamily: "inherit" }}>
              أعد المحاولة
            </button>
          </div>
        )}

        {/* لا نتائج */}
        {searched && !loading && !error && filteredResults.length === 0 && (
          <div style={{ padding: "1.5rem 1rem", textAlign: "center", color: C.inkSoft }}>
            <p style={{ margin: "0 0 0.5rem" }}>لا نتائج لـ «{query}»</p>
            <p style={{ fontSize: "0.82rem", margin: 0 }}>
              جرّب تبسيط الكلمة أو الضغط على "مع التشكيل" لبحث أدق.
            </p>
          </div>
        )}

        {/* النتائج */}
        {filteredResults.length > 0 && !loading && (
          <>
            <p style={{ margin: 0, padding: "0.25rem 1rem", fontSize: "0.72rem", color: C.inkSoft, borderBottom: `1px solid ${C.line}` }}>
              {filteredResults.length} نتيجة · المصدر: AlQuran Cloud (حفص عن عاصم)
            </p>
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {filteredResults.map((r) => (
                <ResultCard
                  key={`${r.surahNumber}-${r.ayahNumber}`}
                  match={r}
                  query={query}
                  onClick={() => onGoToResult(r.surahNumber, r.ayahNumber)}
                />
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
