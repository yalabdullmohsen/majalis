import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Search, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { LIBRARY_CATALOG } from "@/lib/library-catalog";
import {
  MUFASSIRUN,
  TAFSIR_CATEGORIES,
  TAFSIR_DEFINITION,
  TAFSIR_PRINCIPLES,
  TAFSIR_TYPES,
  type TafsirCategory,
} from "@/lib/tafsir-seed";
import { toArabicDigits } from "@/lib/utils";
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
};

function buildCards(): CardItem[] {
  const types: CardItem[] = TAFSIR_TYPES.map((t) => ({
    id: `type-${t.id}`,
    category: "أنواع التفسير",
    title: t.title,
    body: t.desc,
    example: t.example,
  }));
  const principles: CardItem[] = TAFSIR_PRINCIPLES.map((p) => ({
    id: `principle-${p.id}`,
    category: "أصول التفسير",
    title: p.title,
    body: p.body,
  }));
  const mufassirun: CardItem[] = MUFASSIRUN.map((m) => ({
    id: `muf-${m.id}`,
    category: "المفسرون",
    title: m.name,
    body: m.kitab,
    note: m.note,
    libraryId: m.libraryId,
    meta: m.era,
  }));
  return [...types, ...principles, ...mufassirun];
}

const ALL_CARDS = buildCards();

const TAFSIR_BOOKS = LIBRARY_CATALOG.filter((b) => b.category === "تفسير").slice(0, 12);

export default function TafsirPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TafsirCategory>("الكل");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/tafsir",
      title: "علم التفسير",
      description:
        "مقدمة في علم التفسير — أنواعه وأصوله وأشهر كتب المفسرين، مع روابط للمكتبة والمصحف.",
      keywords: ["تفسير", "علم التفسير", "أصول التفسير", "كتب التفسير", "المفسرون"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "علم التفسير",
          description:
            "مقدمة في علم التفسير وأنواعه وأصوله وأشهر كتب المفسرين في المجلس العلمي.",
          url: "https://www.majlisilm.com/tafsir",
          inLanguage: "ar",
          isPartOf: { "@type": "WebSite", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
        },
      ],
    });
  }, []);

  const filtered = useMemo(() => {
    return ALL_CARDS.filter((card) => {
      if (category !== "الكل" && card.category !== category) return false;
      if (!query.trim()) return true;
      return arabicMatchAny(
        [card.title, card.body, card.example, card.note, card.meta].filter(Boolean) as string[],
        query,
      );
    });
  }, [category, query]);

  return (
    <main className="tf-page" dir="rtl">
      <section className="tf-hero">
        <span className="tf-hero__badge">القرآن الكريم</span>
        <h1 className="tf-hero__title">علم التفسير</h1>
        <p className="tf-hero__sub">
          بيان معاني كلام الله على منهج أهل السنة: بالمأثور ثم بالرأي المنضبط، مع أشهر كتب المفسرين وروابط المكتبة والمصحف.
        </p>
        <div className="tf-stats">
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
            <strong>{toArabicDigits(TAFSIR_BOOKS.length)}</strong>
            <span>كتابًا</span>
          </div>
        </div>
      </section>

      <p className="tf-intro">{TAFSIR_DEFINITION}</p>

      <nav className="tf-cta" aria-label="مداخل سريعة">
        <Link href="/mushaf" className="tf-cta__link">
          <strong>المصحف الشريف</strong>
          <span>اقرأ مع التفسير الميسّر للآيات</span>
        </Link>
        <Link href="/library?cat=تفسير" className="tf-cta__link">
          <strong>كتب التفسير</strong>
          <span>مكتبة التفاسير المرجعية</span>
        </Link>
        <Link href="/ulum-quran" className="tf-cta__link">
          <strong>علوم القرآن</strong>
          <span>النزول والجمع والإعجاز</span>
        </Link>
        <Link href="/learning/paths/tafseer" className="tf-cta__link">
          <strong>مسار التفسير</strong>
          <span>تعلّم منظّم في علم التفسير</span>
        </Link>
      </nav>

      <div className="tf-controls">
        <div className="tf-search-wrap">
          <Search size={16} className="tf-search-icon" aria-hidden="true" />
          <input
            className="tf-search"
            type="search"
            placeholder="ابحث في أنواع التفسير والأصول والمفسرين..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث في علم التفسير"
          />
          {query ? (
            <button type="button" className="tf-search-clear" onClick={() => setQuery("")} aria-label="مسح البحث">
              <X size={14} />
            </button>
          ) : null}
        </div>
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
                    <div className="tf-card__body">
                      <p className="tf-card__def">{card.body}</p>
                      {card.example ? (
                        <div className="tf-card__example">
                          <span className="tf-card__example-label">مثال:</span>
                          {card.example}
                        </div>
                      ) : null}
                      {card.note ? <div className="tf-card__note">{card.note}</div> : null}
                      {card.libraryId ? (
                        <Link href={`/library/${card.libraryId}`} className="tf-card__lib">
                          عرض الكتاب في المكتبة ←
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="tf-section" aria-labelledby="tf-books-title">
        <h2 id="tf-books-title" className="tf-section__title">من كتب التفسير في المكتبة</h2>
        <div className="tf-books">
          {TAFSIR_BOOKS.map((book) => (
            <Link key={book.id} href={`/library/${book.id}`} className="tf-book">
              <h3 className="tf-book__title">{book.title}</h3>
              <p className="tf-book__author">{book.author}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="twh-share">
        <ShareButtons title="علم التفسير — المجلس العلمي" url="https://www.majlisilm.com/tafsir" />
      </div>

      <section className="tf-related">
        <h2 className="tf-related__title">استكشف أيضاً</h2>
        <div className="tf-related__grid">
          {[
            { href: "/quran-hub", label: "مركز القرآن" },
            { href: "/mushaf", label: "المصحف" },
            { href: "/ulum-quran", label: "علوم القرآن" },
            { href: "/quran/tajweed", label: "علم التجويد" },
            { href: "/quran/surah-stories", label: "قصص السور" },
            { href: "/duas-quran", label: "أدعية القرآن" },
            { href: "/library?cat=تفسير", label: "مكتبة التفسير" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="tf-related__link">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <RelatedKnowledge kind="quran" query="تفسير" title="مواد ذات صلة بالتفسير" limit={6} />
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="quran" title="اختبر معلوماتك في علوم القرآن" count={4} />
      </div>
    </main>
  );
}
