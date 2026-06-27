import { getSurahList } from "@/lib/quran-content";

type Props = {
  surah: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectSurah: (n: number) => void;
};

export function QuranNav({ surah, onPrev, onNext, onSelectSurah }: Props) {
  const list = getSurahList();

  return (
    <nav className="quran-v2-nav ui-card" aria-label="التنقل بين السور">
      <button type="button" className="quran-v2-nav__btn" onClick={onPrev} disabled={surah <= 1}>
        ← السورة السابقة
      </button>
      <select
        className="quran-v2-nav__select"
        value={surah}
        onChange={(e) => onSelectSurah(Number(e.target.value))}
        aria-label="اختيار السورة"
      >
        {list.map((s) => (
          <option key={s.number} value={s.number}>{s.number}. {s.name}</option>
        ))}
      </select>
      <button type="button" className="quran-v2-nav__btn" onClick={onNext} disabled={surah >= 114}>
        السورة التالية →
      </button>
    </nav>
  );
}
