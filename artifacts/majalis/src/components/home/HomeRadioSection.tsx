import { Link } from "wouter";
import { Radio } from "lucide-react";
import { QURAN_RADIO_STATIONS } from "@/lib/quran-radio-stations";

export function HomeRadioSection() {
  const featured = QURAN_RADIO_STATIONS.slice(0, 3);

  return (
    <section className="home-section" aria-labelledby="home-radio-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الاستماع</p>
          <h2 id="home-radio-heading">إذاعة القرآن</h2>
          <p>بث مباشر لقرّاء مختارين.</p>
        </div>
        <Link href="/quran-radio" className="home-section-link">كل الإذاعات</Link>
      </div>
      <div className="home-hub-grid">
        {featured.map((station) => (
          <Link
            key={station.id}
            href="/quran-radio"
            className="home-hub-card ui-card home-hub-card--radio"
          >
            <Radio size={18} aria-hidden="true" />
            <strong>{station.reciterName}</strong>
            <span>{station.readingType}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeRadioSection;
