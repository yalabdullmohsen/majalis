import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { getLessons, getSheikhs, getApprovedFawaid, getLibrary, getMiracles, getQaQuestions } from "@/lib/supabase";
import { DEMO_LESSONS, DEMO_SHEIKHS, DEMO_QA } from "@/lib/demo-content";
import { Loading, ErrorState } from "@/components/ui-common";
import { CurrentLessonsSection } from "@/components/lessons/CurrentLessonsSection";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveSheikhImageUrl, resolveLessonSheikhImage, parseLessonSchedule } from "@/lib/sheikh-image";

const FEATURES = [
  { href: "/lessons", icon: "📚", title: "الدروس والدورات", desc: "دروس علمية شرعية موثقة ومعتمدة" },
  { href: "/sheikhs", icon: "👳", title: "المشايخ والدعاة", desc: "نخبة من المشايخ المعتمدين" },
  { href: "/library", icon: "🏛", title: "المكتبة العلمية", desc: "كتب ومتون وتفريغات ومقالات" },
  { href: "/assistant", icon: "🤖", title: "المساعد العلمي", desc: "إرشاد ذكي للبحث داخل المنصة" },
  { href: "/miracles", icon: "🌌", title: "الإعجاز العلمي", desc: "مقالات موثقة من الكتاب والسنة" },
  { href: "/qa", icon: "❓", title: "الأسئلة والأجوبة", desc: "أجوبة علمية مدعمة بالأدلة" },
  { href: "/fawaid", icon: "💎", title: "الفوائد", desc: "فوائد دينية مختارة ومراجعة" },
];

const TRUST_POINTS = [
  { icon: "✓", title: "محتوى موثق", desc: "كل مادة مدعمة بالدليل والمرجع" },
  { icon: "✦", title: "مشايخ معتمدون", desc: "إجازات علمية وتخصصات دقيقة" },
  { icon: "♡", title: "وصول مجاني", desc: "العلم الشرعي متاح للجميع" },
];

const FALLBACK_LIBRARY = [
  { id: "fallback-library-1", title: "مختارات من كتب العقيدة", type: "كتاب", category: "عقيدة" },
  { id: "fallback-library-2", title: "متون طالب العلم", type: "متن", category: "تأصيل" },
  { id: "fallback-library-3", title: "تفريغات الدروس العلمية", type: "تفريغ", category: "دروس" },
];

const FALLBACK_MIRACLES = [
  { id: "fallback-miracle-1", title: "آيات التفكر في خلق السماوات والأرض", source_type: "قرآن", category: "فلك" },
  { id: "fallback-miracle-2", title: "دلائل القدرة في خلق الإنسان", source_type: "قرآن", category: "طب" },
  { id: "fallback-miracle-3", title: "سنن الله في الكون والحياة", source_type: "سنة", category: "أخرى" },
];

const FALLBACK_FAWAID = [
  { id: "fallback-fawaid-1", text: "العلم ميراث النبوة، وكل مجلس علم خطوة إلى بصيرة أوسع.", author_name: "المجلس العلمي" },
  { id: "fallback-fawaid-2", text: "صلاح القلب يبدأ بسؤال صادق واتباع للدليل.", author_name: "فائدة مختارة" },
];

function getSheikhImage(sheikh: any): string | undefined {
  return resolveSheikhImageUrl(sheikh);
}

