import { getDailyHadith } from "@/lib/daily-content";

export function HomeDailyHadith() {
  const hadith = getDailyHadith();
  return (
    <section className="home-section" aria-labelledby="daily-hadith-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-hadith-heading">حديث اليوم</h2>
        </div>
      </div>
      <article className="ui-card home-daily-card">
        <blockquote className="home-daily-quote">{hadith.text}</blockquote>
        <p className="home-daily-meta"><strong>الراوي:</strong> {hadith.narrator}</p>
        <p className="home-daily-meta"><strong>المصدر:</strong> {hadith.source}</p>
        <p className="home-daily-meaning">{hadith.meaning}</p>
      </article>
    </section>
  );
}
