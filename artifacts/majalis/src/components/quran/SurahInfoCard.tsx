import type { SurahMeta } from "@/lib/quran-content";

type Props = {
  meta: SurahMeta;
  stats: { words: number; letters: number; readingMinutes: number };
  lastPos?: { surah: number; ayah?: number } | null;
  onResume?: () => void;
};

export function SurahInfoCard({ meta, stats, lastPos, onResume }: Props) {
  return (
    <section className="quran-v2-info-card ui-card" aria-labelledby="surah-info-title">
      <div className="quran-v2-info-card__header">
        <h2 id="surah-info-title" className="quran-v2-info-card__name">{meta.name}</h2>
        <span className="quran-v2-info-card__badge">{meta.revelation}</span>
      </div>
      <div className="quran-v2-info-grid">
        <div><span className="label">رقم السورة</span><strong>{meta.number}</strong></div>
        <div><span className="label">عدد الآيات</span><strong>{meta.ayahs}</strong></div>
        <div><span className="label">النوع</span><strong>{meta.revelation}</strong></div>
        <div><span className="label">عدد الكلمات</span><strong>{stats.words || "—"}</strong></div>
        <div><span className="label">عدد الحروف</span><strong>{stats.letters || "—"}</strong></div>
        <div><span className="label">وقت القراءة</span><strong>{stats.readingMinutes ? `~${stats.readingMinutes} د` : "—"}</strong></div>
      </div>
      {lastPos && (
        <div className="quran-v2-resume">
          <span>آخر موضع: سورة {lastPos.surah} — آية {lastPos.ayah || 1}</span>
          {onResume && lastPos.surah !== meta.number && (
            <button type="button" className="quran-v2-resume__btn" onClick={onResume}>
              متابعة القراءة
            </button>
          )}
        </div>
      )}
    </section>
  );
}
