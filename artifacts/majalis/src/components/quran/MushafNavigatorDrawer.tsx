/**
 * درج فهرس سريع: سور / أجزاء وحزب / شبكة صفحات 604 — مع بحث فوري.
 */
import { useEffect, useMemo, useState } from "react";
import { X, Play } from "lucide-react";
import type { SurahSummary } from "@/lib/quran-api";
import { JUZ_START_PAGES, SURAH_START_PAGES } from "@/lib/quran-api";
import { arabicMatchAny } from "@/lib/arabic-search";
import { toArabicDigits } from "@/lib/utils";
import { loadPageJuzIndex, getSegmentsForHizb, findPageForAyah } from "@/lib/recitation-ai/page-juz-lookup";
import { listKhatmahWithMeta } from "@/lib/khatmah-sync";

type Tab = "surahs" | "juz" | "pages";

type Props = {
  open: boolean;
  onClose: () => void;
  surahs: SurahSummary[];
  currentSurah: number;
  currentPage: number;
  onSelectSurah: (n: number) => void;
  onSelectPage: (page: number, opts?: { surah?: number; ayah?: number }) => void;
  onPlaySurah?: (n: number) => void;
};

const TOTAL_PAGES = 604;

export function MushafNavigatorDrawer({
  open,
  onClose,
  surahs,
  currentSurah,
  currentPage,
  onSelectSurah,
  onSelectPage,
  onPlaySurah,
}: Props) {
  const [tab, setTab] = useState<Tab>("surahs");
  const [q, setQ] = useState("");
  const [hizbPages, setHizbPages] = useState<number[]>([]);
  const [juzProgress, setJuzProgress] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void (async () => {
      try {
        const idx = await loadPageJuzIndex();
        const pages: number[] = [];
        for (let h = 1; h <= 60; h++) {
          const segs = getSegmentsForHizb(idx, h);
          const first = segs[0];
          if (first) {
            const p = findPageForAyah(idx, first.surah, first.ayahFrom) ?? 1;
            pages.push(p);
          } else pages.push(1);
        }
        if (alive) setHizbPages(pages);
      } catch {
        /* ignore */
      }
      const plans = listKhatmahWithMeta();
      const active = plans[0];
      const prog: Record<number, number> = {};
      if (active) {
        const perJuz = Math.min(1, active.totalPagesRead / 604);
        for (let j = 1; j <= 30; j++) prog[j] = Math.round(perJuz * 100);
      }
      if (alive) setJuzProgress(prog);
    })();
    return () => { alive = false; };
  }, [open]);

  const filteredSurahs = useMemo(() => {
    const term = q.trim();
    if (!term) return surahs;
    return surahs.filter(
      (s) =>
        arabicMatchAny([s.name, s.englishName], term) ||
        String(s.number).startsWith(term),
    );
  }, [surahs, q]);

  const filteredPages = useMemo(() => {
    const term = q.trim();
    if (!term) return null;
    const n = Number(term);
    if (Number.isFinite(n) && n >= 1 && n <= TOTAL_PAGES) return [n];
    return [];
  }, [q]);

  if (!open) return null;

  return (
    <div className="mnd-overlay" onClick={onClose} role="presentation">
      <div
        className="mnd-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="فهرس المصحف السريع"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mnd-drawer__head">
          <h2>فهرس المصحف</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="mnd-drawer__close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mnd-tabs" role="tablist">
          {(
            [
              { id: "surahs" as const, label: "السور" },
              { id: "juz" as const, label: "جزء / حزب" },
              { id: "pages" as const, label: "الصفحات" },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`mnd-tab${tab === t.id ? " is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mnd-search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "pages" ? "رقم صفحة…" : "بحث سريع…"}
            aria-label="تصفية الفهرس"
          />
        </div>

        <div className="mnd-body">
          {tab === "surahs" && (
            <ol className="mnd-surah-list">
              {filteredSurahs.map((s) => (
                <li key={s.number}>
                  <button
                    type="button"
                    className={`mnd-surah${s.number === currentSurah ? " is-active" : ""}`}
                    onClick={() => { onSelectSurah(s.number); onClose(); }}
                  >
                    <span className="mnd-surah__num">{toArabicDigits(s.number)}</span>
                    <span className="mnd-surah__name">{s.name}</span>
                    <span className="mnd-surah__meta">
                      {toArabicDigits(s.numberOfAyahs)} آية · {s.revelationType === "Meccan" ? "مكية" : "مدنية"}
                    </span>
                  </button>
                  {onPlaySurah && (
                    <button
                      type="button"
                      className="mnd-surah__play"
                      aria-label={`تشغيل سورة ${s.name}`}
                      onClick={() => { onPlaySurah(s.number); onClose(); }}
                    >
                      <Play size={14} aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}

          {tab === "juz" && (
            <div className="mnd-juz">
              <h3 className="mnd-subhead">الأجزاء</h3>
              <div className="mnd-chip-grid">
                {JUZ_START_PAGES.map((page, i) => {
                  const juz = i + 1;
                  const pct = juzProgress[juz] ?? 0;
                  return (
                    <button
                      key={juz}
                      type="button"
                      className="mnd-chip"
                      onClick={() => { onSelectPage(page); onClose(); }}
                    >
                      <span>جزء {toArabicDigits(juz)}</span>
                      <small>ص {toArabicDigits(page)}</small>
                      <span className="mnd-chip__bar" style={{ width: `${pct}%` }} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <h3 className="mnd-subhead">الأحزاب</h3>
              <div className="mnd-chip-grid">
                {Array.from({ length: 60 }, (_, i) => i + 1).map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="mnd-chip mnd-chip--hizb"
                    onClick={() => {
                      onSelectPage(hizbPages[h - 1] ?? 1);
                      onClose();
                    }}
                  >
                    حزب {toArabicDigits(h)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "pages" && (
            <div className="mnd-pages" aria-label="شبكة صفحات المصحف">
              {(filteredPages ?? Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1)).map((p) => {
                const surahIdx = SURAH_START_PAGES.findIndex((sp, i) => {
                  const next = SURAH_START_PAGES[i + 1] ?? 605;
                  return p >= sp && p < next;
                });
                const label = surahIdx >= 0 ? surahs[surahIdx]?.name : "";
                return (
                  <button
                    key={p}
                    type="button"
                    className={`mnd-page${p === currentPage ? " is-active" : ""}`}
                    title={label ? `ص ${p} · ${label}` : `صفحة ${p}`}
                    onClick={() => { onSelectPage(p); onClose(); }}
                  >
                    <span>{toArabicDigits(p)}</span>
                    {label && <small>{label}</small>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MushafNavigatorDrawer;
