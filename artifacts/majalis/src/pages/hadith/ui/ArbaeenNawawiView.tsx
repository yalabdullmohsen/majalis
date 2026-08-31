import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { GraduationCap, ChevronLeft } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ARBAEEN_NAWAWI } from "@/lib/arbaeen-nawawi-seed";
import { ContentReportLink } from "@/components/ContentReportLink";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { truncateAtWord } from "@/lib/utils";
import "@/styles/pages/arbaeen-nawawi.css";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";

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
      title: "الأربعون النووية، أحاديث نووية مشروحة | سُنّة",
      description: "الأربعون حديثاً النووية مع شرح موجز وفوائد ومصدر لكل حديث، مرجع حديثي مختصر لطالب العلم. محتوى معتمد في منهج سُنّة",
      keywords: ["الأربعون النووية", "أحاديث نووية", "شرح الأحاديث", "الحديث النبوي", "نووي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Book",
          name: "الأربعون النووية",
          author: { "@type": "Person", name: "الإمام النووي" },
          description: "الأربعون حديثاً النووية الجامعة لأحكام الإسلام؛ محتوى معتمد في منهج سُنّة",
          url: "https://www.ssunnah.com/arbaeen-nawawi",
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
            url: `https://www.ssunnah.com/arbaeen-nawawi#hadith-${h.id}`,
          })),
        },
      ],
    });
  }, []);

  // رابط وارد بـ`?h=<id>` (من اقتراحات البحث في search-suggestions.ts)
  // ورابط `#hadith-<id>` (من JSON-LD أعلى) كانا معطوبَين معًا: لا شيء
  // يقرأ `?h=` هنا، ولا عنصر DOM يحمل `id="hadith-<id>"` لتفعيل تمرير
  // المتصفح الطبيعي للـhash — فكان كلا الرابطين يهبط على الصفحة بحالتها
  // الافتراضية بلا أي أثر ظاهر. عطل صامت من نفس عائلة TYPE_HREF.scholar،
  // اكتُشف بالفحص المباشر 2026-07-18. صُحِّح بإضافة id مطابق لكل بطاقة
  // (يُفعِّل الـhash تلقائيًا) + قراءة `?h=` صراحةً مع توسيع وتمرير للحديث.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hParam = params.get("h");
    const hId = hParam ? Number(hParam) : NaN;
    if (!Number.isFinite(hId)) return;
    setExpanded((prev) => new Set(prev).add(hId));
    const t = window.setTimeout(() => {
      document.getElementById(`hadith-${hId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(t);
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
        <div className="an-list" role="list">
          {filtered.map((h) => {
            const isRead = read.has(h.id);
            const isExp = expanded.has(h.id);
            const isToday = h.id === todayHadith.id;
            const preview = truncateAtWord(h.text, 90);
            return (
              <article
                key={h.id}
                id={`hadith-${h.id}`}
                role="listitem"
                className={`an-row${isRead ? " an-row--read" : ""}${isToday ? " an-row--today" : ""}${isExp ? " an-row--open" : ""}`}
              >
                <button
                  type="button"
                  className="an-row__main"
                  onClick={() => toggleExpand(h.id)}
                  aria-expanded={isExp}
                  aria-controls={`hadith-body-${h.id}`}
                >
                  <span className="an-row__num" aria-hidden="true">{h.id}</span>
                  <span className="an-row__body">
                    <span className="an-row__title">{h.title}</span>
                    {!isExp && (
                      <span className="an-row__preview">«{preview}»</span>
                    )}
                  </span>
                  <ChevronLeft className="an-row__chevron" size={18} strokeWidth={2} aria-hidden="true" />
                </button>
                {isExp && (
                  <div className="an-row__detail" id={`hadith-body-${h.id}`}>
                    <blockquote className="an-row__text">«{h.text}»</blockquote>
                    <p className="an-row__expl">{h.explanation}</p>
                    {h.benefits && (
                      <div className="an-row__benefit">
                        <span className="an-row__benefit-label">الفائدة</span>
                        <span>{h.benefits}</span>
                      </div>
                    )}
                    <footer className="an-row__footer">
                      <span className="an-row__source">المصدر: {h.source}</span>
                      <div className="an-row__actions">
                        <Link href={`/arbaeen-nawawi/${h.id}`} className="an-row__action" aria-label={`صفحة تعلّم واختبار الحديث ${h.id}`}>
                          <GraduationCap size={14} strokeWidth={1.8} aria-hidden="true" /> اختبر
                        </Link>
                        <button
                          type="button"
                          className={`an-row__action${isRead ? " an-row__action--done" : ""}`}
                          onClick={() => toggleRead(h.id)}
                          aria-label={isRead ? "إلغاء تعليم كمقروء" : "تعليم كمقروء"}
                        >
                          {isRead ? "مقروء" : "قرأت"}
                        </button>
                      </div>
                    </footer>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ContentReportLink context="الأربعون النووية — سُنّة" />
      <RelatedKnowledge kind="hadith" query="الأربعون النووية" title="أحاديث ذات صلة" limit={6} />
      <div className="an-quiz-wrap">
        <SectionQuiz sectionId="hadith" title="اختبر معلوماتك في الحديث النبوي" count={4} />
      </div>
    </div>
  );
}
