import { getDailyHadith } from "@/lib/daily-content";

export function HomeDailyHadith() {
  const hadith = getDailyHadith();

  return (
    <article className="ui-card home-daily-card home-daily-card--hadith">
      <p className="home-daily-label">حديث اليوم</p>
      <blockquote className="home-daily-quote">{hadith.text}</blockquote>
      <p className="home-daily-meta"><strong>الراوي:</strong> {hadith.narrator}</p>
      <p className="home-daily-meta"><strong>المصدر:</strong> {hadith.source}{hadith.grade ? ` — ${hadith.grade}` : ""}</p>
      <p className="home-daily-meaning">{hadith.meaning}</p>
    </article>
  );
}

export default HomeDailyHadith;
