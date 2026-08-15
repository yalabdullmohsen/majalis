import "./QuranPage.css";

const AYATS: ReadonlyArray<{ n: string; text: string }> = [
  { n: "١", text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" },
  { n: "٢", text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ" },
  { n: "٣", text: "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ" },
  { n: "٤", text: "مَٰلِكِ يَوْمِ ٱلدِّينِ" },
  { n: "٥", text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ" },
  { n: "٦", text: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ" },
  {
    n: "٧",
    text: "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
  },
];

/**
 * صفحة قراءة بنمط ورق المدينة (سورة الفاتحة — عرض تجريبي).
 * المصحف الرسمي يبقى على `/mushaf` (QPC).
 */
export default function QuranPage() {
  return (
    <main className="qp-madinah" dir="rtl" lang="ar">
      <div className="qp-madinah__page">
        <header className="qp-madinah__header">
          <span className="qp-madinah__header-surah">سُورَةُ الْفَاتِحَةِ</span>
          <span className="qp-madinah__header-juz">الجزء ١</span>
        </header>

        <section className="qp-madinah__surah-frame" aria-label="عنوان السورة">
          <h1 className="qp-madinah__surah-title">سُورَةُ الْفَاتِحَةِ</h1>
        </section>

        <article className="qp-madinah__ayahs">
          {AYATS.map((ayah) => (
            <p key={ayah.n} className="qp-madinah__ayah">
              <span className="qp-madinah__ayah-text">{ayah.text}</span>
              <span className="qp-madinah__ayah-number" aria-label={`آية ${ayah.n}`}>
                {ayah.n}
              </span>
            </p>
          ))}
        </article>

        <footer className="qp-madinah__footer">
          <span className="qp-madinah__page-number" aria-label="صفحة 1">
            ١
          </span>
        </footer>
      </div>
    </main>
  );
}
