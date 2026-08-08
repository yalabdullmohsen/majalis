import { useEffect, useState } from "react";
import type { SurahSummary } from "@/lib/quran-api";
import { JUZ_START_PAGES } from "@/lib/quran-api";
import { getBookmarks, type QuranBookmark } from "@/lib/quran-personal";
import { getMyBookmarks, type MyBookmark } from "@/lib/quran-my-bookmarks";
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
  const [pageBookmarks, setPageBookmarks] = useState<MyBookmark[]>([]);

  useEffect(() => {
    if (tab === "bookmarks") {
      setBookmarks(getBookmarks());
      setPageBookmarks(getMyBookmarks());
    }
  }, [tab]);

  // surahs prop kept for API compatibility; catalog uses RN `surahList` constants.
  void _surahs;

  const hasAnyBookmark = bookmarks.length > 0 || pageBookmarks.length > 0;

  return (
    <div className="qs-surah-list" role="navigation" aria-label="فهرس المصحف">
      <div className="qs-surah-list__tabs" role="tablist" aria-label="أقسام الفهرس">
        {(
          [
            { id: "surahs", label: "السور" },
            { id: "juz", label: "الأجزاء" },
            { id: "bookmarks", label: "الفواصل" },
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
        <div className="qs-bookmark-list" aria-label="فواصل الصفحات والإشارات">
          {!hasAnyBookmark ? (
            <p className="qs-bookmark-empty">
              لا فواصل محفوظة بعد. احفظ صفحة من شريط المصحف، أو آية من قائمة الإجراءات.
            </p>
          ) : (
            <>
              {pageBookmarks.length > 0 ? (
                <ul className="qs-surah-items" aria-label="فواصل الصفحات">
                  {pageBookmarks.map((b) => {
                    const [surahStr, ayahStr] = (b.ayahKey || "").split(":");
                    const surah = Number(surahStr);
                    const ayah = Number(ayahStr);
                    return (
                    <li key={`page-${b.id}`}>
                      <button
                        type="button"
                        className="qs-surah-item"
                        onClick={() => {
                          if (Number.isFinite(surah) && Number.isFinite(ayah)) {
                            onSelectPage?.(b.page, { surah, ayah });
                          } else {
                            onSelectPage?.(b.page);
                          }
                          onClose?.();
                        }}
                      >
                        <span className="qs-surah-num">{toArabicDigits(b.page)}</span>
                        <span className="qs-surah-name">{b.label}</span>
                        <span className="qs-surah-meta">
                          {b.ayahKey ? `${b.ayahKey} · ` : ""}صفحة {toArabicDigits(b.page)} · {b.date}
                        </span>
                      </button>
                    </li>
                    );
                  })}
                </ul>
              ) : null}
              {bookmarks.length > 0 ? (
                <ul className="qs-surah-items" aria-label="إشارات الآيات">
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
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
