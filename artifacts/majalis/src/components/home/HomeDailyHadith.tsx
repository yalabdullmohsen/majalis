import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getDailyHadithRotated } from "@/lib/content-library/loader";
import { DAILY_HADITH_POOL, getDailyHadith, type DailyHadithEntry } from "@/lib/daily-content";
import { DailyContentActions } from "@/components/daily/DailyContentActions";

export function HomeDailyHadith() {
  const [hadith, setHadith] = useState<DailyHadithEntry>(() => getDailyHadith());

  useEffect(() => {
    getDailyHadithRotated().then(setHadith).catch(() => setHadith(DAILY_HADITH_POOL[0]));
  }, []);

  return (
    <section className="home-section home-daily-single" aria-labelledby="daily-hadith-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-hadith-heading">حديث اليوم</h2>
        </div>
        <Link href="/hadith" className="home-section-link">مكتبة الأحاديث</Link>
      </div>
      <article className="ui-card home-daily-card home-daily-card--hadith">
        <blockquote className="home-daily-quote">{hadith.text}</blockquote>
        <p className="home-daily-meta"><strong>الراوي:</strong> {hadith.narrator}</p>
        <p className="home-daily-meta">
          <strong>المصدر:</strong> {hadith.source}
          {hadith.grade ? ` — ${hadith.grade}` : ""}
        </p>
        {hadith.meaning && <p className="home-daily-meaning">{hadith.meaning}</p>}
        <DailyContentActions
          title="حديث اليوم — المجلس العلمي"
          text={hadith.text}
          source={`${hadith.source}${hadith.grade ? ` (${hadith.grade})` : ""} — ${hadith.narrator}`}
          storageKey={`hadith-${hadith.id}`}
        />
      </article>
    </section>
  );
}

export default HomeDailyHadith;
