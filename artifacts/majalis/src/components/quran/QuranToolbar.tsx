import { Link } from "wouter";

type Props = {
  surahSearch: string;
  onSurahSearch: (v: string) => void;
  onJumpAyah: (n: number) => void;
  maxAyah: number;
  targetAyah: number;
};

/** Navigation-only toolbar — reading preferences live in /settings */
export function QuranToolbar({
  surahSearch,
  onSurahSearch,
  onJumpAyah,
  maxAyah,
  targetAyah,
}: Props) {
  return (
    <section className="quran-v2-toolbar ui-card" aria-label="بحث وانتقال">
      <div className="quran-v2-toolbar__search-row">
        <input
          type="search"
          className="quran-v2-toolbar__search ds-input"
          placeholder="بحث سورة..."
          value={surahSearch}
          onChange={(e) => onSurahSearch(e.target.value)}
          aria-label="بحث"
        />
        <label className="quran-v2-toolbar__jump">
          <span>آية</span>
          <input
            type="number"
            className="ds-input"
            min={1}
            max={maxAyah}
            value={targetAyah}
            onChange={(e) => onJumpAyah(Number(e.target.value) || 1)}
            aria-label="الانتقال إلى آية"
          />
        </label>
        <Link href="/settings" className="quran-v2-toolbar__settings-link">
          إعدادات القراءة
        </Link>
      </div>
    </section>
  );
}
