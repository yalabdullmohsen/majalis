import { Link } from "wouter";
import { getDailyDhikr } from "@/lib/daily-content";
import { displayText } from "@/lib/display-text";

export function HomeDailyDhikr() {
  const dhikr = getDailyDhikr();

  return (
    <section className="home-section home-daily-single" aria-labelledby="daily-dhikr-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-dhikr-heading">ذكر اليوم</h2>
        </div>
        <Link href="/adhkar" className="home-section-link">الأذكار</Link>
      </div>
      <article className="ui-card home-daily-card home-daily-card--dhikr">
        {dhikr.category && <span className="page-tag">{dhikr.category}</span>}
        <p className="home-daily-faida-text">{displayText(dhikr.text)}</p>
        {dhikr.source && <p className="home-daily-meta">{dhikr.source}</p>}
      </article>
    </section>
  );
}

export default HomeDailyDhikr;
