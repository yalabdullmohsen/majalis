import { useEffect, useMemo, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { ARBAEEN_NAWAWI } from "@/lib/arbaeen-nawawi-seed";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

/* ══════════════════════════════════════════════════════════════════
   §178b، الأربعون النووية (.an-*)
   ══════════════════════════════════════════════════════════════════ */

type Category = "الكل" | "العقيدة والأصول" | "الأخلاق والمعاملات" | "الزهد والآخرة";

const CATEGORY_MAP: Record<number, Category> = {
  1: "العقيدة والأصول", 2: "العقيدة والأصول", 3: "العقيدة والأصول",
  4: "العقيدة والأصول", 5: "العقيدة والأصول", 6: "الأخلاق والمعاملات",
  7: "الأخلاق والمعاملات", 8: "العقيدة والأصول", 9: "العقيدة والأصول",
  10: "الزهد والآخرة", 11: "الأخلاق والمعاملات", 12: "الزهد والآخرة",
  13: "الأخلاق والمعاملات", 14: "الزهد والآخرة", 15: "الأخلاق والمعاملات",
  16: "الأخلاق والمعاملات", 17: "الأخلاق والمعاملات", 18: "الزهد والآخرة",
  19: "الأخلاق والمعاملات", 20: "الزهد والآخرة", 21: "الزهد والآخرة",
  22: "الزهد والآخرة", 23: "الزهد والآخرة", 24: "الأخلاق والمعاملات",
  25: "الأخلاق والمعاملات", 26: "الأخلاق والمعاملات", 27: "الأخلاق والمعاملات",
  28: "الأخلاق والمعاملات", 29: "الأخلاق والمعاملات", 30: "الأخلاق والمعاملات",
  31: "الزهد والآخرة", 32: "الزهد والآخرة", 33: "الأخلاق والمعاملات",
  34: "الأخلاق والمعاملات", 35: "الأخلاق والمعاملات", 36: "الزهد والآخرة",
  37: "الزهد والآخرة", 38: "الزهد والآخرة", 39: "الأخلاق والمعاملات",
  40: "الزهد والآخرة", 41: "الزهد والآخرة", 42: "الزهد والآخرة",
};

const CATS: Category[] = ["الكل", "العقيدة والأصول", "الأخلاق والمعاملات", "الزهد والآخرة"];

function getDayOfYear() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  return Math.floor((Date.now() - start.getTime()) / 86400000);
}

