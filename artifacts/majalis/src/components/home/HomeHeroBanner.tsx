import { Link } from "wouter";
import { fetchPrayerTimes, computePrayerStatus } from "@/lib/prayer-times";
import { useEffect, useState } from "react";

export function HomeHeroBanner() {
  const [nextPrayer, setNextPrayer] = useState<string>("");

  useEffect(() => {
    fetchPrayerTimes()
      .then((t) => {
        const status = computePrayerStatus(t.prayers);
        if (status.next) {
          setNextPrayer(`${status.next.name} بعد ${status.remainingLabel}`);
        }
      })
      .catch(() => setNextPrayer(""));
  }, []);

  return (
    <section className="home-banner ui-card" aria-label="بانر المجلس العلمي">
      <div className="home-banner__copy">
        <p className="home-kicker">منصتك العلمية اليومية</p>
        <h2 className="home-banner__title">طلب العلم والعبادة في مكان واحد</h2>
        <p className="home-banner__lead">
          دروس، القرآن، أذكار، مواقيت، ومناسبات. تجربة بسيطة وسريعة.
        </p>
        {nextPrayer && <p className="home-banner__prayer">{nextPrayer}</p>}
        <div className="home-banner__actions">
          <Link href="/lessons" className="home-banner__btn home-banner__btn--primary">الدروس</Link>
          <Link href="/quran" className="home-banner__btn home-banner__btn--secondary">القرآن</Link>
        </div>
      </div>
    </section>
  );
}

export default HomeHeroBanner;
