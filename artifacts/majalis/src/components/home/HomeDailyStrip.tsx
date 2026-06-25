import { Link } from "wouter";
import { HomeDailyHadith } from "./HomeDailyHadith";
import { HomeDailyAyah } from "./HomeDailyAyah";
import { HomeDailyFaida } from "./HomeDailyFaida";

export function HomeDailyStrip() {
  return (
    <section className="home-section home-daily-strip" aria-labelledby="daily-strip-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-strip-heading">آية • حديث • فائدة</h2>
          <p className="home-daily-strip-lead">محتوى يومي منظم يتجدد تلقائيًا كل يوم.</p>
        </div>
        <Link href="/adhkar" className="home-section-link">الأذكار</Link>
      </div>
      <div className="home-daily-grid">
        <HomeDailyAyah />
        <HomeDailyHadith />
        <HomeDailyFaida />
      </div>
    </section>
  );
}

export default HomeDailyStrip;
