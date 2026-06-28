import { Link } from "wouter";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { useState } from "react";
import { useLocation } from "wouter";

export function HomeHeroSection() {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();

  const submit = (q: string) => {
    const v = q.trim();
    if (v) navigate(`/search/${encodeURIComponent(v)}`);
  };

  return (
    <section className="home-v4-hero" aria-label="المجلس العلمي">
      <div className="home-container home-v4-hero__inner">
        <img src="/logo.png" alt="" className="home-v4-hero__logo" width={72} height={72} loading="eager" />
        <h1 className="home-v4-hero__title">المجلس العلمي</h1>
        <p className="home-v4-hero__lead">
          منصة إسلامية معرفية تجمع العلم الشرعي الموثوق — دروس، حلقات قرآن، متون، ومكتبة في واجهة واحدة.
        </p>
        <div className="home-v4-hero__search">
          <SearchSuggestions
            value={term}
            onChange={setTerm}
            onSubmit={submit}
            placeholder="ابحث في الدروس والمتون والحلقات والكتب..."
          />
          <button type="button" className="ds-btn ds-btn--primary" onClick={() => submit(term)}>
            بحث
          </button>
        </div>
        <div className="home-v4-hero__actions">
          <Link href="/lessons" className="ds-btn ds-btn--primary">الدروس</Link>
          <Link href="/quran-circles" className="ds-btn ds-btn--ghost">حلقات القرآن</Link>
          <Link href="/mutoon" className="ds-btn ds-btn--ghost">المتون</Link>
        </div>
      </div>
    </section>
  );
}
