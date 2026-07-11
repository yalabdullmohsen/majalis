import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getCurrentSunnahPeriod, getLocalSunnahPeriod, type SunnahPeriod } from "@/lib/sunnah-by-time";

export function HomeSunnahByTime() {
  const [period, setPeriod] = useState<SunnahPeriod>(getLocalSunnahPeriod());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSunnahPeriod()
      .then((p) => setPeriod(p))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-sunnah-card ui-card" aria-labelledby="sunnah-time-heading">
      <div className="home-sunnah-card__head">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.45rem" }}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" style={{ marginTop: "0.2rem", flexShrink: 0 }}>
            <polygon points="8,1 10,6 15.5,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0.5,6 6,6" fill="#1F4D3A" opacity="0.7"/>
          </svg>
          <div>
            <p className="home-eyebrow">حسب وقتك</p>
            <h2 id="sunnah-time-heading">سنن الوقت الحالي</h2>
            <p className="home-sunnah-card__period">{loading ? "..." : period.title}</p>
          </div>
        </div>
      </div>
      <ul className="home-sunnah-card__list">
        {period.suggestions.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="home-sunnah-card__link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default HomeSunnahByTime;
