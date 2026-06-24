import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { getQuranSurahs } from "@/lib/platform-api";

export default function QuranPage() {
  const [term, setTerm] = useState("");
  const surahs = getQuranSurahs();

  const filtered = useMemo(() => {
    const q = term.trim();
    if (!q) return surahs;
    return surahs.filter((s) => s.name.includes(q) || String(s.number).includes(q));
  }, [surahs, term]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="القرآن"
        title="القرآن الكريم"
        subtitle="عرض السور والبحث — التفسير المختصر والتلاوات لاحقاً."
      />
      <input
        className="page-search-input"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="ابحث عن سورة..."
      />
      <div className="quran-grid">
        {filtered.map((s) => (
          <article key={s.number} className="ui-card quran-surah-card">
            <span className="quran-number">{s.number}</span>
            <h3>{s.name}</h3>
            <p>{s.ayahs} آية</p>
            <p className="quran-tafsir-note">تفسير مختصر — قريباً</p>
          </article>
        ))}
      </div>
    </div>
  );
}
