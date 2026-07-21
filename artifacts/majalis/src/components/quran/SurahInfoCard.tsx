import { Link } from "wouter";
import type { StaticSurahMeta } from "@/lib/quran-api";
import { MakkiMadaniBadge } from "./MakkiMadaniBadge";

export function SurahInfoCard({ surah }: { surah: StaticSurahMeta }) {
  return (
    <article className="surah-info-card ds-card">
      <span className="surah-info-card__number" aria-label={`ترتيب السورة ${surah.number}`}>{surah.number}</span>
      <div className="surah-info-card__body">
        <h2>{surah.name}</h2>
        <p>{surah.ayahs} آية وفق عدّ المصحف المعتمد في التطبيق</p>
        <div className="surah-info-card__meta">
          <MakkiMadaniBadge revelation={surah.revelation} />
          <span>التصنيف المشهور في فهرس المصحف</span>
        </div>
      </div>
      <Link href={`/quran?surah=${surah.number}`} className="surah-info-card__link">قراءة السورة</Link>
    </article>
  );
}
