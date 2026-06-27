import { Link } from "wouter";
import type { SurahCardInfo } from "@/lib/quran-index";

type Props = {
  surah: SurahCardInfo;
};

export function SurahCard({ surah }: Props) {
  return (
    <Link href={`/quran/surah/${surah.number}`} className="quran-surah-card ui-card">
      <div className="quran-surah-card__num">{surah.number}</div>
      <div className="quran-surah-card__body">
        <h3 className="quran-surah-card__name">{surah.name}</h3>
        <p className="quran-surah-card__meta">
          {surah.ayahs} آية · {surah.revelation} · جزء {surah.juz} · حزب {surah.hizb}
        </p>
        <p className="quran-surah-card__time">≈ {surah.readMinutes} د</p>
      </div>
    </Link>
  );
}
