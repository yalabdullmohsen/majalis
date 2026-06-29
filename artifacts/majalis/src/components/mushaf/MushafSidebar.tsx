import { useMemo, useState } from "react";
import { MUSHAF_INDEX } from "@/lib/mushaf/kuwait-mushaf-data";
import { filterIndex } from "@/lib/mushaf/mushaf-search";
import type { MushafBookmark } from "@/lib/mushaf/mushaf-storage";
import type { KuwaitMushafState } from "@/hooks/useKuwaitMushaf";

type Tab = "surahs" | "juzs" | "hizbs" | "quarters" | "pages" | "bookmarks" | "history";

type Props = {
  mushaf: KuwaitMushafState;
  onNavigate: () => void;
};

export function MushafSidebar({ mushaf, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>("surahs");
  const [query, setQuery] = useState("");

  const surahs = useMemo(
    () => filterIndex(MUSHAF_INDEX.surahs, query, (s) => `${s.number} ${s.name}`),
    [query],
  );
  const juzs = useMemo(
    () => filterIndex(MUSHAF_INDEX.juzs, query, (j) => `جزء ${j.number}`),
    [query],
  );
  const hizbs = useMemo(
    () => filterIndex(MUSHAF_INDEX.hizbs, query, (h) => `حزب ${h.number}`),
    [query],
  );
  const quarters = useMemo(
    () => filterIndex(MUSHAF_INDEX.quarters, query, (q) => `ربع ${q.number}`),
    [query],
  );
  const pages = useMemo(() => {
    const q = query.trim();
    if (!q) return MUSHAF_INDEX.pages;
    return MUSHAF_INDEX.pages.filter(
      (p) => String(p.page).includes(q) || p.surahName.includes(q),
    );
  }, [query]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "surahs", label: "السور" },
    { id: "juzs", label: "الأجزاء" },
    { id: "hizbs", label: "الأحزاب" },
    { id: "quarters", label: "الأرباع" },
    { id: "pages", label: "الصفحات" },
    { id: "bookmarks", label: "العلامات" },
    { id: "history", label: "السجل" },
  ];

  const go = (fn: () => void) => {
    fn();
    onNavigate();
  };

  return (
    <aside className="km-sidebar" aria-label="فهرس المصحف">
      <input
        type="search"
        className="km-sidebar__search ds-input"
        placeholder="بحث سريع…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="بحث في الفهرس"
      />
      <div className="km-sidebar__tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`km-sidebar__tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="km-sidebar__list" role="tabpanel">
        {tab === "surahs" &&
          surahs.map((s) => (
            <button
              key={s.number}
              type="button"
              className="km-sidebar__item"
              onClick={() => go(() => mushaf.goToSurah(s.number))}
            >
              <span>{s.number}. {s.name}</span>
              <small>ص {s.startPage} · {s.revelation} · {s.ayahs} آية</small>
            </button>
          ))}
        {tab === "juzs" &&
          juzs.map((j) => (
            <button
              key={j.number}
              type="button"
              className="km-sidebar__item"
              onClick={() => go(() => mushaf.goToJuz(j.number))}
            >
              <span>الجزء {j.number}</span>
              <small>يبدأ من ص {j.startPage}</small>
            </button>
          ))}
        {tab === "hizbs" &&
          hizbs.map((h) => (
            <button
              key={h.number}
              type="button"
              className="km-sidebar__item"
              onClick={() => go(() => mushaf.goToHizb(h.number))}
            >
              <span>الحزب {h.number}</span>
              <small>يبدأ من ص {h.startPage}</small>
            </button>
          ))}
        {tab === "quarters" &&
          quarters.map((q) => (
            <button
              key={q.number}
              type="button"
              className="km-sidebar__item"
              onClick={() => go(() => mushaf.goToQuarter(q.number))}
            >
              <span>الربع {q.number}</span>
              <small>ج{q.juz} · ح{q.hizb} · ص {q.startPage}</small>
            </button>
          ))}
        {tab === "pages" &&
          pages.map((p) => (
            <button
              key={p.page}
              type="button"
              className={`km-sidebar__item${p.page === mushaf.page ? " is-current" : ""}`}
              onClick={() => go(() => mushaf.setPage(p.page))}
            >
              <span>صفحة {p.page}</span>
              <small>{p.surahName} · جزء {p.juz}</small>
            </button>
          ))}
        {tab === "bookmarks" && (
          mushaf.bookmarks.length === 0 ? (
            <p className="km-sidebar__empty">لا توجد علامات مرجعية بعد</p>
          ) : (
            mushaf.bookmarks.map((b: MushafBookmark) => (
              <div key={b.id} className="km-sidebar__bookmark">
                <button type="button" className="km-sidebar__item" onClick={() => go(() => mushaf.setPage(b.page))}>
                  <span>{b.label}</span>
                  <small>صفحة {b.page}</small>
                </button>
                <button
                  type="button"
                  className="km-sidebar__remove"
                  aria-label="حذف العلامة"
                  onClick={() => mushaf.removeBookmark(b.id)}
                >
                  ×
                </button>
              </div>
            ))
          )
        )}
        {tab === "history" && (
          mushaf.readHistory.length === 0 ? (
            <p className="km-sidebar__empty">لا يوجد سجل قراءة بعد</p>
          ) : (
            mushaf.readHistory.map((h) => (
              <button
                key={`${h.page}-${h.at}`}
                type="button"
                className={`km-sidebar__item${h.page === mushaf.page ? " is-current" : ""}`}
                onClick={() => go(() => mushaf.setPage(h.page))}
              >
                <span>صفحة {h.page}</span>
                <small>{new Date(h.at).toLocaleString("ar-KW")}</small>
              </button>
            ))
          )
        )}
      </div>
    </aside>
  );
}
