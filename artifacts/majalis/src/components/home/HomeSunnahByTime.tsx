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
        <div>
          <p className="home-eyebrow">حسب وقتك</p>
          <h2 id="sunnah-time-heading">سنن الوقت الحالي</h2>
          <p className="home-sunnah-card__period">{loading ? "..." : period.title}</p>
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
