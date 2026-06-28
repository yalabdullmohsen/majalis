import { useMemo } from "react";
import type { MushafPageData } from "@/lib/mushaf";

type Props = {
  data: MushafPageData;
  zoom: number;
};

export function MushafPageView({ data, zoom }: Props) {
  const grouped = useMemo(() => {
    const groups: { surahNumber: number; surahName: string; ayahs: typeof data.ayahs }[] = [];
    for (const ayah of data.ayahs) {
      const last = groups[groups.length - 1];
      if (last && last.surahNumber === ayah.surahNumber) {
        last.ayahs.push(ayah);
      } else {
        groups.push({ surahNumber: ayah.surahNumber, surahName: ayah.surahName, ayahs: [ayah] });
      }
    }
    return groups;
  }, [data.ayahs]);

  const juz = data.ayahs[0]?.juz;
  const hizbQuarter = data.ayahs[0]?.hizbQuarter;

  return (
    <article
      className="mushaf-page-view ui-card"
      style={{ fontSize: `${zoom}%` }}
      aria-label={`صفحة ${data.number}`}
    >
      <header className="mushaf-page-view__head">
        <span>صفحة {data.number}</span>
        {juz && <span>الجزء {juz}</span>}
        {hizbQuarter && <span>الربع {hizbQuarter}</span>}
      </header>

      <div className="mushaf-page-view__body">
        {grouped.map((group) => (
          <section key={`${group.surahNumber}-${group.ayahs[0]?.number}`} className="mushaf-page-view__surah">
            {group.ayahs[0]?.numberInSurah === 1 && group.surahNumber !== 1 && group.surahNumber !== 9 && (
              <p className="mushaf-page-view__bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            )}
            {group.ayahs[0]?.numberInSurah === 1 && (
              <h2 className="mushaf-page-view__surah-name">{group.surahName}</h2>
            )}
            <p className="mushaf-page-view__ayahs">
              {group.ayahs.map((a, i) => (
                <span key={a.number} className="mushaf-page-view__ayah">
                  {a.text}
                  <span className="mushaf-page-view__ayah-num" aria-label={`آية ${a.numberInSurah}`}>
                    ﴿{a.numberInSurah}﴾
                  </span>
                  {i < group.ayahs.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          </section>
        ))}
      </div>

      <footer className="mushaf-page-view__foot">
        <span>{data.number}</span>
      </footer>
    </article>
  );
}

export default MushafPageView;
