import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { MoreHorizontal } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ARBAEEN_NAWAWI } from "@/lib/arbaeen-nawawi-seed";
import { ContentReportLink } from "@/components/ContentReportLink";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { truncateAtWord } from "@/lib/utils";
import { AppBackButton } from "@/components/common/AppBackButton";
import { HadithListCard } from "@/components/hadith/HadithListCard";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { ListScreen } from "@/components/design-system/screens";
import { KnowledgeLayout } from "@/components/knowledge";
import "@/styles/pages/arbaeen-nawawi.css";
import "@/styles/pages/hadith-design-language.css";
import "@/styles/components/hadith-list-card.css";

type Category = "الكل" | "العقيدة والأصول" | "الأخلاق والمعاملات" | "الزهد والآخرة";

const CATEGORY_MAP: Record<number, Category> = {
  1: "العقيدة والأصول",
  2: "العقيدة والأصول",
  3: "العقيدة والأصول",
  4: "العقيدة والأصول",
  5: "العقيدة والأصول",
  6: "الأخلاق والمعاملات",
  7: "الأخلاق والمعاملات",
  8: "العقيدة والأصول",
  9: "العقيدة والأصول",
  10: "الزهد والآخرة",
  11: "الأخلاق والمعاملات",
  12: "الزهد والآخرة",
  13: "الأخلاق والمعاملات",
  14: "الزهد والآخرة",
  15: "الأخلاق والمعاملات",
  16: "الأخلاق والمعاملات",
  17: "الأخلاق والمعاملات",
  18: "الزهد والآخرة",
  19: "الأخلاق والمعاملات",
  20: "الزهد والآخرة",
  21: "الزهد والآخرة",
  22: "الزهد والآخرة",
  23: "الزهد والآخرة",
  24: "الأخلاق والمعاملات",
  25: "الأخلاق والمعاملات",
  26: "الأخلاق والمعاملات",
  27: "الأخلاق والمعاملات",
  28: "الأخلاق والمعاملات",
  29: "الأخلاق والمعاملات",
  30: "الأخلاق والمعاملات",
  31: "الزهد والآخرة",
  32: "الزهد والآخرة",
  33: "الأخلاق والمعاملات",
  34: "الأخلاق والمعاملات",
  35: "الأخلاق والمعاملات",
  36: "الزهد والآخرة",
  37: "الزهد والآخرة",
  38: "الزهد والآخرة",
  39: "الأخلاق والمعاملات",
  40: "الزهد والآخرة",
  41: "الزهد والآخرة",
  42: "الزهد والآخرة",
};

const PRIMARY_CATS: Category[] = ["الكل", "العقيدة والأصول", "الأخلاق والمعاملات"];
const MORE_CATS: Category[] = ["الزهد والآخرة"];

const QUERY_KEY = "an_query_v2";
const CAT_KEY = "an_cat_v2";

