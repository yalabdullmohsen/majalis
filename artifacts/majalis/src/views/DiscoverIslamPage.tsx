import { useEffect, useState } from "react";
import { Link } from "wouter";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { useLanguage } from "@/components/LanguageProvider";
import { LANG_META } from "@/lib/language-preference";
import { getFeaturedQuestions, getFeaturedShubuhat, getDawahCategories, type DawahQuestion, type DawahShubha, type DawahCategory } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";

function CategoryIcon({ name }: { name: string | null }) {
  const Icon = (name && (LucideIcons as unknown as Record<string, LucideIcon>)[name]) || LucideIcons.Sparkles;
  return <Icon size={22} aria-hidden="true" />;
}

type VisitorPath = {
  id: string;
  label: string;
  desc: string;
  href: string;
};

const VISITOR_PATHS: VisitorPath[] = [
  { id: "first-time", label: "أتعرّف لأول مرة", desc: "مدخل عام مبسّط للإسلام", href: "/discover-islam/articles/what-is-islam" },
  { id: "believe-questions", label: "أؤمن بالله ولديّ أسئلة", desc: "أسئلة حول النبوة والعبادة والقرآن", href: "/discover-islam/questions?category=prophethood" },
  { id: "atheist", label: "لا أؤمن بوجود الله", desc: "أدلة عقلية على وجود الخالق", href: "/discover-islam/questions?category=god-existence" },
  { id: "other-religion", label: "أنتمي إلى ديانة أخرى", desc: "تصوّر الإسلام لله والنبوة والوحي", href: "/discover-islam/questions?category=prophethood" },
  { id: "doubts", label: "لديّ شبهات", desc: "ردود موثّقة على أشهر الشبهات", href: "/discover-islam/doubts" },
  { id: "considering", label: "أفكّر في الدخول", desc: "خطوات عملية وواضحة", href: "/discover-islam/how-to-convert" },
  { id: "new-muslim", label: "دخلت الإسلام حديثًا", desc: "مسار الثلاثين يومًا الأول", href: "/discover-islam/new-muslim" },
  { id: "contact", label: "أريد التحدث مع مختص", desc: "تواصل سري مع داعية أو داعية", href: "/discover-islam/contact" },
];

const JOURNEY_STEPS = [
  { title: "من هو الله؟", href: "/discover-islam/questions?category=god-existence" },
  { title: "لماذا خُلقنا؟", href: "/discover-islam/questions?category=purpose-of-life" },
  { title: "ما الإسلام؟", href: "/discover-islam/articles/what-is-islam" },
  { title: "من محمد ﷺ؟", href: "/discover-islam/articles/who-is-muhammad" },
  { title: "ما القرآن؟", href: "/discover-islam/questions?category=quran" },
  { title: "لماذا نعبد الله؟", href: "/discover-islam/questions?category=worship" },
  { title: "كيف أدخل؟", href: "/discover-islam/how-to-convert" },
  { title: "ماذا بعد؟", href: "/discover-islam/new-muslim" },
];

