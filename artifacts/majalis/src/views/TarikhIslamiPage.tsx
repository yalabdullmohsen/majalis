import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { arabicMatchAny } from "@/lib/arabic-search";
import {
  getFeaturedItems,
  getStartHereItems,
  HISTORY_CATEGORIES,
  ISLAMIC_HISTORY_ITEMS,
  searchHistoryItems,
  type HistoryCategory,
  type IslamicHistoryItem,
} from "@/data/islamic-history";
import "@/styles/pages/tarikh-islami.css";

type FilterId = HistoryCategory | "all";

const FILTER_ORDER: FilterId[] = [
  "all",
  "seerah",
  "rashidun",
  "umayyad",
  "abbasid",
  "andalus",
  "seljuk-ayyubid",
  "mamluk",
  "ottoman",
  "civilization",
  "personalities",
];

const LIBRARY_HISTORY = [
  { href: "/library", label: "المكتبة — كتب التاريخ" },
  { href: "/seerah", label: "السيرة النبوية" },
  { href: "/nations", label: "الأمم السابقة" },
  { href: "/methodology", label: "منهج الموقع" },
];

function filterLabel(id: FilterId): string {
  if (id === "all") return "الكل";
  return HISTORY_CATEGORIES[id];
}

function HistoryCard({ item }: { item: IslamicHistoryItem }) {
  return (
    <Link href={`/tarikh-islami/${item.id}`} className="tarikh-card">
      <span className="tarikh-card__cat">{HISTORY_CATEGORIES[item.category]}</span>
      <span className="tarikh-card__title">{item.title}</span>
      <span className="tarikh-card__summary">{item.summary}</span>
      <span className="tarikh-card__meta">
        {[item.hijriDate, item.place].filter(Boolean).join(" · ")}
      </span>
    </Link>
  );
}

export default function TarikhIslamiPage() {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    applyPageSeo({
      path: "/tarikh-islami",
      title: "التاريخ الإسلامي | المجلس العلمي",
      description:
        "خط زمني منظم في السيرة النبوية والخلافة والدول الإسلامية والحضارة وشخصيات تاريخية مؤثرة — بمنهج أهل السنة وتمحيص الروايات.",
      keywords: [
        "التاريخ الإسلامي",
        "السيرة النبوية",
        "الخلفاء الراشدون",
        "الدولة الأموية",
        "الدولة العباسية",
        "الأندلس",
        "صلاح الدين",
        "الحضارة الإسلامية",
        "الفتوحات الإسلامية",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "التاريخ الإسلامي",
          url: "https://majlisilm.com/tarikh-islami",
          description: "فهرس دراسي في تاريخ الإسلام والحضارة الإسلامية",
        },
      ],
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const tab = params.get("tab");
    if (tab && tab in HISTORY_CATEGORIES) setFilter(tab as HistoryCategory);
  }, [location]);

  const startHere = useMemo(() => getStartHereItems(), []);
  const featured = useMemo(() => getFeaturedItems().slice(0, 8), []);

  const visible = useMemo(() => {
    const q = query.trim();
    let list = ISLAMIC_HISTORY_ITEMS;
    if (filter !== "all") list = list.filter((i) => i.category === filter);
    if (!q) return list;
    const fromSearch = searchHistoryItems(q);
    const ids = new Set(fromSearch.map((i) => i.id));
    return list.filter(
      (i) =>
        ids.has(i.id) ||
        arabicMatchAny([i.title, i.summary, i.detail], q) ||
        i.sources.some((s) => arabicMatchAny([s], q)),
    );
  }, [filter, query]);

  return (
    <div className="page-shell tarikh-page" dir="rtl">
      <header className="tarikh-hero">
        <p className="tarikh-hero__eyebrow">السيرة والتاريخ</p>
        <h1 className="tarikh-hero__title">التاريخ الإسلامي</h1>
        <p className="tarikh-hero__lead">
          من السيرة النبوية إلى الحضارة والدول — نروي بعد التمحيص، ونُبيّن درجة التوثيق، ولا نملأ الفراغ بما
          لم يثبت.
        </p>
        <ShareButtons title="التاريخ الإسلامي — المجلس العلمي" />
      </header>

      <div className="tarikh-toolbar">
        <label className="tarikh-search">
          <span className="sr-only">بحث في التاريخ الإسلامي</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن حدث أو عصر أو شخصية…"
            autoComplete="off"
          />
        </label>
        <div className="tarikh-filters" role="tablist" aria-label="تصفية حسب العصر">
          {FILTER_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`tarikh-filter${filter === id ? " is-active" : ""}`}
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
            >
              {filterLabel(id)}
            </button>
          ))}
        </div>
      </div>

      {!query && filter === "all" ? (
        <>
          <section className="tarikh-section">
            <h2 className="tarikh-section__title">ابدأ من هنا</h2>
            <ul className="tarikh-card-list tarikh-card-list--compact">
              {startHere.map((item) => (
                <li key={item.id}>
                  <HistoryCard item={item} />
                </li>
              ))}
            </ul>
          </section>

          <section className="tarikh-section">
            <h2 className="tarikh-section__title">أحداث مفصلية</h2>
            <ul className="tarikh-card-list">
              {featured.map((item) => (
                <li key={item.id}>
                  <HistoryCard item={item} />
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <section className="tarikh-section">
        <h2 className="tarikh-section__title">
          {query ? `نتائج البحث (${visible.length})` : filter === "all" ? "الخط الزمني" : filterLabel(filter)}
        </h2>
        {visible.length === 0 ? (
          <p className="tarikh-empty">لا توجد نتائج مطابقة.</p>
        ) : (
          <ul className="tarikh-card-list">
            {visible.map((item) => (
              <li key={item.id}>
                <HistoryCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarikh-section tarikh-section--muted">
        <h2 className="tarikh-section__title">كتب ومراجع من المكتبة</h2>
        <div className="tarikh-related-links">
          {LIBRARY_HISTORY.map((l) => (
            <Link key={l.href} href={l.href} className="tarikh-chip">
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="tarikh-section tarikh-method">
        <h2 className="tarikh-section__title">منهجنا في التاريخ</h2>
        <ul className="tarikh-method__list">
          <li>نُميّز بين ما ثبت وما اختلف فيه، ولا نُسقط أحكامًا على أعيان بلا دليل.</li>
          <li>في روايات الطبري وغيره: يُذكر السند ولا يُفهم تصحيح كل رواية تلقائيًا.</li>
          <li>نضبط الكلام في الصحابة والفتن بضوابط أهل السنة، ونجتنب الإسرائيليات.</li>
        </ul>
      </section>

      <SectionQuiz sectionId="islamic-history" />
    </div>
  );
}
