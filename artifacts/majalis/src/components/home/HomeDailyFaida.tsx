import { Link } from "wouter";
import { getDailyFaida } from "@/lib/daily-content";
import { displayText } from "@/lib/display-text";

export function HomeDailyFaida() {
  const faida = getDailyFaida();

  return (
    <article className="ui-card home-daily-card home-daily-card--faida">
      <p className="home-daily-label">فائدة اليوم</p>
      {faida.category && <span className="page-tag">{faida.category}</span>}
      <p className="home-daily-faida-text">{displayText(faida.text)}</p>
      {(faida.source || faida.author_name) && (
        <p className="home-daily-meta">
          {faida.source && <span>{faida.source}</span>}
          {faida.author_name && <span>{faida.author_name}</span>}
        </p>
      )}
      <Link href="/fawaid" className="home-daily-link">المزيد من الفوائد</Link>
    </article>
  );
}

export default HomeDailyFaida;
