import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { getLibrary, getMiracles, getApprovedFawaid, getQaQuestions } from "@/lib/supabase";
import { DEMO_QA } from "@/lib/demo-content";
import { HOME_MAINTENANCE_MESSAGE } from "@/lib/home-content";
import { Loading, ErrorState } from "@/components/ui-common";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyHadith } from "@/components/home/HomeDailyHadith";
import { HomeDailyAyah } from "@/components/home/HomeDailyAyah";
import { HomeKuwaitLessons } from "@/components/home/HomeKuwaitLessons";

const FEATURES = [
  { href: "/lessons", icon: "📚", title: "الدروس والدورات", desc: "دروس علمية شرعية موثقة ومعتمدة" },
  { href: "/kuwait-lessons", icon: "🕌", title: "دروس الكويت", desc: "مرجع شامل للدروس في مساجد الكويت" },
  { href: "/library", icon: "🏛", title: "المكتبة العلمية", desc: "كتب ومتون وتفريغات ومقالات" },
  { href: "/assistant", icon: "🤖", title: "المساعد العلمي", desc: "إرشاد ذكي للبحث داخل المنصة" },
  { href: "/miracles", icon: "🌌", title: "الإعجاز العلمي", desc: "مقالات موثقة من الكتاب والسنة" },
  { href: "/qa", icon: "❓", title: "الأسئلة والأجوبة", desc: "أجوبة علمية مدعمة بالأدلة" },
];

const FALLBACK_LIBRARY = [
  { id: "fallback-library-1", title: "مختارات من كتب العقيدة", type: "كتاب", category: "عقيدة" },
  { id: "fallback-library-2", title: "متون طالب العلم", type: "متن", category: "تأصيل" },
  { id: "fallback-library-3", title: "تفريغات الدروس العلمية", type: "تفريغ", category: "دروس" },
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
  const [library, setLibrary] = useState<any[]>([]);
  const [miracles, setMiracles] = useState<any[]>([]);
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [qa, setQa] = useState<any[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const loadHome = () => {
    setLoading(true);
    setError("");
    Promise.all([getApprovedFawaid(), getLibrary(), getMiracles(), getQaQuestions()])
      .then(([f, lib, m, q]) => {
        setFawaid(f.data || []);
        setLibrary(lib.data || []);
        setMiracles(m.data || []);
        setQa(q.data || []);
      })
      .catch(() => setError("تعذر تحميل بعض أقسام الصفحة."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHome();
  }, []);

  const displayedLibrary = (library.length ? library : FALLBACK_LIBRARY).slice(0, 3);
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
            <h1 className="visually-hidden">المجلس العلمي</h1>
            <div className="home-maintenance-card ui-card" role="status">
              <p className="home-maintenance-banner">{HOME_MAINTENANCE_MESSAGE}</p>
            </div>
            <form onSubmit={submitSearch} className="home-search" aria-label="البحث في المنصة">
              <span aria-hidden="true">🔎</span>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، كتاب، فائدة..."
              />
              <button type="submit">بحث</button>
            </form>
            <div className="home-hero-actions">
              <Link href="/lessons" className="home-primary-action">
                استعرض الدروس
              </Link>
              <Link href="/assistant" className="home-secondary-action">
                المساعد العلمي
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="home-container home-main">
        <HomePrayerTimes />
        <HomeDailyHadith />
        <HomeDailyAyah />
        <HomeKuwaitLessons />

        {loading && <Loading />}
        {error && <ErrorState text={error} onRetry={loadHome} />}

        {!error && (
          <>
            <section className="home-section">
              <SectionHead eyebrow="أقسام المنصة" title="ابدأ من هنا" subtitle="أهم الأقسام للتعلم والبحث." />
              <div className="home-feature-grid home-feature-grid--compact">
                {FEATURES.map((feature) => (
                  <Link key={feature.href} href={feature.href} className="ui-card home-feature-card">
                    <span className="home-feature-icon" aria-hidden="true">{feature.icon}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="home-section home-library-section">
              <SectionHead eyebrow="الأرشيف العلمي" title="المكتبة العلمية" subtitle="كتب ومتون وتفريغات منظمة." href="/library" />
              <div className="home-library-grid">
                {displayedLibrary.map((item: any) => (
                  <Link key={item.id} href="/library" className="ui-card home-library-card">
                    <span className="home-library-icon">{item.type === "كتاب" ? "📕" : item.type === "متن" ? "📜" : "📝"}</span>
                    <div>
                      <span className="home-tag">{item.type || "مادة علمية"}</span>
                      <h3>{item.title}</h3>
                      <p>{item.description || item.category || "مادة مختارة ضمن المكتبة العلمية."}</p>
                    </div>
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
                      <h3>{item.title}</h3>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <SectionHead eyebrow="مختارات نافعة" title="الفوائد المختارة" href="/fawaid" />
                <div className="home-fawaid-list">
                  {displayedFawaid.map((item: any) => (
                    <article key={item.id} className="ui-card home-fawaid-card">
                      <p>{item.text}</p>
                      {item.author_name && <span>{item.author_name}</span>}
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
                    <span>{item.qa_categories?.name || "سؤال وجواب"}</span>
                    <h3>{item.question}</h3>
                  </Link>
                ))}
              </div>
            </section>

            <section className="home-cta-banner ui-card">
              <div>
                <p className="home-eyebrow">المساعد العلمي</p>
                <h2>اسأل وابحث داخل المنصة بسرعة</h2>
                <p>المساعد يرشدك إلى الدروس والكتب، ويحيل الفتوى الخاصة إلى أهل العلم.</p>
              </div>
              <Link href="/assistant" className="home-primary-action">افتح المساعد العلمي</Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
