import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getDailyAyahRotated } from "@/lib/content-library/loader";
import { getDailyAyah, type DailyAyahEntry } from "@/lib/daily-content";
import { DailyContentActions } from "@/components/daily/DailyContentActions";

export function HomeDailyAyah() {
  const [ayah, setAyah] = useState<DailyAyahEntry>(() => getDailyAyah());

  useEffect(() => {
    getDailyAyahRotated().then(setAyah).catch(() => setAyah(getDailyAyah()));
  }, []);

  return (
    <section className="home-section home-daily-single" aria-labelledby="daily-ayah-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-ayah-heading">آية اليوم</h2>
        </div>
        <Link href="/quran" className="home-section-link">المصحف</Link>
      </div>
      <article className="ui-card home-daily-card home-daily-card--ayah">
        <blockquote className="home-daily-quote home-ayah-text">{ayah.text}</blockquote>
        <p className="home-daily-meta">
          <strong>{ayah.surah}</strong> — آية {ayah.ayahNumber}
        </p>
        <p className="home-daily-meta">{ayah.reference}</p>
        {ayah.meaning && <p className="home-daily-meaning">{ayah.meaning}</p>}
        <DailyContentActions
          title="آية اليوم — المجلس العلمي"
          text={ayah.text}
          source={ayah.reference}
          storageKey={`ayah-${ayah.id}`}
        />
      </article>
    </section>
  );
}

export default HomeDailyAyah;
