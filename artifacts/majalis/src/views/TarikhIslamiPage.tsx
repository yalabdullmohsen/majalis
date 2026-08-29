import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { arabicMatchAny } from "@/lib/arabic-search";
import {
  getHistoryErasWithEvents,
  HISTORY_CATEGORIES,
  HISTORY_CATEGORY_ORDER,
  HISTORY_ERA_META,
  ISLAMIC_HISTORY_ITEMS,
  searchHistoryItems,
  type HistoryCategory,
  type HistoryEraMeta,
  type IslamicHistoryItem,
} from "@/data/islamic-history";
import "@/styles/pages/tarikh-islami.css";

type FilterId = HistoryCategory | "all";

const FILTER_ORDER: FilterId[] = ["all", ...HISTORY_CATEGORY_ORDER];

const LIBRARY_HISTORY = [
  { href: "/library", label: "المكتبة — كتب التاريخ" },
  { href: "/seerah", label: "السيرة النبوية" },
  { href: "/nations", label: "الأمم السابقة" },
  { href: "/methodology", label: "منهج الموقع" },
];

function filterLabel(id: FilterId): string {
  if (id === "all") return "كل العصور";
  return HISTORY_CATEGORIES[id];
}

function itemHref(item: IslamicHistoryItem): string {
  return item.portalHref || `/tarikh-islami/${item.id}`;
}

function HistoryCard({ item }: { item: IslamicHistoryItem }) {
  const isPortal = Boolean(item.portalHref);
  return (
    <Link
      href={itemHref(item)}
      className={`tarikh-card${isPortal ? " tarikh-card--portal" : ""}`}
      data-portal={isPortal ? "1" : undefined}
    >
      <span className="tarikh-card__title">{item.title}</span>
      <span className="tarikh-card__summary">{item.summary}</span>
      <span className="tarikh-card__meta">
        {[item.hijriDate || item.era, item.place].filter(Boolean).join(" · ")}
      </span>
      {isPortal && item.portalLabel ? (
        <span className="tarikh-card__portal">{item.portalLabel}</span>
      ) : null}
    </Link>
  );
}

