import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { HomeDailyStrip } from "@/components/home/HomeDailyStrip";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";

const QUICK_LINKS = [
  { href: "/lessons", title: "الدروس" },
  { href: "/adhkar", title: "الأذكار" },
  { href: "/fawaid", title: "الفوائد" },
  { href: "/qa", title: "الأسئلة" },
  { href: "/sheikhs", title: "المشايخ" },
  { href: "/assistant", title: "المساعد العلمي" },
];

export default function HomePage() {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div className="home-page home-page--launch">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <section className="home-hero home-hero--compact">
        <div className="home-hero-pattern" />
        <div className="home-container home-hero-grid home-hero-grid--compact">
          <div className="home-hero-copy">
            <div className="home-hero-brand">
              <img src="/logo.png" alt="المجلس العلمي" className="home-hero-logo" />
              <p className="home-kicker">المنصة العلمية الشرعية</p>
            </div>
            <h1 className="home-hero-title">المجلس العلمي</h1>
            <p className="home-hero-lead">
              دروس الكويت، أذكار يومية، وفوائد علمية — في مكان واحد.
            </p>
            <form onSubmit={submitSearch} className="home-search" aria-label="البحث في المنصة">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، ذكر، فائدة..."
              />
              <button type="submit">بحث</button>
            </form>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--launch">
        <HomeUpcomingLessons />
        <HomeDailyStrip />

        <section className="home-section home-quick-links" aria-label="روابط سريعة">
          <div className="home-quick-links-grid">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="ui-card home-quick-link">
                {link.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
