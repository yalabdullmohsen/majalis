import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { getLessons, getSheikhs, getApprovedFawaid, getLibrary, getMiracles, getQaQuestions, getSupabaseErrorMessage } from "@/lib/supabase";
import { ErrorMessage } from "@/components/ui-common";

const FEATURES = [
  { href: "/lessons", icon: "📚", title: "الدروس والدورات", desc: "دروس علمية شرعية موثقة ومعتمدة" },
  { href: "/sheikhs", icon: "👳", title: "المشايخ والدعاة", desc: "نخبة من المشايخ المعتمدين" },
  { href: "/library", icon: "🏛", title: "المكتبة العلمية", desc: "كتب ومتون وتفريغات ومقالات" },
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
  { id: "fallback-fawaid-1", text: "العلم ميراث النبوة، وكل مجلس علم خطوة إلى بصيرة أوسع.", author_name: "مجالس" },
  { id: "fallback-fawaid-2", text: "صلاح القلب يبدأ بسؤال صادق واتباع للدليل.", author_name: "فائدة مختارة" },
];

function getSheikhImage(sheikh: any): string | undefined {
  return sheikh?.image_url || sheikh?.photo_url || sheikh?.avatar_url || sheikh?.profile_image_url;
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

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="home-empty-card">
      <span>قريبا</span>
      <p>{text}</p>
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
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    setError("");
    Promise.all([getLessons(), getSheikhs(), getApprovedFawaid(), getLibrary(), getMiracles(), getQaQuestions()]).then(
      ([l, s, f, lib, m, q]) => {
        const firstError = [l.error, s.error, f.error, lib.error, m.error, q.error].find(Boolean);
        if (firstError) setError(getSupabaseErrorMessage(firstError, "تعذّر تحميل بعض أقسام الصفحة الرئيسية."));
        setLessons(l.data || []);
        setSheikhs(s.data || []);
        setFawaid(f.data || []);
        setLibrary(lib.data || []);
        setMiracles(m.data || []);
        setQa(q.data || []);
      }
    ).catch((err) => setError(getSupabaseErrorMessage(err, "تعذّر تحميل الصفحة الرئيسية.")));
  }, []);

  const stats = useMemo(
    () => [
      { label: "الدروس", value: lessons.length, suffix: "+" },
      { label: "المشايخ", value: sheikhs.length, suffix: "+" },
      { label: "الكتب والمواد", value: library.length, suffix: "+" },
      { label: "الفوائد", value: fawaid.length, suffix: "+" },
    ],
    [fawaid.length, lessons.length, library.length, sheikhs.length]
  );

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  const featuredSheikhs = sheikhs.filter((s) => s.is_verified).slice(0, 4);
  const displayedSheikhs = (featuredSheikhs.length ? featuredSheikhs : sheikhs).slice(0, 4);
  const displayedLibrary = (library.length ? library : FALLBACK_LIBRARY).slice(0, 4);
  const displayedMiracles = (miracles.length ? miracles : FALLBACK_MIRACLES).slice(0, 3);
  const displayedFawaid = (fawaid.length ? fawaid : FALLBACK_FAWAID).slice(0, 3);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-pattern" />
        <div className="home-container home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-kicker">المنصة العلمية الشرعية</p>
            <h1>المجلس العلمي يجمع الدرس والشيخ والكتاب والفائدة</h1>
            <p className="home-hero-text">
              بوابة عربية منظمة للوصول إلى الدروس المعتمدة، وسير المشايخ، والمكتبة العلمية، ومقالات الإعجاز، والفوائد المختارة في تجربة هادئة وسريعة.
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
              <Link href="/library" className="home-secondary-action">
                تصفح المكتبة
              </Link>
              <Link href="/login" className="home-secondary-action">
                انضم الآن
              </Link>
            </div>
          </div>

          <div className="home-hero-card" aria-label="ملخص محتوى المنصة">
            <div className="home-hero-card-top">
              <span>مجلس اليوم</span>
              <strong>{lessons[0]?.category || "علم شرعي"}</strong>
            </div>
            <h2>{lessons[0]?.title || "ابدأ رحلتك العلمية من درس موثق ومختصر"}</h2>
            <p>{lessons[0]?.description || "اختر من الدروس والمقالات والفوائد ما يناسب وقتك واهتمامك، ثم واصل التعلم عبر أقسام المنصة."}</p>
            <div className="home-hero-meta">
              <span>{lessons[0]?.sheikhs?.name || "مشايخ معتمدون"}</span>
              <span>{lessons[0]?.city || "متاح للجميع"}</span>
            </div>
          </div>
        </div>
      </section>

      <main className="home-container home-main">
        {error && <ErrorMessage text={error} />}

        <section className="home-stats" aria-label="إحصائيات المنصة">
          {stats.map((stat) => (
            <div key={stat.label} className="home-stat-card">
              <strong>{stat.value}{stat.value > 0 ? stat.suffix : ""}</strong>
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
          {lessons.length > 0 ? (
            <div className="home-lessons-grid">
              {lessons.slice(0, 3).map((lesson: any) => (
                <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="home-lesson-card">
                  <div className="home-card-glow" />
                  <div className="home-card-row">
                    <span className="home-tag">{lesson.category || "درس علمي"}</span>
                    <span>{lesson.delivery || "حضور"}</span>
                  </div>
                  <h3>{lesson.title}</h3>
                  {lesson.description && <p>{excerpt(lesson.description, 120)}</p>}
                  <div className="home-lesson-meta">
                    <span>{lesson.sheikhs?.name || "شيخ معتمد"}</span>
                    <span>{[lesson.mosque, lesson.city].filter(Boolean).join(" - ") || "متاح قريبا"}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyCard text="سيتم عرض أحدث الدروس المعتمدة هنا فور إضافتها." />
          )}
        </section>

        <section className="home-section home-sheikhs-section">
          <SectionHead eyebrow="أهل العلم" title="أبرز المشايخ" subtitle="تعرف على المشايخ والدعاة المعتمدين وتخصصاتهم." href="/sheikhs" />
          {displayedSheikhs.length > 0 ? (
            <div className="home-sheikhs-grid">
              {displayedSheikhs.map((sheikh: any) => {
                const image = getSheikhImage(sheikh);
                return (
                  <Link key={sheikh.id} href={`/sheikhs/${sheikh.id}`} className="home-sheikh-card">
                    <div className="home-sheikh-photo">
                      {image ? <img src={image} alt={sheikh.name || "شيخ"} /> : <span>{sheikh.name?.charAt(0) || "ع"}</span>}
                    </div>
                    <h3>{sheikh.name}</h3>
                    <p>{sheikh.ijazah || sheikh.city || "شيخ معتمد في منصة مجالس"}</p>
                    <div className="home-sheikh-tags">
                      {sheikh.is_verified && <span>معتمد</span>}
                      {(sheikh.specialties || []).slice(0, 2).map((specialty: string) => (
                        <span key={specialty}>{specialty}</span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyCard text="سيظهر هنا أبرز المشايخ عند اعتماد ملفاتهم العلمية." />
          )}
        </section>

        <section className="home-section home-library-section">
          <SectionHead eyebrow="أحدث الإصدارات" title="أحدث الكتب" subtitle="كتب وأغلفة مختارة من المكتبة العلمية للوصول السريع إلى المادة المناسبة." href="/library" />
          <div className="home-library-grid">
            {displayedLibrary.map((item: any) => (
              <Link key={item.id} href={String(item.id).startsWith("fallback-") ? "/library" : `/library/${item.id}`} className="home-library-card">
                {item.cover_url ? <img src={item.cover_url} alt="" className="home-library-icon" style={{ objectFit: "cover" }} /> : <span className="home-library-icon">{item.type === "كتاب" ? "📕" : item.type === "متن" ? "📜" : "📝"}</span>}
                <div>
                  <span className="home-tag">{item.type || "مادة علمية"}</span>
                  <h3>{item.title}</h3>
                  <p>{item.author_name || item.description || item.category || "مادة مختارة ضمن المكتبة العلمية."}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-section" style={{ borderRadius: "1.5rem", padding: "clamp(1.5rem, 4vw, 2.5rem)", background: "linear-gradient(135deg, #164E3C, #1F6E54)", color: "#FAF5EA", textAlign: "center" }}>
          <p className="home-kicker" style={{ marginBottom: "0.5rem" }}>ابدأ رحلتك العلمية</p>
          <h2 style={{ fontFamily: "Amiri, serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", marginBottom: "0.75rem" }}>سجّل حسابك واحفظ دروسك المفضلة</h2>
          <p style={{ maxWidth: "38rem", margin: "0 auto 1.25rem", lineHeight: 1.9, color: "#E8E0CE" }}>تابع الدروس، احفظ المفضلة، قيّم ما حضرت، واجمع نقاطك وإنجازاتك في مكان واحد.</p>
          <Link href="/login" className="home-primary-action">إنشاء حساب مجاني</Link>
        </section>

        <section className="home-section home-two-column">
          <div>
            <SectionHead eyebrow="علم وإيمان" title="الإعجاز العلمي" subtitle="قراءات موثقة تربط العلم بآيات التفكر." href="/miracles" />
            <div className="home-miracle-list">
              {displayedMiracles.map((item: any) => (
                <Link key={item.id} href={String(item.id).startsWith("fallback-") ? "/miracles" : `/miracles/${item.id}`} className="home-miracle-card">
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

        {qa.length > 0 && (
          <section className="home-section">
            <SectionHead eyebrow="إجابات موثقة" title="أسئلة شائعة من المنصة" subtitle="نماذج من الأسئلة المنشورة بإجابات علمية مدعمة." href="/qa" />
            <div className="home-qa-grid">
              {qa.slice(0, 3).map((item: any) => (
                <Link key={item.id} href={`/qa/${item.id}`} className="home-qa-card">
                  <span>{item.qa_categories?.name || "سؤال وجواب"}</span>
                  <h3>{item.question}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="home-trust-strip">
          {TRUST_POINTS.map((point) => (
            <div key={point.title}>
              <span>{point.icon}</span>
              <h3>{point.title}</h3>
              <p>{point.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
