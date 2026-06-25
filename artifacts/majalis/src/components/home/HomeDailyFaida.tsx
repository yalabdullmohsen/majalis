import { Link } from "wouter";
import { getDailyFaida } from "@/lib/daily-content";
import { displayText } from "@/lib/display-text";

export function HomeDailyFaida() {
  const faida = getDailyFaida();

  return (
    <section className="home-section home-daily-single" aria-labelledby="daily-faida-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-faida-heading">فائدة اليوم</h2>
        </div>
        <Link href="/fawaid" className="home-section-link">المزيد من الفوائد</Link>
      </div>
      <article className="ui-card home-daily-card home-daily-card--faida">
        {faida.category && <span className="page-tag">{faida.category}</span>}
        <p className="home-daily-faida-text">{displayText(faida.text)}</p>
        {(faida.source || faida.author_name) && (
          <p className="home-daily-meta">
            {faida.source && <span>{faida.source}</span>}
            {faida.author_name && <span>{faida.author_name}</span>}
          </p>
        )}
      </article>
    </section>
  );
}

export default HomeDailyFaida;