function EraPanel({
  meta,
  events,
  open,
  onToggle,
}: {
  meta: HistoryEraMeta;
  events: IslamicHistoryItem[];
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `tarikh-era-${meta.id}`;
  return (
    <article
      className={`tarikh-era${open ? " is-open" : ""}`}
      style={{ ["--tarikh-accent" as string]: meta.accent }}
      data-era={meta.id}
    >
      <button
        type="button"
        className="tarikh-era__head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="tarikh-era__index" aria-hidden="true" />
        <span className="tarikh-era__text">
          <span className="tarikh-era__title">{meta.title}</span>
          <span className="tarikh-era__period">{meta.period}</span>
          {meta.center ? <span className="tarikh-era__center">{meta.center}</span> : null}
          <span className="tarikh-era__blurb">{meta.blurb}</span>
        </span>
        <span className="tarikh-era__count">{events.length} حدثًا</span>
        <span className="tarikh-era__chevron" aria-hidden="true" />
      </button>
      <div className="tarikh-era__body" id={panelId} hidden={!open}>
        <ol className="tarikh-era__events">
          {events.map((item, index) => (
            <li key={item.id} className="tarikh-era__event" data-step={index + 1}>
              <HistoryCard item={item} />
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export default function TarikhIslamiPage() {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [openEras, setOpenEras] = useState<Set<HistoryCategory>>(() => new Set(["seerah", "rashidun"]));

  useEffect(() => {
    applyPageSeo({
      path: "/tarikh-islami",
      title: "التاريخ الإسلامي | سُنّة",
      description:
        "ترتيب تفاعلي للدول والعصور الإسلامية وما حدث في كل منها — من قبل البعثة إلى يومنا، مع بوابة للسيرة النبوية.",
      keywords: [
        "التاريخ الإسلامي",
        "الدول الإسلامية",
        "خط زمني",
        "السيرة النبوية",
        "الخلفاء الراشدون",
        "الدولة الأموية",
        "الدولة العباسية",
        "الأندلس",
        "الدولة العثمانية",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "التاريخ الإسلامي",
          url: "https://majlisilm.com/tarikh-islami",
          description: "ترتيب تفاعلي للدول الإسلامية وأحداثها من قبل البعثة إلى يومنا",
        },
      ],
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const tab = params.get("tab");
    if (tab === "personalities") {
      setFilter("all");
      return;
    }
    if (tab && tab in HISTORY_CATEGORIES) {
      const cat = tab as HistoryCategory;
      setFilter(cat);
      setOpenEras(new Set([cat]));
    }
  }, [location]);

  const eras = useMemo(() => getHistoryErasWithEvents(), []);

  const visibleEras = useMemo(() => {
    if (filter === "all") return eras;
    return eras.filter((e) => e.meta.id === filter);
  }, [eras, filter]);

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const fromSearch = searchHistoryItems(q);
    const ids = new Set(fromSearch.map((i) => i.id));
    return ISLAMIC_HISTORY_ITEMS.filter(
      (i) =>
        ids.has(i.id) ||
        arabicMatchAny([i.title, i.summary, i.detail], q) ||
        i.sources.some((s) => arabicMatchAny([s], q)),
    );
  }, [query]);

  const toggleEra = (id: HistoryCategory) => {
    setOpenEras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenEras(new Set(HISTORY_CATEGORY_ORDER));
  const collapseAll = () => setOpenEras(new Set());

  const focusEra = (id: HistoryCategory) => {
    setFilter(id);
    setOpenEras(new Set([id]));
    requestAnimationFrame(() => {
      document.getElementById(`tarikh-rail-${id}`)?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      document.querySelector<HTMLElement>(`[data-era="${id}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <div className="page-shell tarikh-page" dir="rtl">
      <header className="tarikh-hero">
        <p className="tarikh-hero__eyebrow">الدول والعصور — تفاعلي</p>
        <h1 className="tarikh-hero__title">التاريخ الإسلامي</h1>
        <p className="tarikh-hero__lead">
          اسلك العصور بالترتيب: اضغط الدولة لترى ماذا حدث فيها. قصة النبي ﷺ عبر بوابة السيرة، ثم الخلافة
          والدول حتى يومنا هذا.
        </p>
        <ShareButtons title="التاريخ الإسلامي — سُنّة" />
      </header>

      <nav className="tarikh-rail" aria-label="مسار الدول الإسلامية">
        <button
          type="button"
          className={`tarikh-rail__chip${filter === "all" ? " is-active" : ""}`}
          onClick={() => {
            setFilter("all");
            setOpenEras(new Set(["seerah", "rashidun"]));
          }}
        >
          المسار كاملًا
        </button>
        {HISTORY_CATEGORY_ORDER.map((id, i) => {
          const meta = HISTORY_ERA_META[id];
          return (
            <button
              key={id}
              id={`tarikh-rail-${id}`}
              type="button"
              className={`tarikh-rail__chip${filter === id ? " is-active" : ""}`}
              style={{ ["--tarikh-accent" as string]: meta.accent }}
              onClick={() => focusEra(id)}
            >
              <span className="tarikh-rail__n">{i + 1}</span>
              <span className="tarikh-rail__label">{meta.title}</span>
              <span className="tarikh-rail__period">{meta.period}</span>
            </button>
          );
        })}
      </nav>

      <div className="tarikh-toolbar">
        <label className="tarikh-search">
          <span className="sr-only">بحث في التاريخ الإسلامي</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن حدث أو دولة…"
            autoComplete="off"
          />
        </label>
        {!query ? (
          <div className="tarikh-era-actions">
            <div className="tarikh-era-actions__row">
              <button type="button" className="tarikh-text-btn" onClick={expandAll}>
                فتح كل الدول
              </button>
              <button type="button" className="tarikh-text-btn" onClick={collapseAll}>
                طيّ الكل
              </button>
            </div>
            <div className="tarikh-filters" role="tablist" aria-label="تصفية حسب العصر">
              {FILTER_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className={`tarikh-filter${filter === id ? " is-active" : ""}`}
                  aria-selected={filter === id}
                  onClick={() => {
                    setFilter(id);
                    if (id !== "all") setOpenEras(new Set([id]));
                  }}
                >
                  {filterLabel(id)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {query.trim() ? (
        <section className="tarikh-section">
          <h2 className="tarikh-section__title">نتائج البحث ({searchResults.length})</h2>
          {searchResults.length === 0 ? (
            <p className="tarikh-empty">لا توجد نتائج مطابقة.</p>
          ) : (
            <ul className="tarikh-card-list">
              {searchResults.map((item) => (
                <li key={item.id}>
                  <HistoryCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="tarikh-section">
          <h2 className="tarikh-section__title">
            {filter === "all" ? "الدول والعصور بالترتيب" : filterLabel(filter)}
          </h2>
          <div className="tarikh-eras" role="list">
            {visibleEras.map(({ meta, events }) => (
              <EraPanel
                key={meta.id}
                meta={meta}
                events={events}
                open={openEras.has(meta.id) || filter === meta.id}
                onToggle={() => toggleEra(meta.id)}
              />
            ))}
          </div>
        </section>
      )}

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
          <li>نرتّب الدول والعصور زمنياً، ونفتح أحداث كل دولة داخلها.</li>
          <li>نُحيل التفصيل الطويل (كالسيرة) إلى أقسامه المخصصة ببطاقة دخول.</li>
          <li>نُميّز بين ما ثبت وما اختلف فيه، ولا نُسقط أحكامًا على أعيان بلا دليل.</li>
          <li>نضبط الكلام في الصحابة والفتن بضوابط أهل السنة، ونجتنب الإسرائيليات.</li>
        </ul>
      </section>

      <SectionQuiz sectionId="islamic-history" />
    </div>
  );
}