export default function DiscoverIslamPage() {
  const { lang, setLang } = useLanguage();
  const [questions, setQuestions] = useState<DawahQuestion[]>([]);
  const [shubuhat, setShubuhat] = useState<DawahShubha[]>([]);
  const [categories, setCategories] = useState<DawahCategory[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam",
      title: "تعرّف إلى الإسلام من مصادره | المجلس العلمي",
      description: "منصة تعريفية بالإسلام لغير المسلمين والمهتمين: أسئلة وأجوبة، ردود على الشبهات، وكيفية الدخول في الإسلام — بلغات متعددة.",
      keywords: ["ما هو الإسلام", "التعرف على الإسلام", "كيف أصبح مسلم", "أسئلة عن الإسلام"],
    });
  }, []);

  useEffect(() => {
    getFeaturedQuestions(6).then(setQuestions);
    getFeaturedShubuhat(6).then(setShubuhat);
    getDawahCategories().then(setCategories);
  }, []);

  return (
    <div className="page-shell narrow content-hub-page dii-page">
      <PageHeader
        eyebrow="بوابة التعريف بالإسلام"
        title="تعرّف إلى الإسلام من مصادره"
        subtitle="خطاب عقلاني وواضح، مبني على الأدلة، يحترم عقلك وحريتك في السؤال — بلا ضغط، بلا استعجال."
      />

      <div className="dii-lang-row">
        <span className="dii-lang-label">اختر لغتك:</span>
        <div className="dii-lang-chips">
          {LANG_META.map((m) => (
            <button
              key={m.code}
              type="button"
              onClick={() => setLang(m.code)}
              className={`content-hub-chip${lang === m.code ? " content-hub-chip--active" : ""}`}
            >
              {m.nativeName}
            </button>
          ))}
        </div>
      </div>

      <div className="dii-cta-row">
        <Link href="/discover-islam/articles/what-is-islam" className="asp-run-btn">ابدأ من هنا</Link>
        <Link href="/discover-islam/questions" className="asp-add-btn">لديّ سؤال</Link>
        <Link href="/discover-islam/doubts" className="asp-add-btn">استكشف الشبهات</Link>
        <Link href="/discover-islam/how-to-convert" className="asp-add-btn">كيف أصبح مسلمًا؟</Link>
        <Link href="/discover-islam/contact" className="asp-add-btn">تحدّث مع داعية</Link>
      </div>

      <section aria-labelledby="dii-paths-heading" style={{ marginTop: "2.5rem" }}>
        <h2 id="dii-paths-heading" className="page-section-title">أي وصف أقرب إليك؟</h2>
        <div className="dii-paths-grid">
          {VISITOR_PATHS.map((p) => (
            <Link key={p.id} href={p.href} className="dii-path-card ui-card">
              <strong>{p.label}</strong>
              <span>{p.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="dii-categories-heading" style={{ marginTop: "2.5rem" }}>
          <h2 id="dii-categories-heading" className="page-section-title">تصفّح حسب الموضوع</h2>
          <div className="dii-categories-grid">
            {categories.map((c) => (
              <Link key={c.id} href={`/discover-islam/questions?category=${c.slug}`} className="dii-category-card ui-card">
                <span className="dii-category-icon"><CategoryIcon name={c.icon} /></span>
                <strong>{c.name_ar}</strong>
                {c.description_ar && <span>{c.description_ar}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {questions.length > 0 && (
        <section aria-labelledby="dii-questions-heading" style={{ marginTop: "2.5rem" }}>
          <div className="page-stats-row">
            <h2 id="dii-questions-heading" className="page-section-title" style={{ margin: 0 }}>أشهر الأسئلة</h2>
            <Link href="/discover-islam/questions" className="page-link-inline">عرض الكل</Link>
          </div>
          <div className="page-card-grid">
            {questions.map((q) => (
              <Link key={q.id} href={`/discover-islam/questions/${q.slug}`} className="platform-card-link">
                <article className="page-card platform-content-card">
                  <div className="page-card-header"><p>{q.title}</p></div>
                  <p className="page-desc">{q.short_answer}</p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {shubuhat.length > 0 && (
        <section aria-labelledby="dii-shubuhat-heading" style={{ marginTop: "2.5rem" }}>
          <div className="page-stats-row">
            <h2 id="dii-shubuhat-heading" className="page-section-title" style={{ margin: 0 }}>أشهر الشبهات</h2>
            <Link href="/discover-islam/doubts" className="page-link-inline">عرض الكل</Link>
          </div>
          <div className="page-card-grid">
            {shubuhat.map((s) => (
              <Link key={s.id} href={`/discover-islam/doubts/${s.slug}`} className="platform-card-link">
                <article className="page-card platform-content-card">
                  <div className="page-card-header"><p>{s.title}</p></div>
                  <p className="page-desc">{s.short_answer}</p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="dii-journey-heading" style={{ marginTop: "2.5rem" }}>
        <h2 id="dii-journey-heading" className="page-section-title">اكتشف الإسلام خطوة بخطوة</h2>
        <ol className="dii-journey">
          {JOURNEY_STEPS.map((step, i) => (
            <li key={step.href}>
              <Link href={step.href} className="dii-journey-step">
                <span className="dii-journey-num">{i + 1}</span>
                <span>{step.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="dii-contact-cta ui-card" style={{ marginTop: "2.5rem" }}>
        <h2>هل تحتاج التحدث مع شخص مباشرة؟</h2>
        <p>تواصل سري وآمن مع داعية أو داعية — بلا أي إلزام، وبلا نشر بياناتك لأحد.</p>
        <Link href="/discover-islam/contact" className="asp-run-btn">ابدأ التواصل السري</Link>
      </section>
    </div>
  );
}
