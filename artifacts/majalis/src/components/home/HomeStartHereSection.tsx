import { Link } from "wouter";
import { HOME_START_HERE_COPY, HOME_START_HERE_STEPS } from "./home-start-here-data";

/**
 * بطاقة الزائر الجديد — صفوف بسيطة بلا Card-in-Card.
 * الألوان من توكنات الثيم (الليلي عبر dark-mode-recovery).
 */
export function HomeStartHereSection() {
  return (
    <section aria-label="ابدأ من هنا" className="home-start-here home-start-here--compact">
      <div className="hsh-header">
        <span className="hsh-eyebrow">{HOME_START_HERE_COPY.eyebrow}</span>
        <h2 className="hsh-title">{HOME_START_HERE_COPY.title}</h2>
        <p className="hsh-lead">{HOME_START_HERE_COPY.lead}</p>
        <div className="hsh-actions">
          <Link href="/lessons" className="hsh-actions__primary">
            {HOME_START_HERE_COPY.primaryCta}
          </Link>
          <Link href="/adab-talab-ilm" className="hsh-actions__secondary">
            {HOME_START_HERE_COPY.secondaryCta}
          </Link>
        </div>
      </div>
      <ol className="hsh-steps hsh-steps--rows">
        {HOME_START_HERE_STEPS.map((s) => (
          <li key={s.num} className="hsh-step">
            <span className="hsh-step__num" aria-hidden="true">
              {s.num}
            </span>
            <div className="hsh-step__body">
              <strong className="hsh-step__title">{s.title}</strong>
              <p className="hsh-step__desc">{s.desc}</p>
            </div>
            <Link href={s.href} className="hsh-step__cta" aria-label={s.cta}>
              <span aria-hidden="true">←</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