function excerpt(value: string | undefined, limit: number) {
  if (!value) return "";
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

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
  const [lessons, setLessons] = useState<any[]>([]);
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [miracles, setMiracles] = useState<any[]>([]);
  const [qa, setQa] = useState<any[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const loadHome = () => {
    setLoading(true);
    setError("");
    Promise.all([getLessons(), getSheikhs(), getApprovedFawaid(), getLibrary(), getMiracles(), getQaQuestions()])
      .then(([l, s, f, lib, m, q]) => {
        setLessons(l.data || []);
        setSheikhs(s.data || []);
        setFawaid(f.data || []);
        setLibrary(lib.data || []);
        setMiracles(m.data || []);
        setQa(q.data || []);
      })
      .catch(() => setError("تعذر تحميل محتوى الصفحة الرئيسية."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHome();
  }, []);

  const usingDemoLessons = lessons.length === 0;
  const usingDemoSheikhs = sheikhs.length === 0;
  const displayedLessons = (usingDemoLessons ? DEMO_LESSONS : lessons).slice(0, 3);
  const displayedSheikhs = (usingDemoSheikhs ? DEMO_SHEIKHS : (sheikhs.filter((s) => s.is_verified).length ? sheikhs.filter((s) => s.is_verified) : sheikhs)).slice(0, 4);
  const displayedLibrary = (library.length ? library : FALLBACK_LIBRARY).slice(0, 4);
  const displayedMiracles = (miracles.length ? miracles : FALLBACK_MIRACLES).slice(0, 3);
  const displayedFawaid = (fawaid.length ? fawaid : FALLBACK_FAWAID).slice(0, 3);
  const displayedQa = (qa.length ? qa : DEMO_QA).slice(0, 3);
  const heroLesson = displayedLessons[0];

  const stats = useMemo(
    () => [
      { label: "الدروس", value: usingDemoLessons ? DEMO_LESSONS.length : lessons.length, suffix: "+" },
      { label: "المشايخ", value: usingDemoSheikhs ? DEMO_SHEIKHS.length : sheikhs.length, suffix: "+" },
      { label: "الكتب والمواد", value: library.length || FALLBACK_LIBRARY.length, suffix: "+" },
      { label: "الفوائد", value: fawaid.length || FALLBACK_FAWAID.length, suffix: "+" },
    ],
    [fawaid.length, lessons.length, library.length, sheikhs.length, usingDemoLessons, usingDemoSheikhs]
  );

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-pattern" />
        <div className="home-container home-hero-grid">
          <div className="home-hero-copy">
            <div className="home-hero-brand">
              <img src="/logo.png" alt="المجلس العلمي" className="home-hero-logo" />
              <p className="home-kicker">المنصة العلمية الشرعية</p>
            </div>
            <h1>المجلس العلمي — دروسك وكتبك ومشايخك في مكان واحد</h1>
            <p className="home-hero-text">
              منصة عربية تجمع الدروس والمحاضرات والدورات والكتب والفوائد والأسئلة الشرعية بطريقة منظمة، مع مساعد علمي يرشدك داخل المحتوى دون ادعاء الإفتاء.
            </p>
            <form onSubmit={submitSearch} className="home-search" aria-label="البحث في المنصة">
              <span aria-hidden="true">🔎</span>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، شيخ، كتاب، فائدة..."
              />
              <button type="submit">بحث</button>
            </form>
            <div className="home-hero-actions">
              <Link href="/lessons" className="home-primary-action">
                استعرض أحدث الدروس
              </Link>
              <Link href="/assistant" className="home-secondary-action">
                جرّب المساعد العلمي
              </Link>
            </div>
          </div>

          <div className="home-hero-card" aria-label="ملخص محتوى المنصة">
            <div className="home-hero-card-top">
              <span>مجلس اليوم</span>
              <strong>{heroLesson?.category || "علم شرعي"}</strong>
            </div>
            <h2>{heroLesson?.title || "ابدأ رحلتك العلمية من درس موثق ومختصر"}</h2>
            <p>{heroLesson?.description || "اختر من الدروس والمقالات والفوائد ما يناسب وقتك واهتمامك، ثم واصل التعلم عبر أقسام المنصة."}</p>
            <div className="home-hero-meta">
              <span>{heroLesson?.sheikhs?.name || "مشايخ معتمدون"}</span>
              <span>{heroLesson?.city || "متاح للجميع"}</span>
            </div>
          </div>
        </div>
      </section>

      <CurrentLessonsSection />

      <main className="home-container home-main">
        {loading && <Loading />}
        {error && <ErrorState text={error} onRetry={loadHome} />}

        {!error && (
          <>
            <section className="home-stats" aria-label="إحصائيات المنصة">
              {stats.map((stat) => (
                <div key={stat.label} className="home-stat-card">
                  <strong>{stat.value}{stat.suffix}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </section>

            <section className="home-feature-grid" aria-label="أقسام المنصة">
              {FEATURES.map((feature) => (
                <Link key={feature.href} href={feature.href} className="home-feature-card">
                  <span className="home-feature-icon" aria-hidden="true">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </Link>
              ))}
            </section>

            <section className="home-section">
              <SectionHead eyebrow="أحدث الإضافات" title="أحدث الدروس" subtitle="بطاقات مختصرة تساعدك على اختيار مجلسك القادم بسرعة." href="/lessons" />
              {usingDemoLessons && (
                <p className="home-demo-note">نعرض دروسًا تجريبية حتى يُضاف محتوى حي من لوحة الإدارة.</p>
              )}
              <div className="home-lessons-grid">
                {displayedLessons.map((lesson: any) => {
                  const sheikhName = lesson.sheikhs?.name || lesson.speaker_name || "شيخ معتمد";
                  const { day, time } = parseLessonSchedule(lesson.schedule);
                  return (
                    <Link key={lesson.id} href="/lessons" className="home-lesson-card">
                      <div className="home-card-glow" />
                      <div className="home-lesson-card-top">
                        <SheikhAvatar
                          src={resolveLessonSheikhImage(lesson)}
                          name={sheikhName}
                          size="responsive"
                        />
                        <div>
                          <p className="home-lesson-sheikh">{sheikhName}</p>
                          <h3>{lesson.title}</h3>
                        </div>
                      </div>
                      <div className="home-lesson-meta">
                        <span>{lesson.mosque || "مسجد"}</span>
                        <span>{day} · {time}</span>
                      </div>
                      {lesson.description && <p>{excerpt(lesson.description, 100)}</p>}
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="home-section home-sheikhs-section">
              <SectionHead eyebrow="أهل العلم" title="أبرز المشايخ" subtitle="تعرف على المشايخ والدعاة المعتمدين وتخصصاتهم." href="/sheikhs" />
              <div className="home-sheikhs-grid">
                {displayedSheikhs.map((sheikh: any) => (
                    <Link key={sheikh.id} href={usingDemoSheikhs ? "/sheikhs" : `/sheikhs/${sheikh.id}`} className="home-sheikh-card">
                      <SheikhAvatar
                        src={getSheikhImage(sheikh)}
                        name={sheikh.name}
                        size="responsive"
                        className="home-sheikh-photo-wrap"
                      />
                      <h3>{sheikh.name}</h3>
                      <p>{sheikh.ijazah || sheikh.city || "شيخ معتمد في المجلس العلمي"}</p>
                      <div className="home-sheikh-tags">
                        {sheikh.is_verified && <span>معتمد</span>}
                        {(sheikh.specialties || []).slice(0, 2).map((specialty: string) => (
                          <span key={specialty}>{specialty}</span>
                        ))}
                      </div>
                    </Link>
                ))}
              </div>
            </section>

            <section className="home-section home-library-section">
              <SectionHead eyebrow="الأرشيف العلمي" title="المكتبة العلمية" subtitle="كتب ومتون وتفريغات منظمة للوصول السريع إلى المادة المناسبة." href="/library" />
              <div className="home-library-grid">
                {displayedLibrary.map((item: any) => (
                  <Link key={item.id} href="/library" className="home-library-card">
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
                <SectionHead eyebrow="علم وإيمان" title="الإعجاز العلمي" subtitle="قراءات موثقة تربط العلم بآيات التفكر." href="/miracles" />
                <div className="home-miracle-list">
                  {displayedMiracles.map((item: any) => (
                    <Link key={item.id} href="/miracles" className="home-miracle-card">
                      <div>
                        <span className="home-tag">{item.source_type || "موثق"}</span>
                        {item.category && <span className="home-soft-tag">{item.category}</span>}
                      </div>
                      <h3>{item.title}</h3>
                      {item.reference && <p>{item.reference}</p>}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <SectionHead eyebrow="مختارات نافعة" title="الفوائد المختارة" subtitle="فوائد قصيرة مراجعة تصلح للتأمل والمشاركة." href="/fawaid" />
                <div className="home-fawaid-list">
                  {displayedFawaid.map((item: any) => (
                    <article key={item.id} className="home-fawaid-card">
                      <p>“{item.text}”</p>
                      {item.author_name && <span>{item.author_name}</span>}
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="home-section">
              <SectionHead eyebrow="إجابات موثقة" title="أسئلة شائعة من المنصة" subtitle="نماذج من الأسئلة المنشورة بإجابات علمية مدعمة." href="/qa" />
              <div className="home-qa-grid">
                {displayedQa.map((item: any) => (
                  <Link key={item.id} href="/qa" className="home-qa-card">
                    <span>{item.qa_categories?.name || "سؤال وجواب"}</span>
                    <h3>{item.question}</h3>
                  </Link>
                ))}
              </div>
            </section>

            <section className="home-cta-banner">
              <div>
                <p className="home-eyebrow">المساعد العلمي</p>
                <h2>اسأل وابحث داخل المنصة بسرعة</h2>
                <p>المساعد يرشدك إلى الدروس والمشايخ والكتب، ويحيل الفتوى الخاصة إلى أهل العلم.</p>
              </div>
              <Link href="/assistant" className="home-primary-action">افتح المساعد العلمي</Link>
            </section>

            <section className="home-trust-strip">
              {TRUST_POINTS.map((point) => (
                <div key={point.title}>
                  <span>{point.icon}</span>
                  <h3>{point.title}</h3>
                  <p>{point.desc}</p>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
