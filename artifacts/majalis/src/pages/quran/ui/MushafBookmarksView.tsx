import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  removeMyBookmark,
  type MyBookmark,
} from "@/lib/quran-my-bookmarks";
import {
  archiveBookmark,
  bookmarkHref,
  exportBookmarksJson,
  getBookmarkStats,
  getLastUsedBookmark,
  importBookmarksJson,
  listFilteredBookmarks,
  setLastUsedBookmarkId,
  toggleBookmarkFavorite,
} from "@/lib/quran-my-bookmarks-ops";
import {
  MUSHAF_BOOKMARK_KINDS,
  resolveBookmarkColor,
  type MushafBookmarkKind,
} from "@/lib/quran-bookmark-kinds";
import { getSurahMeta } from "@/lib/quran-api";
import { toArabicIndicDigits as toArabicDigits } from "@/lib/numerals";
import { navigateTo } from "@/lib/navigation-intent";
import "@/styles/reader-bookmarks-manager.css";

const SURAH_OPTIONS = Array.from({ length: 114 }, (_, i) => i + 1);

/**
 * شاشة مدير الفواصل — بحث · تصفية · تجميع · انتقال سريع.
 */
export default function MushafBookmarksView() {
  const [kind, setKind] = useState<MushafBookmarkKind | "all">("all");
  const [surah, setSurah] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [tick, setTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const items = useMemo(
    () =>
      listFilteredBookmarks({
        kind,
        surah,
        query,
        includeArchived,
      }),
    // tick يُحدّث بعد الحذف/الأرشفة
    [kind, surah, query, includeArchived, tick],
  );

  const stats = useMemo(() => getBookmarkStats(), [tick]);
  const last = useMemo(() => getLastUsedBookmark(), [tick]);
  const dark =
    typeof document !== "undefined" &&
    (document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark");

  const grouped = useMemo(() => {
    const map = new Map<MushafBookmarkKind, MyBookmark[]>();
    for (const b of items) {
      const list = map.get(b.kind) ?? [];
      list.push(b);
      map.set(b.kind, list);
    }
    return MUSHAF_BOOKMARK_KINDS.map((k) => ({
      meta: k,
      items: map.get(k.id) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [items]);

  const openBookmark = (b: MyBookmark) => {
    setLastUsedBookmarkId(b.id);
    navigateTo(bookmarkHref(b));
  };

  const onExport = () => {
    const blob = new Blob([exportBookmarksJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sunnah-mushaf-bookmarks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File) => {
    const text = await file.text();
    const result = await importBookmarksJson(text);
    if (result.ok) refresh();
    else window.alert(result.error);
  };

  return (
    <div className="rb-manager" dir="rtl" data-testid="mushaf-bookmarks-manager">
      <header className="rb-manager__header">
        <Link href="/mushaf" className="rb-manager__back">
          المصحف
        </Link>
        <h1 className="rb-manager__title">الفواصل</h1>
        <span className="rb-manager__count">{toArabicDigits(stats.total)}</span>
      </header>

      <section className="rb-manager__stats" aria-label="إحصائيات الفواصل">
        <div>
          <strong>{toArabicDigits(stats.hifz)}</strong>
          <span>حفظ</span>
        </div>
        <div>
          <strong>{toArabicDigits(stats.review)}</strong>
          <span>مراجعة</span>
        </div>
        <div>
          <strong>{toArabicDigits(stats.wird)}</strong>
          <span>ورد</span>
        </div>
      </section>

      {last ? (
        <button
          type="button"
          className="rb-manager__last"
          onClick={() => openBookmark(last)}
        >
          آخر فاصل: {last.label}
        </button>
      ) : null}

      <div className="rb-manager__toolbar">
        <input
          className="rb-manager__search"
          dir="rtl"
          placeholder="بحث في الفواصل…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="بحث"
        />
        <select
          className="rb-manager__select"
          value={kind}
          onChange={(e) => setKind(e.target.value as MushafBookmarkKind | "all")}
          aria-label="تصفية النوع"
        >
          <option value="all">كل الأنواع</option>
          {MUSHAF_BOOKMARK_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        <select
          className="rb-manager__select"
          value={surah ?? ""}
          onChange={(e) => setSurah(e.target.value ? Number(e.target.value) : null)}
          aria-label="تصفية السورة"
        >
          <option value="">كل السور</option>
          {SURAH_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {getSurahMeta(n).name}
            </option>
          ))}
        </select>
      </div>

      <div className="rb-manager__actions">
        <label className="rb-manager__check">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          الأرشيف
        </label>
        <button type="button" className="rb-manager__ghost" onClick={onExport}>
          تصدير
        </button>
        <button
          type="button"
          className="rb-manager__ghost"
          onClick={() => fileRef.current?.click()}
        >
          استيراد
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImportFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {grouped.length === 0 ? (
        <p className="rb-manager__empty">لا فواصل بعد. اضغط مطولًا على آية في المصحف.</p>
      ) : (
        grouped.map((g) => (
          <section key={g.meta.id} className="rb-manager__group">
            <h2>
              <span
                className="rb-manager__swatch"
                style={{ background: resolveBookmarkColor(g.meta.id, null, dark) }}
              />
              {g.meta.label}
              <em>({toArabicDigits(g.items.length)})</em>
            </h2>
            <ul>
              {g.items.map((b) => (
                <li key={b.id} className={b.archived ? "is-archived" : undefined}>
                  <button
                    type="button"
                    className="rb-manager__item"
                    onClick={() => openBookmark(b)}
                  >
                    <span className="rb-manager__item-label">{b.label}</span>
                    {b.note ? <span className="rb-manager__item-note">{b.note}</span> : null}
                    <span className="rb-manager__item-meta">
                      ص {toArabicDigits(b.page)} · {b.ayahKey}
                      {b.wirdSlot && b.wirdSlot !== "any"
                        ? ` · ${b.wirdSlot === "morning" ? "صباحي" : "مسائي"}`
                        : ""}
                      {b.khatmaId ? ` · ختمة` : ""}
                    </span>
                  </button>
                  <div className="rb-manager__item-actions">
                    <button
                      type="button"
                      aria-label={b.favorite ? "إزالة من المفضلة" : "مفضلة"}
                      onClick={() => void toggleBookmarkFavorite(b.id).then(refresh)}
                    >
                      {b.favorite ? "★" : "☆"}
                    </button>
                    <button
                      type="button"
                      aria-label={b.archived ? "استعادة" : "أرشفة"}
                      onClick={() => void archiveBookmark(b.id, !b.archived).then(refresh)}
                    >
                      {b.archived ? "↩" : "أرشيف"}
                    </button>
                    <button
                      type="button"
                      aria-label="حذف"
                      onClick={() => void removeMyBookmark(b.id).then(refresh)}
                    >
                      حذف
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
