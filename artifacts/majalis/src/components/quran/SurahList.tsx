import { useEffect, useState } from "react";
import type { SurahSummary } from "@/lib/quran-api";
import { JUZ_START_PAGES } from "@/lib/quran-api";
import { getBookmarks, type QuranBookmark } from "@/lib/quran-personal";
import { toArabicDigits } from "@/lib/utils";
import { SurahIndexFlatList } from "@/components/quran/SurahIndexFlatList";

type SidebarTab = "surahs" | "juz" | "bookmarks";

type Props = {
  surahs: SurahSummary[];
  currentSurah: number;
  onSelect: (n: number) => void;
  onClose?: () => void;
  /** الانتقال لصفحة مباشرة (أجزاء / إشارات مرجعية / فهرس السور). */
  onSelectPage?: (page: number, opts?: { surah?: number; ayah?: number }) => void;
};

export function SurahList({ surahs: _surahs, currentSurah, onSelect, onClose, onSelectPage }: Props) {
  const [tab, setTab] = useState<SidebarTab>("surahs");
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);

  useEffect(() => {
    if (tab === "bookmarks") setBookmarks(getBookmarks());
  }, [tab]);

  // surahs prop kept for API compatibility; catalog uses RN `surahList` constants.
  void _surahs;

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
        <SurahIndexFlatList
          currentSurah={currentSurah}
          onNavigateToPage={(page, item) => {
            // RN: navigateToPage(item.page)
            if (onSelectPage) onSelectPage(page, { surah: item.id });
            else onSelect(item.id);
            onClose?.();
          }}
        />
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
