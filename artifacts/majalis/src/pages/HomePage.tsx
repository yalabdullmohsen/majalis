import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { getMiracles, getApprovedFawaid, getQaQuestions } from "@/lib/supabase";
import { DEMO_QA } from "@/lib/demo-content";
import { displayText } from "@/lib/display-text";
import { Loading } from "@/components/ui-common";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyStrip } from "@/components/home/HomeDailyStrip";
import { HomeKuwaitLessons } from "@/components/home/HomeKuwaitLessons";

const FEATURES = [
  { href: "/lessons", title: "الدروس والدورات", desc: "دروس علمية شرعية موثقة ومعتمدة" },
  { href: "/kuwait-lessons", title: "دروس الكويت", desc: "مرجع شامل للدروس في مساجد الكويت" },
  { href: "/fawaid", title: "الفوائد", desc: "مختارات نافعة من العلم الشرعي" },
  { href: "/adhkar", title: "الأذكار", desc: "أذكار يومية من القرآن والسنة الصحيحة" },
  { href: "/qa", title: "الأسئلة والأجوبة", desc: "أجوبة علمية مدعمة بالأدلة" },
  { href: "/miracles", title: "الإعجاز العلمي", desc: "مقالات موثقة من الكتاب والسنة" },
  { href: "/sheikhs", title: "المشايخ", desc: "دليل العلماء والدعاة المعتمدين" },
];

const FALLBACK_MIRACLES = [
  { id: "fallback-miracle-1", title: "آيات التفكر في خلق السماوات والأرض", source_type: "قرآن", category: "فلك" },
  { id: "fallback-miracle-2", title: "دلائل القدرة في خلق الإنسان", source_type: "قرآن", category: "طب" },
];

const FALLBACK_FAWAID = [
  { id: "fallback-fawaid-1", text: "العلم ميراث النبوة، وكل مجلس علم خطوة إلى بصيرة أوسع.", author_name: "المجلس العلمي" },
  { id: "fallback-fawaid-2", text: "صلاح القلب يبدأ بسؤال صادق واتباع للدليل.", author_name: "فائدة مختارة" },
];

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
  const [miracles, setMiracles] = useState<any[]>([]);
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [qa, setQa] = useState<any[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    setLoading(true);
    Promise.all([getApprovedFawaid(), getMiracles(), getQaQuestions()])
      .then(([f, m, q]) => {
        setFawaid(f.data || []);
        setMiracles(m.data || []);
        setQa(q.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayedMiracles = (miracles.length ? miracles : FALLBACK_MIRACLES).slice(0, 2);
  const displayedFawaid = (fawaid.length ? fawaid : FALLBACK_FAWAID).slice(0, 2);
  const displayedQa = (qa.length ? qa : DEMO_QA).slice(0, 2);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-pattern" />
        <div className="home-container home-hero-grid home-hero-grid--compact">
          <div className="home-hero-copy">
            <div className="home-hero-brand">
              <img src="/logo.png" alt="المجلس العلمي" className="home-hero-logo" />
              <p className="home-kicker">المنصة العلمية الشرعية</p>
            </div>
            <h1 className="home-hero-title">المجلس العلمي</h1>
            <p className="home-hero-lead">
              دروس وفوائد وأسئلة علمية في منصة واحدة هادئة ومنظمة.
            </p>
            <form onSubmit={submitSearch} className="home-search" aria-label="البحث في المنصة">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، فائدة، سؤال..."
              />
              <button type="submit">بحث</button>
            </form>
            <div className="home-hero-actions">
              <Link href="/lessons" className="home-primary-action">
                استعرض الدروس
              </Link>
              <Link href="/fawaid" className="home-secondary-action">
                الفوائد
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="home-container home-main">
        <HomePrayerTimes />
        <HomeDailyStrip />
        <HomeKuwaitLessons />

        {loading && <Loading />}

        <section className="home-section">
          <SectionHead eyebrow="أقسام المنصة" title="ابدأ من هنا" subtitle="أهم الأقسام للتعلم والبحث." />
          <div className="home-feature-grid home-feature-grid--compact">
            {FEATURES.map((feature) => (
              <Link key={feature.href} href={feature.href} className="ui-card home-feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-section home-two-column">
          <div>
            <SectionHead eyebrow="علم وإيمان" title="الإعجاز العلمي" href="/miracles" />
            <div className="home-miracle-list">
              {displayedMiracles.map((item: any) => (
                <Link key={item.id} href="/miracles" className="ui-card home-miracle-card">
                  <div>
                    <span className="home-tag">{item.source_type || "موثق"}</span>
                    {item.category && <span className="home-soft-tag">{item.category}</span>}
                  </div>
                  <h3>{displayText(item.title)}</h3>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <SectionHead eyebrow="مختارات نافعة" title="الفوائد المختارة" href="/fawaid" />
            <div className="home-fawaid-list">
              {displayedFawaid.map((item: any) => (
                <article key={item.id} className="ui-card home-fawaid-card">
                  <p>{displayText(item.text)}</p>
                  {item.author_name && <span>{displayText(item.author_name)}</span>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <SectionHead eyebrow="إجابات موثقة" title="أسئلة من المنصة" href="/qa" />
          <div className="home-qa-grid">
            {displayedQa.map((item: any) => (
              <Link key={item.id} href="/qa" className="ui-card home-qa-card">
                <span>{displayText(item.qa_categories?.name) || "سؤال وجواب"}</span>
                <h3>{displayText(item.question)}</h3>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
