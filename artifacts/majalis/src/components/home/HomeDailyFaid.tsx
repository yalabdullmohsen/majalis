import { Link } from "wouter";
import { getDailyFaid } from "@/lib/daily-content";
import ContentActions from "@/components/ContentActions";

export function HomeDailyFaid() {
  const faid = getDailyFaid();
  if (!faid) return null;

  return (
    <section className="home-section" aria-labelledby="daily-faid-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-faid-heading">فائدة اليوم</h2>
        </div>
        <Link href="/fawaid" className="home-section-link">جميع الفوائد</Link>
      </div>
      <article className="ui-card home-daily-card home-faid-card">
        <p className="home-daily-quote">{faid.text}</p>
        {faid.category && <span className="home-tag">{faid.category}</span>}
        {faid.source && <p className="home-daily-meta"><strong>المصدر:</strong> {faid.source}</p>}
        <ContentActions text={faid.text} title="فائدة اليوم" />
      </article>
    </section>
  );
}
