import { getDailyAyah } from "@/lib/daily-content";

export function HomeDailyAyah() {
  const ayah = getDailyAyah();
  return (
    <section className="home-section" aria-labelledby="daily-ayah-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-ayah-heading">آية ومعنى</h2>
        </div>
      </div>
      <article className="ui-card home-daily-card home-daily-card--ayah">
        <p className="home-ayah-text">{ayah.text}</p>
        <p className="home-daily-meta">
          <strong>{ayah.surah}</strong> — الآية {ayah.ayahNumber}
        </p>
        <p className="home-daily-meaning">{ayah.meaning}</p>
      </article>
    </section>
  );
}
