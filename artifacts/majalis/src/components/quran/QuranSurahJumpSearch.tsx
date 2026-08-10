/**
 * بحث انتقال سور موحّد — أعلى مركز القرآن + أعلى شيت فهرس المصحف.
 * يقبل: اسم سورة / رقم سورة / صفحة / مرجع آية — بلا autofocus.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import {
  getSurahMeta,
  loadPagePosition,
  loadReadingAyahKey,
  SURAH_START_PAGES,
} from "@/lib/quran-api";
import { mushafPageHref, surahList } from "@/lib/quran-surah-list";
import { parseMushafJumpQuery, matchSurahNumber } from "@/features/search/mushaf-jump";
import { scoreTolerantMatch } from "@/features/search/tolerant-match";
import { toWesternDigits } from "@/shared/arabic-normalize";
import { toArabicDigits } from "@/lib/utils";
import { VirtualList, type VirtualListHandle } from "@/components/VirtualList";
import "@/styles/components/quran-surah-jump-search.css";

export type QuranSurahJumpSearchProps = {
  /** عند التواجد داخل شيت المصحف — انتقال داخلي بدل التوجيه */
  onNavigateToPage?: (page: number, opts?: { surah?: number; ayah?: number }) => void;
  className?: string;
  /** إخفاء قائمة السور الكاملة (مثلاً إن وُجدت قائمة أخرى تحت الحقل) */
  hideCatalog?: boolean;
  /** إخفاء العنوان الظاهر (شيت الفهرس له رأس خاص) */
  hideTitle?: boolean;
  placeholder?: string;
};

type SurahHit = {
  id: number;
  name: string;
  page: number;
  ayahs: number;
  revelation: string;
};

function lastReadingLabel(): { href: string; label: string; page: number } | null {
  const page = loadPagePosition();
  if (page == null) return null;
  const ayahKey = loadReadingAyahKey();
  let surahHint = "";
  if (ayahKey) {
    const surah = Number(ayahKey.split(":")[0]);
    if (surah >= 1 && surah <= 114) surahHint = `سورة ${getSurahMeta(surah).name} · `;
  }
  return {
    page,
    href: mushafPageHref(page),
    label: `${surahHint}ص ${toArabicDigits(page)}`,
  };
}

