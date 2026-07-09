import { Link } from "wouter";
import { fetchPrayerTimes, computePrayerCountdown } from "@/lib/prayer-times";
import { useEffect, useState } from "react";

const OBLIGATORY_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export function HomeHeroBanner() {
  const [nextPrayer, setNextPrayer] = useState<string>("");

  useEffect(() => {
    fetchPrayerTimes()
      .then((t) => {
        const cd = computePrayerCountdown(t.prayers);
        if (!cd.next) return;
        if (cd.sinceSeconds != null && cd.graceNextHms) {
          // أثناء فترة السماح: أظهر الصلاة التالية الفعلية
          const obligatory = t.prayers.filter((p) => OBLIGATORY_KEYS.includes(p.key));
          const ranIdx = obligatory.findIndex((p) => p.key === cd.next?.key);
          const actualNext = ranIdx >= 0 ? obligatory[(ranIdx + 1) % obligatory.length] : null;
          if (actualNext) setNextPrayer(`${actualNext.name} بعد ${cd.graceNextHms}`);
        } else {
          setNextPrayer(`${cd.next.name} بعد ${cd.remainingLabel}`);
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
