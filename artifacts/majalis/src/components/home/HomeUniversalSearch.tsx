/**
 * شريط بحث موحّد في الرئيسية — أقسام مع عدّاد، أول ٣، اقتراحات وتاريخ.
 */
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";
import { highlightOriginalParts } from "@/features/search/tolerant-match";
import {
  addSearchHistory,
  getSearchHistory,
} from "@/lib/search-history";
import {
  UNIVERSAL_DEBOUNCE_MS,
  UNIVERSAL_SECTION_LABELS,
  UNIVERSAL_SECTION_ORDER,
  enrichWithVerseHits,
  runUniversalSearch,
  type UniversalHit,
  type UniversalSectionId,
  type UniversalSearchResponse,
} from "@/features/search/universal-home-search";
import "@/styles/components/home-universal-search.css";

const FOCUS_SUGGESTIONS = [
  "البقرة ٢٥٥",
  "٢٨٣",
  "أذكار الصباح",
  "صحيح البخاري",
  "الإمام أحمد",
];

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>;
  const parts = highlightOriginalParts(text, query.trim());
  if (parts.length === 1 && !parts[0]!.hit) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="hus-mark">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export function HomeUniversalSearch() {
  const [, navigate] = useLocation();
  const inputId = useId();
  const listId = useId();
  const [raw, setRaw] = useState("");
  const [debounced, setDebounced] = useState("");
  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | UniversalSectionId>("all");
  const [payload, setPayload] = useState<UniversalSearchResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(raw.trim()), UNIVERSAL_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [raw]);

  useEffect(() => {
    if (focused) setHistory(getSearchHistory().slice(0, 6));
  }, [focused]);

  useEffect(() => {
    if (!debounced) {
      setPayload(null);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    void (async () => {
      try {
        const { loadUnifiedSearchIndex } = await import("@/features/search/unified-local");
        await loadUnifiedSearchIndex();
        if (ac.signal.aborted) return;
        let res = await runUniversalSearch(debounced, { signal: ac.signal });
        if (ac.signal.aborted) return;
        startTransition(() => setPayload(res));
        res = await enrichWithVerseHits(debounced, res);
        if (ac.signal.aborted) return;
        startTransition(() => setPayload(res));
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        startTransition(() => setPayload(null));
      }
    })();
    return () => ac.abort();
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const visibleSections = useMemo(() => payload?.sections ?? [], [payload]);

  const openHit = (hit: UniversalHit) => {
    addSearchHistory(raw.trim() || hit.title);
    setFocused(false);
    navigate(hit.href);
  };

  const showIdle = focused && !debounced;
  const showResults = focused && !!debounced && !!payload;

  return (
    <div className="hus" ref={wrapRef} dir="rtl">
      <label className="hus-label" htmlFor={inputId}>
        بحث موحّد
      </label>
      <div className={`hus-field${focused ? " is-focused" : ""}`}>
        <Search size={18} aria-hidden className="hus-icon" />
        <input
          id={inputId}
          type="search"
          className="hus-input"
          placeholder="ابحث في الآيات والكتب والعلماء والأذكار والأسئلة…"
          value={raw}
          autoComplete="off"
          enterKeyHint="search"
          aria-autocomplete="list"
          aria-controls={showIdle || showResults ? listId : undefined}
          onFocus={() => {
            setFocused(true);
            void import("@/features/search/unified-local").then((m) =>
              m.loadUnifiedSearchIndex().catch(() => undefined),
            );
          }}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setFocused(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        {raw ? (
          <button
            type="button"
            className="hus-clear"
            aria-label="مسح"
            onClick={() => {
              setRaw("");
              setPayload(null);
            }}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {(showIdle || showResults) && (
        <div className="hus-panel" id={listId} role="listbox" aria-label="نتائج البحث">
          {showIdle ? (
            <div className="hus-idle">
              {history.length > 0 ? (
                <div className="hus-block">
                  <p className="hus-block__title">آخر عمليات البحث</p>
                  <ul className="hus-chips">
                    {history.map((q) => (
                      <li key={q}>
                        <button type="button" onClick={() => setRaw(q)}>
                          {q}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="hus-block">
                <p className="hus-block__title">اقتراحات</p>
                <ul className="hus-chips">
                  {FOCUS_SUGGESTIONS.map((q) => (
                    <li key={q}>
                      <button type="button" onClick={() => setRaw(q)}>
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {showResults ? (
            <>
              <div className="hus-filters" role="tablist" aria-label="تصفية الأقسام">
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === "all"}
                  className={filter === "all" ? "is-active" : undefined}
                  onClick={() => setFilter("all")}
                >
                  الكل
                </button>
                {UNIVERSAL_SECTION_ORDER.map((id) => {
                  const n = payload!.counts[id];
                  if (!n) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={filter === id}
                      className={filter === id ? "is-active" : undefined}
                      onClick={() => setFilter(id)}
                    >
                      {UNIVERSAL_SECTION_LABELS[id]} ({toArabicDigits(n)})
                    </button>
                  );
                })}
              </div>

              {visibleSections.length === 0 ? (
                <p className="hus-empty">لا نتائج مطابقة</p>
              ) : (
                visibleSections.map((sec) => {
                  const open = expanded[sec.id] === true;
                  const rows = open ? sec.all : sec.preview;
                  const hidden = filter !== "all" && filter !== sec.id;
                  return (
                    <section
                      key={sec.id}
                      className="hus-section"
                      data-section={sec.id}
                      hidden={hidden}
                      aria-hidden={hidden}
                    >
                      <header className="hus-section__head">
                        <h3>
                          {sec.label}
                          <span> ({toArabicDigits(sec.total)})</span>
                        </h3>
                      </header>
                      <ul className="hus-hits">
                        {rows.map((hit) => (
                          <li key={hit.id}>
                            <button type="button" className="hus-hit" onClick={() => openHit(hit)}>
                              <strong>
                                <Highlight text={hit.title} query={debounced} />
                              </strong>
                              {hit.summary ? (
                                <span>
                                  <Highlight text={hit.summary} query={debounced} />
                                </span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {sec.total > sec.preview.length ? (
                        <button
                          type="button"
                          className="hus-more"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [sec.id]: !open }))
                          }
                        >
                          {open ? "عرض أقل" : "عرض الكل"}
                        </button>
                      ) : null}
                    </section>
                  );
                })
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