function filterSurahHits(query: string): SurahHit[] {
  const term = query.trim();
  if (!term) {
    return surahList.map((s) => {
      const m = getSurahMeta(s.id);
      return {
        id: s.id,
        name: m.name,
        page: s.page,
        ayahs: m.ayahs,
        revelation: m.revelation,
      };
    });
  }

  const western = toWesternDigits(term).trim();
  // رقم سورة صريح
  if (/^\d{1,3}$/.test(western)) {
    const n = Number(western);
    if (n >= 1 && n <= 114) {
      const m = getSurahMeta(n);
      return [{
        id: n,
        name: m.name,
        page: SURAH_START_PAGES[n - 1] ?? 1,
        ayahs: m.ayahs,
        revelation: m.revelation,
      }];
    }
  }

  const scored = surahList
    .map((s) => {
      const m = getSurahMeta(s.id);
      const match = scoreTolerantMatch(m.name, term, undefined);
      const pageMatch =
        String(s.page) === western ||
        String(s.id) === western;
      if (!match && !pageMatch) return null;
      return {
        hit: {
          id: s.id,
          name: m.name,
          page: s.page,
          ayahs: m.ayahs,
          revelation: m.revelation,
        },
        rank: pageMatch ? 0 : match!.rank,
        distance: pageMatch ? 0 : match!.distance,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  scored.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.hit.id - b.hit.id;
  });

  // استعلام حرفين: حدّ الضوضاء
  const max = term.replace(/\s+/g, "").length <= 2 ? 12 : 114;
  return scored.slice(0, max).map((s) => s.hit);
}

export function QuranSurahJumpSearch({
  onNavigateToPage,
  className,
  hideCatalog = false,
  hideTitle = false,
  placeholder = "سورة أو صفحة أو آية",
}: QuranSurahJumpSearchProps) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<VirtualListHandle>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 200);
    return () => window.clearTimeout(t);
  }, [query]);

  // إصلاح #950: التمرير يبدأ من أعلى القائمة لا من أسفلها
  useEffect(() => {
    listRef.current?.scrollToIndex(0, "auto");
  }, [debounced]);

  const lastReading = useMemo(() => lastReadingLabel(), []);
  const hits = useMemo(() => filterSurahHits(debounced), [debounced]);

  const jumpTarget = useMemo(() => {
    if (!debounced) return null;
    return parseMushafJumpQuery(debounced);
  }, [debounced]);

  function go(page: number, opts?: { surah?: number; ayah?: number }) {
    if (onNavigateToPage) {
      onNavigateToPage(page, opts);
      return;
    }
    if (opts?.ayah && opts.surah) {
      navigate(`/mushaf/${opts.surah}?ayah=${opts.ayah}`);
      return;
    }
    if (opts?.surah) {
      navigate(`/mushaf/${opts.surah}`);
      return;
    }
    navigate(mushafPageHref(page));
  }

  function openFirstResult() {
    const q = query.trim();
    if (!q) return;
    const jump = parseMushafJumpQuery(q);
    if (jump?.kind === "ayah") {
      go(jump.pageHint, { surah: jump.surah, ayah: jump.ayah });
      inputRef.current?.blur();
      return;
    }
    if (jump?.kind === "page") {
      // إن كان رقم صفحة صريحًا (وليس اسم سورة حُلّ إلى صفحتها) — ميّز بالأرقام فقط
      const western = toWesternDigits(q).trim();
      if (/^\d{1,3}$/.test(western) && Number(western) > 114) {
        go(jump.page);
        inputRef.current?.blur();
        return;
      }
      const surah = matchSurahNumber(q);
      if (surah) {
        go(SURAH_START_PAGES[surah - 1] ?? jump.page, { surah });
        inputRef.current?.blur();
        return;
      }
      go(jump.page);
      inputRef.current?.blur();
      return;
    }
    const first = filterSurahHits(q)[0];
    if (first) {
      go(first.page, { surah: first.id });
      inputRef.current?.blur();
    }
  }

  const showJumpAyah =
    jumpTarget?.kind === "ayah" &&
    debounced.length > 0;

  const showJumpPageOnly =
    jumpTarget?.kind === "page" &&
    /^\d{1,3}$/.test(toWesternDigits(debounced).trim()) &&
    Number(toWesternDigits(debounced).trim()) > 114;

  return (
    <div
      className={`quran-surah-jump${className ? ` ${className}` : ""}`}
      dir="rtl"
    >
      <form
        className="quran-surah-jump__form"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          openFirstResult();
        }}
      >
        {hideTitle ? null : (
          <h2 className="quran-surah-jump__title">بحث السور والصفحات والآيات</h2>
        )}
        <label className="quran-surah-jump__field">
          <Search size={18} strokeWidth={1.8} className="quran-surah-jump__icon" aria-hidden="true" />
          <input
            ref={inputRef}
            className="quran-surah-jump__input"
            type="search"
            enterKeyHint="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="بحث السور والصفحات والآيات"
            autoComplete="off"
            data-search-field="1"
          />
          {query ? (
            <button
              type="button"
              className="quran-surah-jump__clear"
              aria-label="مسح البحث"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          ) : null}
        </label>
      </form>

      {!hideCatalog ? (
        <div className="quran-surah-jump__body">
          {!debounced && lastReading ? (
            <button
              type="button"
              className="quran-surah-jump__resume"
              onClick={() => go(lastReading.page)}
            >
              <span className="quran-surah-jump__resume-label">آخر قراءة</span>
              <span className="quran-surah-jump__resume-meta">{lastReading.label}</span>
            </button>
          ) : null}

          {showJumpAyah && jumpTarget?.kind === "ayah" ? (
            <button
              type="button"
              className="quran-surah-jump__hit quran-surah-jump__hit--ayah"
              onClick={() =>
                go(jumpTarget.pageHint, {
                  surah: jumpTarget.surah,
                  ayah: jumpTarget.ayah,
                })
              }
            >
              <strong>
                {displayHitTitle(jumpTarget.surah)} · آية{" "}
                {toArabicDigits(jumpTarget.ayah)}
              </strong>
              <span>ص {toArabicDigits(jumpTarget.pageHint)}</span>
            </button>
          ) : null}

          {showJumpPageOnly && jumpTarget?.kind === "page" ? (
            <button
              type="button"
              className="quran-surah-jump__hit quran-surah-jump__hit--page"
              onClick={() => go(jumpTarget.page)}
            >
              <strong>صفحة {toArabicDigits(jumpTarget.page)}</strong>
              <span>انتقال مباشر</span>
            </button>
          ) : null}

          {debounced && hits.length === 0 && !showJumpAyah && !showJumpPageOnly ? (
            <div className="quran-surah-jump__empty">
              <p>لا نتائج لـ «{debounced}»</p>
              <button type="button" onClick={() => setQuery("")}>
                مسح البحث
              </button>
            </div>
          ) : null}

          {hits.length > 0 ? (
            <VirtualList
              as="ol"
              ref={listRef}
              className="quran-surah-jump__list"
              aria-label={debounced ? "نتائج السور" : "فهرس السور"}
              items={hits}
              estimateSize={64}
              virtualizeAbove={20}
              getItemKey={(h) => h.id}
              renderItem={(h) => (
                <button
                  type="button"
                  className="quran-surah-jump__hit"
                  onClick={() => go(h.page, { surah: h.id })}
                >
                  <span className="quran-surah-jump__num" aria-hidden="true">
                    {toArabicDigits(h.id)}
                  </span>
                  <span className="quran-surah-jump__meta-col">
                    <strong>{h.name}</strong>
                    <span>
                      {h.revelation} · {toArabicDigits(h.ayahs)} آيات · ص{" "}
                      {toArabicDigits(h.page)}
                    </span>
                  </span>
                </button>
              )}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function displayHitTitle(surah: number): string {
  return `سورة ${getSurahMeta(surah).name}`;
}

export default QuranSurahJumpSearch;
