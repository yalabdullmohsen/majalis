import { Link } from "wouter";
import { LIVE_STREAM_CHANNELS } from "@/lib/quran-live-streams";

export function HomeLiveSection() {
  return (
    <section className="home-section" aria-labelledby="home-live-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">البث</p>
          <h2 id="home-live-heading">البث المباشر</h2>
          <p>قنوات قرآن وسنة مباشرة.</p>
        </div>
        <Link href="/quran-live" className="home-section-link">كل القنوات</Link>
      </div>
      <div className="home-hub-grid">
        {LIVE_STREAM_CHANNELS.map((channel) => (
          <Link
            key={channel.id}
            href="/quran-live"
            className="home-hub-card ui-card home-hub-card--live"
          >
            <img src={channel.poster} alt="" width={40} height={40} className="home-hub-card__icon" />
            <strong>{channel.name}</strong>
            <span>{channel.quality}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeLiveSection;
