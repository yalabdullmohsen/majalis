import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  BookMarked,
  BookOpen,
  ChevronLeft,
  GraduationCap,
  History,
  ShieldCheck,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import {
  BOOK_SPOTLIGHTS,
  CAUTIONS,
  MUFASSIR_CONDITIONS,
  MUFASSIRUN,
  MUSHAF_TAFSIR_EDITIONS,
  STUDY_PATH,
  TAFSIR_CATEGORIES,
  TAFSIR_DEFINITION,
  TAFSIR_INTRO_PARAS,
  TAFSIR_PRINCIPLES,
  TAFSIR_STAGES,
  TAFSIR_TERMS,
  TAFSIR_TYPES,
  type TafsirCategory,
} from "@/lib/tafsir-seed";
import { toArabicDigits } from "@/lib/utils";
import { TextHighlightCapture } from "@/components/reading/TextHighlightCapture";
import "@/styles/pages/tafsir.css";

type CardItem = {
  id: string;
  category: TafsirCategory;
  title: string;
  body: string;
  example?: string;
  note?: string;
  libraryId?: string;
  meta?: string;
  rank?: string;
  source?: string;
};

function buildCards(): CardItem[] {
  const history: CardItem[] = TAFSIR_STAGES.map((s) => ({
    id: `stage-${s.id}`,
    category: "تاريخ التفسير",
    title: s.title,
    body: s.body,
    meta: s.era,
  }));
  const types: CardItem[] = TAFSIR_TYPES.map((t) => ({
    id: `type-${t.id}`,
    category: "أنواع التفسير",
    title: t.title,
    body: t.desc,
    example: t.example,
    rank: t.rank,
    meta: t.rank,
  }));
  const principles: CardItem[] = TAFSIR_PRINCIPLES.map((p) => ({
    id: `principle-${p.id}`,
    category: "أصول التفسير",
    title: p.title,
    body: p.body,
    source: p.source,
    note: p.source ? `المصدر: ${p.source}` : undefined,
  }));
  const conditions: CardItem[] = MUFASSIR_CONDITIONS.map((c) => ({
    id: `cond-${c.id}`,
    category: "شروط المفسّر",
    title: c.title,
    body: c.body,
  }));
  const terms: CardItem[] = TAFSIR_TERMS.map((t) => ({
    id: `term-${t.id}`,
    category: "مصطلحات",
    title: t.term,
    body: t.definition,
    note: t.note,
  }));
  const mufassirun: CardItem[] = MUFASSIRUN.map((m) => ({
    id: `muf-${m.id}`,
    category: "المفسرون",
    title: m.name,
    body: m.kitab,
    note: [m.school, m.note].filter(Boolean).join(" — "),
    libraryId: m.libraryId,
    meta: m.era,
  }));
  return [...history, ...types, ...principles, ...conditions, ...terms, ...mufassirun];
}

const ALL_CARDS = buildCards();

