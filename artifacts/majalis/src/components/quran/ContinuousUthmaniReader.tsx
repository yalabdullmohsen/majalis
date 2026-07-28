/**
 * وضع القراءة المتصلة — نص عثماني متدفّق رأسيًا (أسلوب آية/ترتيل).
 * يحمّل الآيات على دفعات غير حاجبة ويحدّث موضع «آخر قراءة».
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSurahDetail, getSurahMeta, type Ayah } from "@/lib/quran-api";
import { toArabicDigits } from "@/lib/utils";
import { yieldToMain } from "@/lib/yield-to-main";
import { beginAbortScope, abortScope, guardAsync } from "@/lib/route-abort";
import { getTajweedRuleForWord } from "@/lib/tajweed-color-tags";

export type ContinuousAyah = Ayah & { surahNumber: number; surahName: string };

type Props = {
  /** سورة البداية */
  startSurah: number;
  /** آية البداية (تُمرَّر للتمرير الأولي) */
  startAyah: number;
  fontScale: number;
  lineHeight?: number;
  sideMargin?: number;
  activeAyahKey?: string | null;
  activeWordIndex?: number | null;
  hideVerseTest?: boolean;
  notedVerseKeys?: Set<string>;
  /** When true, color-code words by tajweed rules; otherwise plain Uthmani. */
  tajweedEnabled?: boolean;
  onAyahPress?: (surah: number, ayah: number, text: string) => void;
  onVisibleAyah?: (surah: number, ayah: number, page: number) => void;
};

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function ContinuousUthmaniReader({
  startSurah,
  startAyah,
  fontScale,
  lineHeight = 2.15,
  sideMargin = 18,
  activeAyahKey,
  activeWordIndex,
  hideVerseTest = false,
  notedVerseKeys,
  tajweedEnabled = false,
  onAyahPress,
  onVisibleAyah,
}: Props) {
  const [ayahs, setAyahs] = useState<ContinuousAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nextSurah, setNextSurah] = useState(startSurah);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const didScrollRef = useRef(false);
  const lastReported = useRef<string>("");

  const loadSurah = useCallback(async (surahNum: number, signal: AbortSignal) => {
    await yieldToMain();
    const detail = await fetchSurahDetail(surahNum);
    if (signal.aborted) return [];
    const meta = getSurahMeta(surahNum);
    return detail.ayahs.map((a) => ({
      ...a,
      surahNumber: surahNum,
      surahName: meta.name,
    }));
  }, []);

  useEffect(() => {
    didScrollRef.current = false;
    setAyahs([]);
    setNextSurah(startSurah);
    const signal = beginAbortScope(`cont-uthmani:${startSurah}`);
    setLoading(true);
    setError(false);
    void guardAsync(signal, async () => {
      const first = await loadSurah(startSurah, signal);
      if (signal.aborted) return;
      setAyahs(first);
      setNextSurah(startSurah + 1);
      setLoading(false);
      // prefetch next
      if (startSurah < 114) {
        try {
          const more = await loadSurah(startSurah + 1, signal);
          if (!signal.aborted) {
            setAyahs((prev) => [...prev, ...more]);
            setNextSurah(startSurah + 2);
          }
        } catch {
          /* ignore prefetch */
        }
      }
    }).catch(() => {
      if (!signal.aborted) {
        setError(true);
        setLoading(false);
      }
    });
    return () => abortScope(`cont-uthmani:${startSurah}`);
  }, [startSurah, loadSurah]);

  // تمرير أولي لآية البداية
  useEffect(() => {
    if (didScrollRef.current || ayahs.length === 0) return;
    const key = `${startSurah}:${startAyah}`;
    const el = scrollerRef.current?.querySelector(`[data-verse-key="${key}"]`);
    if (el) {
      el.scrollIntoView({ block: "center" });
      didScrollRef.current = true;
    }
  }, [ayahs, startSurah, startAyah]);

  // IntersectionObserver لـ آخر قراءة
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || !onVisibleAyah) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0]?.target as HTMLElement | undefined;
        if (!top) return;
        const s = Number(top.dataset.surah);
        const a = Number(top.dataset.ayah);
        const p = Number(top.dataset.page);
        const k = `${s}:${a}`;
        if (!Number.isFinite(s) || !Number.isFinite(a) || k === lastReported.current) return;
        lastReported.current = k;
        onVisibleAyah(s, a, p || 1);
      },
      { root, rootMargin: "-35% 0px -50% 0px", threshold: 0.01 },
    );
    root.querySelectorAll<HTMLElement>("[data-verse-key]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ayahs, onVisibleAyah]);

  const appendMore = useCallback(async () => {
    if (nextSurah > 114 || loading) return;
    const signal = beginAbortScope(`cont-append:${nextSurah}`);
    setLoading(true);
    try {
      await guardAsync(signal, async () => {
        const more = await loadSurah(nextSurah, signal);
        if (signal.aborted) return;
        setAyahs((prev) => [...prev, ...more]);
        setNextSurah((n) => n + 1);
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      abortScope(`cont-append:${nextSurah}`);
    }
  }, [nextSurah, loading, loadSurah]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 480) {
      void appendMore();
    }
  }, [appendMore]);

  const grouped = useMemo(() => ayahs, [ayahs]);

  if (error && ayahs.length === 0) {
    return <p className="ds-empty">تعذّر تحميل وضع القراءة المتصلة.</p>;
  }

  return (
    <div
      ref={scrollerRef}
      className="cur-scroller"
      onScroll={onScroll}
      style={{
        ["--cur-font-size" as string]: `${fontScale}px`,
        ["--cur-line-height" as string]: String(lineHeight),
        ["--cur-side-margin" as string]: `${sideMargin}px`,
        paddingInline: `${sideMargin}px`,
      }}
    >
      {grouped.map((a, idx) => {
        const prev = grouped[idx - 1];
        const showHeader = !prev || prev.surahNumber !== a.surahNumber;
        const verseKey = `${a.surahNumber}:${a.numberInSurah}`;
        const isActive = verseKey === activeAyahKey;
        const words = splitWords(a.text);
        const hasNote = notedVerseKeys?.has(verseKey);
        const isHidden = hideVerseTest && !revealed.has(verseKey) && !isActive;
        return (
          <div key={verseKey}>
            {showHeader && (
              <header className="cur-surah-header">
                <h2 className="cur-surah-header__name">سُورَةُ {a.surahName}</h2>
                {a.surahNumber !== 1 && a.surahNumber !== 9 && a.numberInSurah === 1 && (
                  <p className="cur-bismillah" aria-hidden="true">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </p>
                )}
              </header>
            )}
            <button
              type="button"
              className={`cur-ayah${isActive ? " cur-ayah--active" : ""}${isHidden ? " cur-ayah--hidden" : ""}${hasNote ? " cur-ayah--noted" : ""}`}
              data-verse-key={verseKey}
              data-surah={a.surahNumber}
              data-ayah={a.numberInSurah}
              data-page={a.page ?? 1}
              onClick={() => {
                if (isHidden) {
                  setRevealed((prev) => new Set(prev).add(verseKey));
                  return;
                }
                onAyahPress?.(a.surahNumber, a.numberInSurah, a.text);
              }}
              aria-label={`سورة ${a.surahName} آية ${a.numberInSurah}${hasNote ? " — عليها تدبّر" : ""}`}
            >
              {hasNote && <span className="cur-note-ribbon" aria-hidden="true" />}
              <span className="cur-ayah__text" dir="rtl">
                {words.map((w, wi) => {
                  const rule = tajweedEnabled ? getTajweedRuleForWord(w) : null;
                  return (
                    <span
                      key={wi}
                      className={`cur-word${isActive && activeWordIndex === wi ? " cur-word--active" : ""}${rule ? " cur-word--tj" : ""}`}
                      style={rule ? { color: rule.color } : undefined}
                      data-tj-rule={rule?.ruleId}
                    >
                      {w}
                    </span>
                  );
                })}
              </span>
              <span className="cur-ayah__num" aria-hidden="true">
                ﴿{toArabicDigits(a.numberInSurah)}﴾
              </span>
            </button>
          </div>
        );
      })}
      {loading && <p className="cur-loading">جارٍ تحميل المزيد…</p>}
      {nextSurah > 114 && <p className="cur-end">نهاية المصحف</p>}
    </div>
  );
}

export default ContinuousUthmaniReader;
