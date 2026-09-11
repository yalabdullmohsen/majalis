import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  Compass,
  Flower2,
  Globe,
  Heart,
  HelpCircle,
  Landmark,
  Lightbulb,
  MessageCircle,
  Moon,
  Scale,
  Shield,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { HubCard } from "@/components/ui/HubCard";
import { applyPageSeo } from "@/lib/seo";
import { useLanguage } from "@/components/LanguageProvider";
import { LANG_META } from "@/lib/language-preference";
import { getFeaturedQuestions, getFeaturedShubuhat, getDawahCategories, getArticlesByCategory, type DawahQuestion, type DawahShubha, type DawahCategory, type DawahArticle } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";
import { UtilityScreen } from "@/components/design-system/screens";

/** Allowlist — avoids `import * as LucideIcons` pulling the entire icon set into this route. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Compass,
  Flower2,
  Globe,
  Heart,
  HelpCircle,
  Landmark,
  Lightbulb,
  MessageCircle,
  Moon,
  Scale,
  Shield,
  Sparkles,
  Star,
  Users,
};

function CategoryIcon({ name }: { name: string | null }) {
  const Icon = (name && CATEGORY_ICONS[name]) || Sparkles;
  return <Icon size={22} aria-hidden="true" />;
}

type VisitorPath = {
  id: string;
  label: string;
  desc: string;
  href: string;
};

const VISITOR_PATHS: VisitorPath[] = [
  { id: "first-time", label: "أتعرّف لأول مرة", desc: "مدخل عام مبسّط للإسلام من مصادره", href: "/discover-islam/articles/what-is-islam" },
  { id: "believe-questions", label: "أؤمن بالله ولديّ أسئلة", desc: "أسئلة حول النبوة والعبادة والقرآن", href: "/discover-islam/questions?category=prophethood" },
  { id: "atheist", label: "لا أؤمن بوجود الله", desc: "أدلة عقلية على وجود الخالق", href: "/discover-islam/questions?category=god-existence" },
  { id: "other-religion", label: "أنتمي إلى ديانة أخرى", desc: "تصوّر الإسلام لله والنبوة والوحي", href: "/discover-islam/questions?category=prophethood" },
  { id: "doubts", label: "لديّ شبهات", desc: "ردود موثّقة على أشهر الشبهات", href: "/discover-islam/doubts" },
  { id: "considering", label: "أفكّر في الدخول", desc: "خطوات عملية واضحة للدخول في الإسلام", href: "/discover-islam/how-to-convert" },
  { id: "new-muslim", label: "دخلت الإسلام حديثًا", desc: "مسار الثلاثين يومًا الأول", href: "/discover-islam/new-muslim" },
  { id: "contact", label: "أريد التحدث مع مختص", desc: "تواصل سري مع داعٍ أو داعية", href: "/discover-islam/contact" },
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
  const [articles, setArticles] = useState<DawahArticle[]>([]);

  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam",
      title: "تعرّف إلى الإسلام من مصادره | سُنّة",
      description: "منصة تعريفية بالإسلام لغير المسلمين والمهتمين: أسئلة وأجوبة، ردود على الشبهات، وكيفية الدخول في الإسلام — بواجهة تدعم اختيار اللغة.",
      keywords: ["ما هو الإسلام", "التعرف على الإسلام", "كيف أصبح مسلم", "أسئلة عن الإسلام"],
    });
  }, []);

  useEffect(() => {
    getFeaturedQuestions(6).then(setQuestions);
    getFeaturedShubuhat(6).then(setShubuhat);
    getDawahCategories().then(setCategories);
    getArticlesByCategory(undefined, 6).then(setArticles);
  }, []);

  return (
    <UtilityScreen compose="mark">
    <SectionTemplatePage
      route="/discover-islam"
      eyebrow="التعريف بالإسلام"
      title="تعرّف إلى الإسلام من مصادره"
      subtitle="تعريف واضح بالأدلة، يجيب عن الأسئلة ويرد على الشبهات بهدوء واحترام."
      groupTitle="مسارات التعرف"
    >
    <div className="page-shell narrow content-hub-page dii-page">

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

      <section aria-labelledby="dii-paths-heading" className="dii-section">
        <h2 id="dii-paths-heading" className="page-section-title">أي وصف أقرب إليك؟</h2>
        <div className="hub-card-grid dii-hub-grid">
          {VISITOR_PATHS.map((p) => (
            <HubCard
              key={p.id}
              href={p.href}
              title={p.label}
              description={p.desc}
              badge="مسار"
              className="dii-hub-card soft-card soft-card--on-light"
            />
          ))}
        </div>
      </section>

      {categories.length === 0 && questions.length === 0 && shubuhat.length === 0 ? (
        <p className="page-desc" style={{ marginTop: "1.5rem" }}>
          المقالات والمسارات أدناه متاحة الآن. عند فراغ قاعدة البيانات تُعرض أسئلة مميزة معتمدة محليًا إلى حين التحديث.
        </p>
      ) : null}

      {articles.length > 0 && (
        <section aria-labelledby="dii-articles-heading" className="dii-section">
          <div className="page-stats-row">
            <h2 id="dii-articles-heading" className="page-section-title" style={{ margin: 0 }}>مقالات تأسيسية</h2>
            <Link href="/discover-islam/articles/what-is-islam" className="page-link-inline">ابدأ بـ«ما الإسلام؟»</Link>
          </div>
          <div className="hub-card-grid dii-list-grid">
            {articles.map((a) => (
              <HubCard
                key={a.id}
                href={`/discover-islam/articles/${a.slug}`}
                title={a.title_ar}
                description={a.summary_ar || undefined}
                badge="مقال"
                className="dii-hub-card dii-list-card soft-card soft-card--on-light"
              />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section aria-labelledby="dii-categories-heading" className="dii-section">
          <h2 id="dii-categories-heading" className="page-section-title">تصفّح حسب الموضوع</h2>
          <div className="hub-card-grid dii-hub-grid">
            {categories.map((c) => (
              <HubCard
                key={c.id}
                href={`/discover-islam/questions?category=${c.slug}`}
                title={c.name_ar}
                description={c.description_ar || undefined}
                icon={<CategoryIcon name={c.icon} />}
                badge="موضوع"
                className="dii-hub-card soft-card soft-card--on-light"
              />
            ))}
          </div>
        </section>
      )}

      {questions.length > 0 && (
        <section aria-labelledby="dii-questions-heading" className="dii-section">
          <div className="page-stats-row">
            <h2 id="dii-questions-heading" className="page-section-title" style={{ margin: 0 }}>أشهر الأسئلة</h2>
            <Link href="/discover-islam/questions" className="page-link-inline">عرض الكل</Link>
          </div>
          <div className="hub-card-grid dii-list-grid">
            {questions.map((q) => (
              <HubCard
                key={q.id}
                href={`/discover-islam/questions/${q.slug}`}
                title={q.title}
                description={q.short_answer}
                badge="سؤال"
                className="dii-hub-card dii-list-card soft-card soft-card--on-light"
              />
            ))}
          </div>
        </section>
      )}

      {shubuhat.length > 0 && (
        <section aria-labelledby="dii-shubuhat-heading" className="dii-section">
          <div className="page-stats-row">
            <h2 id="dii-shubuhat-heading" className="page-section-title" style={{ margin: 0 }}>أشهر الشبهات</h2>
            <Link href="/discover-islam/doubts" className="page-link-inline">عرض الكل</Link>
          </div>
          <div className="hub-card-grid dii-list-grid">
            {shubuhat.map((s) => (
              <HubCard
                key={s.id}
                href={`/discover-islam/doubts/${s.slug}`}
                title={s.title}
                description={s.short_answer}
                badge="شبهة"
                className="dii-hub-card dii-list-card soft-card soft-card--on-light"
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="dii-journey-heading" className="dii-section">
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

      <section className="dii-contact-cta dii-block dii-block--accent dii-section">
        <h2>هل تحتاج التحدث مع شخص مباشرة؟</h2>
        <p>تواصل سري وآمن مع داعٍ أو داعية — بلا أي إلزام، وبلا نشر بياناتك لأحد.</p>
        <Link href="/discover-islam/contact" className="asp-run-btn">ابدأ التواصل السري</Link>
      </section>
    </div>
    </SectionTemplatePage>
  
    </UtilityScreen>
  );
}