export default function TafsirPage() {
  const [category, setCategory] = useState<TafsirCategory>("الكل");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/tafsir",
      title: "علم التفسير",
      description:
        "موسوعة علم التفسير: طبقات المفسرين وكتبهم، وأصول التفسير، وتفسير كامل للقرآن آيةً آية في المصحف عبر الميسّر والجلالين والبغوي والقرطبي والوسيط.",
      keywords: [
        "تفسير",
        "علم التفسير",
        "أصول التفسير",
        "كتب التفسير",
        "المفسرون",
        "التفسير بالمأثور",
        "ابن كثير",
        "الطبري",
        "السعدي",
        "تفسير الميسّر",
        "تفسير القرطبي",
        "تفسير البغوي",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "علم التفسير",
          description:
            "موسوعة علم التفسير على منهج أهل السنة مع طبقات المفسرين وتفسير كامل للآيات في المصحف.",
          url: "https://www.ssunnah.com/tafsir",
          inLanguage: "ar",
          isPartOf: { "@type": "WebSite", name: "سُنّة", url: "https://www.ssunnah.com" },
        },
      ],
    });
  }, []);

  const filtered = useMemo(() => {
    return ALL_CARDS.filter((card) => {
      if (category !== "الكل" && card.category !== category) return false;
      return true;
    });
  }, [category]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { الكل: ALL_CARDS.length };
    for (const cat of TAFSIR_CATEGORIES) {
      if (cat === "الكل") continue;
      counts[cat] = ALL_CARDS.filter((c) => c.category === cat).length;
    }
    return counts;
  }, []);

  return (
    <SectionTemplatePage
      route="/tafsir"
      eyebrow="القرآن الكريم · أشرف العلوم موضوعًا"
      title="علم التفسير"
      subtitle="بيان معاني كلام الله على منهج أهل السنة: بالمأثور ثم بالرأي المنضبط، مع تاريخ العلم، شروط المفسّر، المصطلحات، أشهر الكتب، ومسار دراسة مرتّب."
      groupTitle="أقسام علم التفسير"
    >
    <main className="tf-page" dir="rtl">
      <section className="tf-stats" aria-label="إحصاءات القسم">
          <div className="tf-stat">
            <strong>{toArabicDigits(TAFSIR_STAGES.length)}</strong>
            <span>مراحل تاريخ</span>
          </div>
          <div className="tf-stat">
            <strong>{toArabicDigits(TAFSIR_TYPES.length)}</strong>
            <span>أنواع</span>
          </div>
          <div className="tf-stat">
            <strong>{toArabicDigits(TAFSIR_PRINCIPLES.length)}</strong>
            <span>أصول</span>
          </div>
          <div className="tf-stat">
            <strong>{toArabicDigits(MUFASSIRUN.length)}</strong>
            <span>مفسّرًا</span>
          </div>
          <div className="tf-stat">
            <strong>{toArabicDigits(TAFSIR_TERMS.length)}</strong>
            <span>مصطلحًا</span>
          </div>
          <div className="tf-stat">
            <strong>{toArabicDigits(BOOK_SPOTLIGHTS.length)}</strong>
            <span>مختارات</span>
          </div>
      </section>

      <section className="tf-intro-block" aria-labelledby="tf-def-title">
        <h2 id="tf-def-title" className="tf-section__title">
          ما هو علم التفسير؟
        </h2>
        <p className="tf-intro">{TAFSIR_DEFINITION}</p>
        <div className="tf-intro-paras">
          {TAFSIR_INTRO_PARAS.map((para) => (
            <p key={para.slice(0, 32)}>{para}</p>
          ))}
        </div>
      </section>

      <nav className="tf-cta" aria-label="مداخل سريعة">
        <Link href="/mushaf" className="tf-cta__link">
          <strong>المصحف الشريف</strong>
          <span>اقرأ مع أدوات الاستكشاف</span>
        </Link>
        <Link href="/ulum-quran" className="tf-cta__link">
          <strong>علوم القرآن</strong>
          <span>النزول والجمع والإعجاز</span>
        </Link>
        <Link href="/lessons" className="tf-cta__link">
          <strong>مسار التفسير</strong>
          <span>تعلّم منظّم مرحلي</span>
        </Link>
        <Link href="/hadith-science" className="tf-cta__link">
          <strong>علوم الحديث</strong>
          <span>لتمييز الرواية في التفسير</span>
        </Link>
        <Link href="/quran-hub" className="tf-cta__link">
          <strong>مركز القرآن الكريم</strong>
          <span>بوابة أقسام القرآن</span>
        </Link>
      </nav>

      <section className="tf-section tf-mushaf-section" aria-labelledby="tf-mushaf-title">
        <div className="tf-section-head">
          <BookMarked size={18} aria-hidden />
          <h2 id="tf-mushaf-title" className="tf-section__title">
            التفسير الكامل في المصحف
          </h2>
        </div>
        <p className="tf-section-lead">
          افتح أي آية في المصحف واختر أحد التفاسير التالية — نصوص كاملة للقرآن عبر مصدر موثوق، مع التنبيه عند الحاجة.
          في القسم تجد أيضاً طبقات المفسرين ({toArabicDigits(MUFASSIRUN.length)} علماً) وأصول التفسير.
        </p>
        <div className="tf-editions-grid">
          {MUSHAF_TAFSIR_EDITIONS.map((ed) => (
            <article key={ed.id} className="tf-edition-card">
              <div className="tf-edition-card__level">{ed.level}</div>
              <h3>{ed.label}</h3>
              <p className="tf-edition-card__author">{ed.author}</p>
              {ed.caution ? <p className="tf-edition-card__caution">{ed.caution}</p> : null}
              <Link href="/mushaf" className="tf-inline-link">
                افتح في المصحف
                <ChevronLeft size={14} aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="tf-section tf-timeline-section" aria-labelledby="tf-history-title">
        <div className="tf-section-head">
          <History size={18} aria-hidden />
          <h2 id="tf-history-title" className="tf-section__title">
            نشأة التفسير ومراحله
          </h2>
        </div>
        <p className="tf-section-lead">
          من بيان النبي ﷺ إلى مدارس الصحابة والتابعين فالتدوين فالعصر الحديث — مراحل موجّهة للدارس.
        </p>
        <ol className="tf-timeline">
          {TAFSIR_STAGES.map((stage, index) => (
            <li key={stage.id} className="tf-timeline__item">
              <span className="tf-timeline__num" aria-hidden>
                {toArabicDigits(index + 1)}
              </span>
              <div className="tf-timeline__body">
                <div className="tf-timeline__meta">{stage.era}</div>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="tf-section tf-path-section" aria-labelledby="tf-path-title">
        <div className="tf-section-head">
          <GraduationCap size={18} aria-hidden />
          <h2 id="tf-path-title" className="tf-section__title">
            مسار دراسة مقترح
          </h2>
        </div>
        <p className="tf-section-lead">
          ترتيب عملي من التلاوة إلى التعمّق في علم التفسير.
        </p>
        <div className="tf-path-grid">
          {STUDY_PATH.map((step) => (
            <article key={step.id} className="tf-path-card">
              <span className="tf-path-card__num">{toArabicDigits(step.step)}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.href && step.hrefLabel ? (
                <Link href={step.href} className="tf-inline-link">
                  {step.hrefLabel}
                  <ChevronLeft size={14} aria-hidden />
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="tf-controls">
        <div className="tf-cats" role="tablist" aria-label="تصفية حسب الباب">
          {TAFSIR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              role="tab"
              type="button"
              className={`tf-cat-chip${category === cat ? " tf-cat-chip--active" : ""}`}
              onClick={() => setCategory(cat)}
              aria-selected={category === cat}
            >
              {cat}
              <span className="tf-cat-chip__count">{toArabicDigits(categoryCounts[cat] ?? 0)}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="tf-empty">
          <BookOpen size={36} aria-hidden="true" />
          <p>لا توجد نتائج للبحث</p>
        </div>
      ) : (
        <section className="tf-section" aria-label="مواد علم التفسير">
          <div className="tf-section-head tf-section-head--between">
            <h2 className="tf-section__title">أبواب العلم</h2>
            <span className="tf-results-count">
              {toArabicDigits(filtered.length)} نتيجة
            </span>
          </div>
          <div className="tf-grid">
            {filtered.map((card) => {
              const isOpen = openId === card.id;
              return (
                <article key={card.id} className={`tf-card${isOpen ? " tf-card--open" : ""}`}>
                  <button
                    type="button"
                    className="tf-card__header"
                    onClick={() => setOpenId((prev) => (prev === card.id ? null : card.id))}
                    aria-expanded={isOpen}
                  >
                    <div>
                      <div className="tf-card__cat">{card.category}</div>
                      <div className="tf-card__term">{card.title}</div>
                    </div>
                    {card.meta ? <span className="tf-card__meta">{card.meta}</span> : null}
                  </button>
                  {isOpen ? (
                    <TextHighlightCapture
                      source="tafsir"
                      sourceId={card.id}
                      sourceTitle={card.title}
                      href="/tafsir"
                    >
                      <div className="tf-card__body">
                        <p className="tf-card__def">{card.body}</p>
                        {card.example ? (
                          <div className="tf-card__example">
                            <span className="tf-card__example-label">أمثلة:</span>
                            {card.example}
                          </div>
                        ) : null}
                        {card.note ? <div className="tf-card__note">{card.note}</div> : null}
                      </div>
                    </TextHighlightCapture>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="tf-section" aria-labelledby="tf-spotlight-title">
        <div className="tf-section-head">
          <BookMarked size={18} aria-hidden />
          <h2 id="tf-spotlight-title" className="tf-section__title">
            كتب تفسير بارزة — لماذا تبدأ بها؟
          </h2>
        </div>
        <p className="tf-section-lead">
          مختارات للبداية، مع مستوى مقترح وسبب الاختيار — والتفصيل داخل المصحف وعلوم القرآن.
        </p>
        <div className="tf-spotlight-grid">
          {BOOK_SPOTLIGHTS.map((book) => (
            <article key={book.id} className="tf-spotlight-card">
              <span className="tf-spotlight-card__level">{book.level}</span>
              <h3>{book.title}</h3>
              <p className="tf-spotlight-card__author">{book.author}</p>
              <p className="tf-spotlight-card__why">{book.why}</p>
              <Link href="/mushaf" className="tf-inline-link">
                افتح المصحف مع التفسير
                <ChevronLeft size={14} aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="tf-section" aria-labelledby="tf-books-title">
        <h2 id="tf-books-title" className="tf-section__title">
          مسارات التفسير
        </h2>
        <div className="tf-books">
          <Link href="/mushaf" className="tf-book">
            <h3 className="tf-book__title">التفسير في المصحف</h3>
            <p className="tf-book__author">اقرأ الآية مع التفسير المعتمد</p>
          </Link>
          <Link href="/ulum-quran" className="tf-book">
            <h3 className="tf-book__title">علوم القرآن</h3>
            <p className="tf-book__author">النزول والجمع وأصول التفسير</p>
          </Link>
          <Link href="/quran-hub" className="tf-book">
            <h3 className="tf-book__title">مركز القرآن</h3>
            <p className="tf-book__author">بوابة أقسام القرآن الكريم</p>
          </Link>
        </div>
        <Link href="/mushaf" className="tf-inline-link tf-inline-link--block">
          ابدأ القراءة في المصحف
          <ChevronLeft size={14} aria-hidden />
        </Link>
      </section>

      <section className="tf-section tf-caution-section" aria-labelledby="tf-caution-title">
        <div className="tf-section-head">
          <AlertTriangle size={18} aria-hidden />
          <h2 id="tf-caution-title" className="tf-section__title">
            تنبيهات منهجية
          </h2>
        </div>
        <ul className="tf-caution-list">
          {CAUTIONS.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="twh-share">
        <ShareButtons title="علم التفسير — سُنّة" url="https://www.ssunnah.com/tafsir" />
      </div>

      <section className="tf-related">
        <div className="tf-section-head">
          <ShieldCheck size={18} aria-hidden />
          <h2 className="tf-related__title">أكمل رحلتك</h2>
        </div>
        <div className="tf-related__grid">
          {[
            { href: "/quran-hub", label: "مركز القرآن الكريم" },
            { href: "/mushaf", label: "المصحف" },
            { href: "/ulum-quran", label: "علوم القرآن" },
            { href: "/quran-hub/tajweed", label: "علم التجويد" },
            { href: "/quran/surah-stories", label: "قصص السور" },
            { href: "/duas-quran", label: "أدعية القرآن" },
            { href: "/hadith-science", label: "علوم الحديث" },
            { href: "/lessons", label: "مسار التفسير" },
            { href: "/tafsir", label: "علم التفسير" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="tf-related__link">
              {label}
            </Link>
          ))}
        </div>
      </section>
      <div className="px-4 pb-6 mt-4">
      </div>
    </main>
    </SectionTemplatePage>
  );
}
