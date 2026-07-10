import { useMemo, useState } from "react";
import type { SurahSummary } from "@/lib/quran-api";
import { arabicMatchAny } from "@/lib/arabic-search";

type Props = {
  surahs: SurahSummary[];
  currentSurah: number;
  onSelect: (n: number) => void;
  onClose?: () => void;
};

export function SurahList({ surahs, currentSurah, onSelect, onClose }: Props) {
  const [q, setQ] = useState("");

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
    <div className="qs-surah-list" role="navigation" aria-label="فهرس السور">
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
      <ol className="qs-surah-items" role="list">
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
    </div>
  );
}
