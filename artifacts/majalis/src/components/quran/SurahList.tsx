import { useEffect, useMemo, useState } from "react";
import type { SurahSummary } from "@/lib/quran-api";
import { JUZ_START_PAGES } from "@/lib/quran-api";
import { arabicMatchAny } from "@/lib/arabic-search";
import { getBookmarks, type QuranBookmark } from "@/lib/quran-personal";

type SidebarTab = "surahs" | "juz" | "bookmarks";

type Props = {
  surahs: SurahSummary[];
  currentSurah: number;
  onSelect: (n: number) => void;
  onClose?: () => void;
  /** الانتقال لصفحة مباشرة (أجزاء / إشارات مرجعية). */
  onSelectPage?: (page: number, opts?: { surah?: number; ayah?: number }) => void;
};

function toArabicDigits(n: number): string {
  const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/[0-9]/g, (d) => digits[Number(d)]);
}

export function SurahList({ surahs, currentSurah, onSelect, onClose, onSelectPage }: Props) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<SidebarTab>("surahs");
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);

  useEffect(() => {
    if (tab === "bookmarks") setBookmarks(getBookmarks());
  }, [tab]);

  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return surahs;
    return surahs.filter(
      (s) =>
        arabicMatchAny([s.name, s.englishName], term) ||
        String(s.number).startsWith(term),
    );
  }, [surahs, q]);

  return (
    <div className="qs-surah-list" role="navigation" aria-label="فهرس المصحف">
      <div className="qs-surah-list__tabs" role="tablist" aria-label="أقسام الفهرس">
        {(
          [
            { id: "surahs", label: "السور" },
            { id: "juz", label: "الأجزاء" },
            { id: "bookmarks", label: "الإشارات" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`qs-surah-list__tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "surahs" && (
        <>
          <div className="qs-surah-list__search">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن سورة..."
              aria-label="ابحث عن سورة"
              className="qs-search-input"
            />
          </div>
          <ol className="qs-surah-items">
            {filtered.map((s) => (
              <li key={s.number}>
                <button
                  type="button"
                  className={`qs-surah-item${s.number === currentSurah ? " is-active" : ""}`}
                  onClick={() => { onSelect(s.number); onClose?.(); }}
                  aria-current={s.number === currentSurah ? "true" : undefined}
                >
                  <span className="qs-surah-num">{s.number}</span>
                  <span className="qs-surah-name">{s.name}</span>
                  <span className="qs-surah-meta">
                    {s.numberOfAyahs} آية · {s.revelationType === "Meccan" ? "مكية" : "مدنية"}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}

      {tab === "juz" && (
        <div className="qs-juz-grid" aria-label="الأجزاء الثلاثون">
          {JUZ_START_PAGES.map((page, i) => {
            const juz = i + 1;
            return (
              <button
                key={juz}
                type="button"
                className="qs-juz-chip"
                onClick={() => {
                  onSelectPage?.(page);
                  onClose?.();
                }}
              >
                الجزء {toArabicDigits(juz)}
                <small>ص {toArabicDigits(page)}</small>
              </button>
            );
          })}
        </div>
      )}

      {tab === "bookmarks" && (
        <div className="qs-bookmark-list" aria-label="الإشارات المرجعية">
          {bookmarks.length === 0 ? (
            <p className="qs-bookmark-empty">لا إشارات محفوظة بعد. احفظ آية من قائمة إجراءات الآية.</p>
          ) : (
            <ul className="qs-surah-items">
              {bookmarks.map((b) => (
                <li key={`${b.surahNum}:${b.ayahNum}:${b.addedAt}`}>
                  <button
                    type="button"
                    className="qs-surah-item"
                    onClick={() => {
                      // الصفحة تُحسب في MushafPageView عبر فهرس page-juz (لا تخمين).
                      onSelectPage?.(1, { surah: b.surahNum, ayah: b.ayahNum });
                      onClose?.();
                    }}
                  >
                    <span className="qs-surah-num">{b.surahNum}:{b.ayahNum}</span>
                    <span className="qs-surah-name">{b.surahName}</span>
                    <span className="qs-surah-meta">{b.text.slice(0, 48)}{b.text.length > 48 ? "…" : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