function loadRead(): Set<number> {
  try {
    const raw = localStorage.getItem("an_read");
    return raw ? new Set<number>(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveRead(s: Set<number>) {
  try {
    localStorage.setItem("an_read", JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

function loadSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function ArbaeenNawawiPage() {
  const [read, setRead] = useState<Set<number>>(loadRead);
  const [query, setQuery] = useState(() => loadSession(QUERY_KEY, ""));
  const [category, setCategory] = useState<Category>(() =>
    loadSession<Category>(CAT_KEY, "الكل"),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/arbaeen-nawawi",
      title: "الأربعون النووية، أحاديث نووية مشروحة | سُنّة",
      description:
        "الأربعون حديثاً النووية مع شرح موجز وفوائد ومصدر لكل حديث، مرجع حديثي مختصر لطالب العلم.",
      keywords: ["الأربعون النووية", "أحاديث نووية", "شرح الأحاديث", "الحديث النبوي", "نووي"],
    });
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(QUERY_KEY, JSON.stringify(query));
      sessionStorage.setItem(CAT_KEY, JSON.stringify(category));
    } catch {
      /* ignore */
    }
  }, [query, category]);

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const filtered = useMemo(() => {
    return ARBAEEN_NAWAWI.filter((h) => {
      const matchCat = category === "الكل" || CATEGORY_MAP[h.id] === category;
      const matchQ = arabicMatchAny([h.title, h.text, h.explanation, h.source], query);
      return matchCat && matchQ;
    });
  }, [query, category]);

  const pct = ARBAEEN_NAWAWI.length
    ? Math.round((read.size / ARBAEEN_NAWAWI.length) * 100)
    : 0;

  const progressLabel =
    read.size === 1
      ? `حديث واحد من ${ARBAEEN_NAWAWI.length}`
      : `${read.size} من ${ARBAEEN_NAWAWI.length} • ${pct}٪`;

  const resetProgress = () => {
    if (!window.confirm("هل تريد إعادة تعيين تقدم القراءة؟")) return;
    setRead(new Set());
    saveRead(new Set());
    setMenuOpen(false);
  };

  return (
    <ListScreen compose="mark">
      <KnowledgeLayout
        kind="hadith"
        className="page-shell an-page an-page--safe"
        data-kx="1"
        data-hadith-collection="arbaeen"
      >
        <div className="an-content">
          <div className="an-toolbar" data-an-toolbar="1">
            <AppBackButton variant="inline" fallbackHref="/hadith" label="رجوع" />
            <h1 className="an-toolbar__title">الأربعون النووية</h1>
            <div className="an-toolbar__menu">
              <button
                type="button"
                className="an-toolbar__more"
                aria-label="المزيد"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={18} strokeWidth={2} aria-hidden />
              </button>
              {menuOpen ? (
                <div className="an-toolbar__dropdown" role="menu">
                  <button type="button" role="menuitem" onClick={resetProgress}>
                    إعادة تعيين التقدم
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <header className="an-summary" data-an-summary="1">
            <p className="an-summary__eyebrow">السنة النبوية</p>
            <p className="an-summary__lead">
              أربعون حديثاً جامعاً مع شرح موجز وفوائد، مرجع مختصر لطالب العلم.
            </p>
            <div className="an-summary__progress" aria-label={progressLabel}>
              <div className="an-prog" aria-hidden="true">
                <div
                  className="an-prog__bar"
                  style={{ "--an-pct": `${pct}%` } as CSSProperties}
                />
              </div>
              <span className="an-prog__label">{progressLabel}</span>
            </div>
          </header>

          <div className="an-filters">
            <label className="an-search-wrap">
              <span className="sr-only">ابحث في أحاديث الأربعين النووية</span>
              <input
                type="search"
                className="an-search"
                placeholder="ابحث في أحاديث الأربعين النووية"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                enterKeyHint="search"
                autoComplete="off"
              />
            </label>
            {query.trim() ? (
              <p className="an-results-count" aria-live="polite">
                {filtered.length === 0 ? "لا نتائج مطابقة" : `${filtered.length} نتيجة`}
              </p>
            ) : null}

            <div className="an-cats" role="tablist" aria-label="تصفية الأربعين النووية">
              {PRIMARY_CATS.map((c) => (
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
              <button
                type="button"
                className={`an-cat an-cat--more${MORE_CATS.includes(category) ? " an-cat--active" : ""}`}
                onClick={() => setMoreFiltersOpen(true)}
                aria-haspopup="dialog"
              >
                المزيد
                {MORE_CATS.includes(category) ? " · 1" : ""}
              </button>
            </div>
          </div>

          {moreFiltersOpen ? (
            <div
              className="an-filter-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="تصنيفات إضافية"
            >
              <button
                type="button"
                className="an-filter-sheet__backdrop"
                aria-label="إغلاق"
                onClick={() => setMoreFiltersOpen(false)}
              />
              <div className="an-filter-sheet__panel">
                <header className="an-filter-sheet__head">
                  <h2>التصنيفات</h2>
                  <button type="button" onClick={() => setMoreFiltersOpen(false)}>
                    إغلاق
                  </button>
                </header>
                <div className="an-filter-sheet__list">
                  {[...PRIMARY_CATS, ...MORE_CATS].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`an-cat${category === c ? " an-cat--active" : ""}`}
                      onClick={() => {
                        setCategory(c);
                        setMoreFiltersOpen(false);
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <p className="an-empty" role="status">
              لا توجد نتائج لهذا البحث أو التصنيف. جرّب عبارة أقصر أو اختر «الكل».
            </p>
          ) : (
            <div className="an-list" role="list">
              {filtered.map((h) => (
                <div key={h.id} id={`hadith-${h.id}`} role="listitem" className="an-list__item">
                  <HadithListCard
                    number={h.id}
                    title={h.title}
                    preview={truncateAtWord(h.text, 140)}
                    href={`/arbaeen-nawawi/${h.id}`}
                    read={read.has(h.id)}
                    meta={CATEGORY_MAP[h.id]}
                  />
                </div>
              ))}
            </div>
          )}

          <ContentReportLink context="الأربعون النووية — سُنّة" />
          <RelatedKnowledge
            kind="hadith"
            query="الأربعون النووية"
            title="أحاديث ذات صلة"
            limit={6}
          />
          <ExploreAlsoNav
            title="استكشف أيضًا"
            links={[
              { href: "/hadith", label: "الحديث وعلومه" },
              { href: "/hadith/sahih", label: "الأحاديث الصحيحة" },
              { href: "/hadith-science", label: "مصطلح الحديث" },
              { href: "/fawaid", label: "الفوائد" },
            ]}
          />
          <div className="an-quiz-wrap">
            <SectionQuiz
              sectionId="hadith"
              title="اختبر معلوماتك في الحديث النبوي"
              count={4}
            />
          </div>
        </div>
      </KnowledgeLayout>
    </ListScreen>
  );
}
