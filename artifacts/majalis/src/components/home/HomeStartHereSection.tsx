import { Link } from "wouter";
import { HOME_START_HERE_COPY } from "./home-start-here-data";

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
    </section>
  );
}
