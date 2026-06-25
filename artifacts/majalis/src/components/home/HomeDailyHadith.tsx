import { Link } from "wouter";
import { getDailyHadith } from "@/lib/daily-content";

export function HomeDailyHadith() {
  const hadith = getDailyHadith();

  return (
    <section className="home-section home-daily-single" aria-labelledby="daily-hadith-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-hadith-heading">حديث اليوم</h2>
        </div>
        <Link href="/adhkar" className="home-section-link">المزيد</Link>
      </div>
      <article className="ui-card home-daily-card home-daily-card--hadith">
        <blockquote className="home-daily-quote">{hadith.text}</blockquote>
        <p className="home-daily-meta"><strong>الراوي:</strong> {hadith.narrator}</p>
        <p className="home-daily-meta"><strong>المصدر:</strong> {hadith.source}{hadith.grade ? ` — ${hadith.grade}` : ""}</p>
        <p className="home-daily-meaning">{hadith.meaning}</p>
      </article>
    </section>
  );
}

export default HomeDailyHadith;
