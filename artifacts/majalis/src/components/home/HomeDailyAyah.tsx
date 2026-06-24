import { DAILY_AYAH } from "@/lib/home-content";

export function HomeDailyAyah() {
  return (
    <section className="home-section" aria-labelledby="daily-ayah-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-ayah-heading">آية ومعنى</h2>
        </div>
      </div>
      <article className="ui-card home-daily-card home-daily-card--ayah">
        <p className="home-ayah-text">{DAILY_AYAH.text}</p>
        <p className="home-daily-meta">
          <strong>{DAILY_AYAH.surah}</strong> — الآية {DAILY_AYAH.ayahNumber}
        </p>
        <p className="home-daily-meaning">{DAILY_AYAH.meaning}</p>
      </article>
    </section>
  );
}
