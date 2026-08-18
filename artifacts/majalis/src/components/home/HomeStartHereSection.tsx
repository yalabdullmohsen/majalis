import { Link } from "wouter";
import { HOME_START_HERE_COPY, HOME_START_HERE_STEPS } from "./home-start-here-data";

const START_STEPS = HOME_START_HERE_STEPS;

export function HomeStartHereSection() {
  return (
    <section aria-label="ابدأ من هنا" className="home-start-here">
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
      <ol className="hsh-steps">
        {START_STEPS.map((s) => (
          <li key={s.num} className="hsh-step">
            <span className="hsh-step__num" aria-hidden="true">{s.num}</span>
            <div className="hsh-step__body">
              <strong className="hsh-step__title">{s.title}</strong>
              <p className="hsh-step__desc">{s.desc}</p>
              <Link href={s.href} className="hsh-step__cta">{s.cta} ←</Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
