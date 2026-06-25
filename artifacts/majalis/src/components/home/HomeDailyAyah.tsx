import { getDailyAyah } from "@/lib/daily-content";

export function HomeDailyAyah() {
  const ayah = getDailyAyah();

  return (
    <article className="ui-card home-daily-card home-daily-card--ayah">
          <p className="home-daily-label">آية اليوم ومعناها</p>
      <p className="home-ayah-text">{ayah.text}</p>
      <p className="home-daily-meta">
        <strong>{ayah.surah}</strong> — الآية {ayah.ayahNumber}
      </p>
      <p className="home-daily-meta"><strong>المرجع:</strong> {ayah.reference}</p>
      <p className="home-daily-meaning">{ayah.meaning}</p>
    </article>
  );
}

export default HomeDailyAyah;