function loadRead(): Set<number> {
  try {
    const raw = localStorage.getItem("an_read");
    return raw ? new Set<number>(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveRead(s: Set<number>) {
  try { localStorage.setItem("an_read", JSON.stringify([...s])); } catch { /* storage unavailable */ }
}

export default function ArbaeenNawawiPage() {
  const todayIdx = useMemo(() => getDayOfYear() % ARBAEEN_NAWAWI.length, []);
  const todayHadith = ARBAEEN_NAWAWI[todayIdx];

  const [read, setRead] = useState<Set<number>>(loadRead);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("الكل");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showReadOnly, setShowReadOnly] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/arbaeen-nawawi",
      title: "الأربعون النووية، أحاديث نووية مشروحة | المجلس العلمي",
      description: "الأربعون حديثاً النووية مع شرح موجز وفوائد ومصدر لكل حديث، مرجع حديثي مختصر لطالب العلم.",
      keywords: ["الأربعون النووية", "أحاديث نووية", "شرح الأحاديث", "الحديث النبوي", "نووي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Book",
          name: "الأربعون النووية",
          author: { "@type": "Person", name: "الإمام النووي" },
          description: "الأربعون حديثاً النووية الجامعة لأحكام الإسلام",
          url: "https://majlisilm.com/arbaeen-nawawi",
          inLanguage: "ar",
        },
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أحاديث الأربعون النووية",
          numberOfItems: ARBAEEN_NAWAWI.length,
          itemListElement: ARBAEEN_NAWAWI.slice(0, 40).map((h, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `الحديث ${h.id}: ${h.title}`,
            url: `https://majlisilm.com/arbaeen-nawawi#hadith-${h.id}`,
          })),
        },
      ],
    });
  }, []);

  function toggleRead(id: number) {
    setRead((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveRead(next);
      return next;
    });
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return ARBAEEN_NAWAWI.filter((h) => {
      const matchCat = category === "الكل" || CATEGORY_MAP[h.id] === category;
      const matchQ = arabicMatchAny([h.title, h.text, h.explanation], query);
      const matchRead = !showReadOnly || read.has(h.id);
      return matchCat && matchQ && matchRead;
    });
  }, [query, category, showReadOnly, read]);

  const pct = ARBAEEN_NAWAWI.length ? Math.round((read.size / ARBAEEN_NAWAWI.length) * 100) : 0;

  return (
    <div className="page-shell an-page">

      {/* ── Hero ── */}
      <header className="an-hero">
        <p className="an-hero__eyebrow">السنة النبوية</p>
        <h1 className="an-hero__title">الأربعون النووية</h1>
        <p className="an-hero__sub">أربعون حديثاً جامعاً مع شرح وفوائد، متجدد يومياً</p>

        {/* تقدم القراءة */}
        <div className="an-hero__progress">
          <div className="an-prog">
            <div
              className="an-prog__bar"
              style={{ "--an-pct": `${pct}%` } as React.CSSProperties}
            />
          </div>
          <span className="an-prog__label">
            {read.size} / {ARBAEEN_NAWAWI.length} مقروء ({pct}%)
          </span>
          {read.size > 0 && (
            <button
              type="button"
              className="an-reset-btn"
              onClick={() => { setRead(new Set()); saveRead(new Set()); }}
            >
              إعادة تعيين
            </button>
          )}
        </div>
      </header>

      {/* ── حديث اليوم ── */}
      <section className="an-today" aria-label="حديث اليوم">
        <div className="an-today__badge">✦ حديث اليوم</div>
        <div className="an-today__card">
          <span className="an-today__num">{todayHadith.id} / 40</span>
          <h2 className="an-today__title">{todayHadith.title}</h2>
          <blockquote className="an-today__text">«{todayHadith.text}»</blockquote>
          <p className="an-today__source">{todayHadith.source}</p>
          <p className="an-today__expl">{todayHadith.explanation}</p>
          <button
            type="button"
            className={`an-read-btn${read.has(todayHadith.id) ? " an-read-btn--done" : ""}`}
            onClick={() => toggleRead(todayHadith.id)}
          >
            {read.has(todayHadith.id) ? "✓ مقروء" : "تعليم كمقروء"}
          </button>
        </div>
      </section>

      {/* ── فلاتر ── */}
      <div className="an-filters">
        <input
          type="search"
          className="an-search"
          placeholder="ابحث في الأحاديث..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="البحث في الأربعين النووية"
        />
        <div className="an-cats" role="tablist" aria-label="تصفية الأربعين النووية">
          {CATS.map((c) => (
            <button
              key={c}
              role="tab"
              type="button"
              className={`an-cat${category === c ? " an-cat--active" : ""}`}
              onClick={() => setCategory(c)}
              aria-selected={category === c}
            >
              {c}
            </button>
          ))}
          {read.size > 0 && (
            <button
              type="button"
              className={`an-cat an-cat--read${showReadOnly ? " an-cat--active" : ""}`}
              onClick={() => setShowReadOnly((v) => !v)}
              aria-pressed={showReadOnly}
            >
              ✓ المقروءة ({read.size})
            </button>
          )}
        </div>
      </div>

      {/* ── قائمة الأحاديث ── */}
      {filtered.length === 0 ? (
        <p className="an-empty">لا توجد نتائج، جرب بحثاً مختلفاً</p>
      ) : (
        <div className="an-grid">
          {filtered.map((h) => {
            const isRead = read.has(h.id);
            const isExp = expanded.has(h.id);
            const isToday = h.id === todayHadith.id;
            return (
              <article
                key={h.id}
                className={`an-card${isRead ? " an-card--read" : ""}${isToday ? " an-card--today" : ""}`}
              >
                <div className="an-card__header">
                  <span className="an-card__num">{h.id}</span>
                  <h3 className="an-card__title">{h.title}</h3>
                  {isToday && <span className="an-card__today-badge">اليوم</span>}
                </div>
                <blockquote className="an-card__text">
                  {h.text.length > 120 && !isExp
                    ? `«${h.text.slice(0, 117)}…»`
                    : `«${h.text}»`}
                </blockquote>
                {isExp && (
                  <>
                    <p className="an-card__expl">{h.explanation}</p>
                    {h.benefits && (
                      <div className="an-card__benefit">
                        <span className="an-card__benefit-label">الفائدة</span>
                        <span>{h.benefits}</span>
                      </div>
                    )}
                  </>
                )}
                <footer className="an-card__footer">
                  <span className="an-card__source">{h.source}</span>
                  <div className="an-card__actions">
                    <button
                      type="button"
                      className="an-expand-btn"
                      onClick={() => toggleExpand(h.id)}
                      aria-expanded={isExp}
                    >
                      {isExp ? "طيّ" : "تفصيل"}
                    </button>
                    <button
                      type="button"
                      className={`an-read-btn an-read-btn--sm${isRead ? " an-read-btn--done" : ""}`}
                      onClick={() => toggleRead(h.id)}
                      aria-label={isRead ? "إلغاء تعليم كمقروء" : "تعليم كمقروء"}
                    >
                      {isRead ? "✓" : "قرأت"}
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <div className="twh-share">
        <ShareButtons title="الأربعون النووية — المجلس العلمي" url="https://majlisilm.com/arbaeen-nawawi" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="hadith" title="اختبر معلوماتك في الحديث النبوي" count={4} />
      </div>
    </div>
  );
}
