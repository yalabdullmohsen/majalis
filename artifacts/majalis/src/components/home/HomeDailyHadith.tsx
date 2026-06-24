import { DAILY_HADITH } from "@/lib/home-content";

export function HomeDailyHadith() {
  return (
    <section className="home-section" aria-labelledby="daily-hadith-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-hadith-heading">حديث اليوم</h2>
        </div>
      </div>
      <article className="ui-card home-daily-card">
        <blockquote className="home-daily-quote">{DAILY_HADITH.text}</blockquote>
        <p className="home-daily-meta"><strong>الراوي:</strong> {DAILY_HADITH.narrator}</p>
        <p className="home-daily-meta"><strong>المصدر:</strong> {DAILY_HADITH.source}</p>
        <p className="home-daily-meaning">{DAILY_HADITH.meaning}</p>
      </article>
    </section>
  );
}
