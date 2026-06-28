import { useMemo, useState } from "react";
import {
  getHizbList,
  getJuzList,
  getQuarterList,
  searchSurahs,
  type MushafBookmark,
} from "@/lib/mushaf";

type Props = {
  currentPage: number;
  bookmarks: MushafBookmark[];
  onSelectPage: (page: number) => void;
  onClose: () => void;
};

type Tab = "surah" | "juz" | "hizb" | "quarter" | "bookmarks";

export function MushafIndexPanel({ currentPage, bookmarks, onSelectPage, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("surah");
  const [query, setQuery] = useState("");

  const surahs = useMemo(() => searchSurahs(query), [query]);
  const juzList = useMemo(() => getJuzList(), []);
  const hizbList = useMemo(() => getHizbList(), []);
  const quarterList = useMemo(() => getQuarterList(), []);

  return (
    <div className="mushaf-index ui-card" role="dialog" aria-label="فهرس المصحف">
      <div className="mushaf-index__head">
        <strong>فهرس المصحف</strong>
        <button type="button" className="mushaf-index__close" onClick={onClose} aria-label="إغلاق">×</button>
      </div>

      <div className="mushaf-index__tabs" role="tablist">
        {([
          ["surah", "السور"],
          ["juz", "الأجزاء"],
          ["hizb", "الأحزاب"],
          ["quarter", "الأرباع"],
          ["bookmarks", "العلامات"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`mushaf-index__tab${tab === id ? " is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "surah" && (
        <input
          className="mushaf-index__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن سورة..."
          aria-label="بحث عن سورة"
        />
      )}

      <div className="mushaf-index__list" role="tabpanel">
        {tab === "surah" && surahs.map((s) => (
          <button
            key={s.number}
            type="button"
            className={`mushaf-index__item${s.startPage === currentPage ? " is-current" : ""}`}
            onClick={() => onSelectPage(s.startPage)}
          >
            <span>{s.number}. {s.name}</span>
            <small>ص {s.startPage}</small>
          </button>
        ))}

        {tab === "juz" && juzList.map((j) => (
          <button
            key={j.number}
            type="button"
            className={`mushaf-index__item${j.startPage === currentPage ? " is-current" : ""}`}
            onClick={() => onSelectPage(j.startPage)}
          >
            <span>{j.label}</span>
            <small>ص {j.startPage}</small>
          </button>
        ))}

        {tab === "hizb" && hizbList.map((h) => (
          <button
            key={`${h.number}-${h.quarter}`}
            type="button"
            className={`mushaf-index__item${h.startPage === currentPage ? " is-current" : ""}`}
            onClick={() => onSelectPage(h.startPage)}
          >
            <span>{h.label}</span>
            <small>ص {h.startPage}</small>
          </button>
        ))}

        {tab === "quarter" && quarterList.map((q) => (
          <button
            key={q.number}
            type="button"
            className={`mushaf-index__item${q.startPage === currentPage ? " is-current" : ""}`}
            onClick={() => onSelectPage(q.startPage)}
          >
            <span>{q.label}</span>
            <small>ص {q.startPage}</small>
          </button>
        ))}

        {tab === "bookmarks" && (
          bookmarks.length ? bookmarks.map((b) => (
            <button
              key={`${b.page}-${b.createdAt}`}
              type="button"
              className={`mushaf-index__item${b.page === currentPage ? " is-current" : ""}`}
              onClick={() => onSelectPage(b.page)}
            >
              <span>{b.label}</span>
              <small>ص {b.page}</small>
            </button>
          )) : (
            <p className="mushaf-index__empty">لا توجد علامات مرجعية بعد</p>
          )
        )}
      </div>
    </div>
  );
}

export default MushafIndexPanel;
