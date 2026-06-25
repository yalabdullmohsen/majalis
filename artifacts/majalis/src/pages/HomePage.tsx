import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { getApprovedFawaid, getQaQuestions } from "@/lib/supabase";
import { DEMO_QA } from "@/lib/demo-content";
import { Loading } from "@/components/ui-common";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyHadith } from "@/components/home/HomeDailyHadith";
import { HomeDailyAyah } from "@/components/home/HomeDailyAyah";
import { HomeDailyFaid } from "@/components/home/HomeDailyFaid";
import { HomeKuwaitLessons } from "@/components/home/HomeKuwaitLessons";
import { HomeSheikhs } from "@/components/home/HomeSheikhs";
import { HomeCategories } from "@/components/home/HomeCategories";
import { HomeLatest } from "@/components/home/HomeLatest";
import { HomeStats } from "@/components/home/HomeStats";

function SectionHead({ eyebrow, title, subtitle, href }: { eyebrow: string; title: string; subtitle?: string; href?: string }) {
  return (
    <div className="home-section-head">
      <div>
        <p className="home-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="home-section-link">
          عرض الكل
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [qa, setQa] = useState<any[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    Promise.all([getApprovedFawaid(), getQaQuestions()])
      .then(([f, q]) => {
        setFawaid(f.data || []);
        setQa(q.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayedQa = (qa.length ? qa : DEMO_QA).slice(0, 2);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div className="home-page">
      <section className="home-hero home-hero--launch">
        <div className="home-hero-pattern" />
        <div className="home-container home-hero-grid home-hero-grid--compact">
          <div className="home-hero-copy">
            <div className="home-hero-brand">
              <img src="/logo.png" alt="المجلس العلمي" className="home-hero-logo" />
              <p className="home-kicker">المنصة العلمية الشرعية</p>
            </div>
            <h1 className="home-hero-title">المجلس العلمي</h1>
            <p className="home-hero-lead">
              دروس وفوائد وأذكار وأسئلة علمية في منصة واحدة هادئة ومنظمة.
            </p>
            <form onSubmit={submitSearch} className="home-search" aria-label="البحث في المنصة">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، فائدة، ذكر، سؤال..."
              />
              <button type="submit">بحث</button>
            </form>
            <div className="home-hero-actions">
              <Link href="/lessons" className="home-primary-action">
                استعرض الدروس
              </Link>
              <Link href="/adhkar" className="home-secondary-action">
                الأذكار
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="home-container home-main">
        <HomePrayerTimes />
        <HomeKuwaitLessons />
        <HomeDailyFaid />
        <HomeDailyHadith />
        <HomeDailyAyah />

        {loading && <Loading />}

        <section className="home-section">
          <SectionHead eyebrow="إجابات موثقة" title="الأسئلة والأجوبة" href="/qa" />
          <div className="home-qa-grid">
            {displayedQa.map((item: any) => (
              <Link key={item.id} href="/qa" className="ui-card home-qa-card">
                <span>{item.qa_categories?.name || "سؤال وجواب"}</span>
                <h3>{item.question}</h3>
              </Link>
            ))}
          </div>
        </section>

        <HomeSheikhs />
        <HomeCategories />
        <HomeLatest />
        <HomeStats />
      </main>
    </div>
  );
}
