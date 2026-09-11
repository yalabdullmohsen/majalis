import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { HistoryStageIndicator } from "@/components/history/HistoryStageIndicator";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SEARCH_INPUT_ATTRS, handleSearchEnterKey } from "@/lib/search-input";
import {
  getAdjacentEra,
  getEraStageInfo,
  getHistoryErasWithEvents,
  getStartHereItems,
  HISTORY_CATEGORIES,
  HISTORY_CATEGORY_ORDER,
  HISTORY_ERA_META,
  HISTORY_KIND_LABELS,
  ISLAMIC_HISTORY_ITEMS,
  searchHistoryItems,
  type HistoryCategory,
  type HistoryEraMeta,
  type IslamicHistoryItem,
} from "@/data/islamic-history";
import "@/styles/pages/tarikh-islami.css";
import { DashboardScreen } from "@/components/design-system/screens";

type FilterId = HistoryCategory | "all";

const RELATED_HISTORY = [
  { href: "/seerah", label: "السيرة النبوية" },
  { href: "/nations", label: "الأمم السابقة" },
  { href: "/hadith", label: "الحديث وعلومه" },
  { href: "/methodology", label: "منهج الموقع" },
];

function filterLabel(id: FilterId): string {
  if (id === "all") return "عرض الكل";
  return HISTORY_CATEGORIES[id];
}

function detailHref(item: IslamicHistoryItem): string {
  return `/tarikh-islami/${item.id}`;
}

function HistoryCard({
  item,
  index,
}: {
  item: IslamicHistoryItem;
  index?: number;
}) {
  const isSeerahPortal = Boolean(item.portalHref) && item.category === "seerah";
  const dateLabel = [item.hijriDate, item.gregorianDate].filter(Boolean).join(" / ");
  return (
    <article
      className={`tarikh-card soft-card soft-card--on-light${item.featured ? " tarikh-card--featured" : ""}${
        isSeerahPortal ? " tarikh-card--portal" : ""
      }`}
    >
      <Link href={detailHref(item)} className="tarikh-card__hit" aria-label={item.title}>
        <div className="tarikh-card__top">
          {typeof index === "number" ? (
            <span className="tarikh-card__n" aria-label={`الحدث ${index}`}>
              {index}
            </span>
          ) : null}
          <span className="tarikh-card__cat">{HISTORY_CATEGORIES[item.category]}</span>
          <span className="tarikh-card__kind">{HISTORY_KIND_LABELS[item.kind]}</span>
          {item.startHere ? <span className="tarikh-card__badge">ابدأ من هنا</span> : null}
          {item.featured && !item.startHere ? (
            <span className="tarikh-card__badge tarikh-card__badge--featured">مفصلي</span>
          ) : null}
        </div>
        <h3 className="tarikh-card__title">{item.title}</h3>
        <p className="tarikh-card__summary">{item.summary}</p>
        <p className="tarikh-card__meta">
          {[dateLabel || item.era, item.place].filter(Boolean).join(" · ")}
        </p>
        <span className="tarikh-card__cta" aria-hidden="true">
          اقرأ التفاصيل
        </span>
      </Link>
      {isSeerahPortal && item.portalHref ? (
        <div className="tarikh-card__actions">
          <Link href={item.portalHref} className="tarikh-card__cta tarikh-card__cta--secondary">
            {item.portalLabel || "السيرة النبوية"}
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function EraPanel({
  meta,
  events,
  open,
  onToggle,
  stageIndex,
}: {
  meta: HistoryEraMeta;
  events: IslamicHistoryItem[];
  open: boolean;
  onToggle: () => void;
  stageIndex: number;
}) {
  const panelId = `tarikh-era-${meta.id}`;
  return (
    <article
      className={`tarikh-era${open ? " is-open" : ""}`}
      style={{ ["--tarikh-accent" as string]: meta.accent }}
      data-era={meta.id}
      data-stage={stageIndex}
    >
      <button
        type="button"
        className="tarikh-era__head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="tarikh-era__index" aria-hidden="true">
          {stageIndex}
        </span>
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
            <li key={item.id} className="tarikh-era__event">
              <HistoryCard item={item} index={index + 1} />
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
  const [openEras, setOpenEras] = useState<Set<HistoryCategory>>(
    () => new Set(["seerah", "rashidun"]),
  );

  useEffect(() => {
    applyPageSeo({
      path: "/tarikh-islami",
      title: "التاريخ الإسلامي | سُنّة",
      description:
        "تصفّح العصور الإسلامية بالمراحل: ابحث، صفِّ حسب العصر، وانتقل حدثًا بحدث من قبل البعثة إلى يومنا.",
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
          url: "https://www.ssunnah.com/tarikh-islami",
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
  const startHere = useMemo(() => getStartHereItems().slice(0, 8), []);

  const visibleEras = useMemo(() => {
    if (filter === "all") return eras;
    return eras.filter((e) => e.meta.id === filter);
  }, [eras, filter]);

  const activeStageCategory: HistoryCategory =
    filter === "all"
      ? openEras.size === 1
        ? ([...openEras][0] as HistoryCategory)
        : "seerah"
      : filter;

  const stageInfo = useMemo(
    () => getEraStageInfo(activeStageCategory),
    [activeStageCategory],
  );
  const adjacent = useMemo(
    () => getAdjacentEra(activeStageCategory),
    [activeStageCategory],
  );

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const fromSearch = searchHistoryItems(q);
    const ids = new Set(fromSearch.map((i) => i.id));
    return ISLAMIC_HISTORY_ITEMS.filter(
      (i) =>
        ids.has(i.id) ||
        arabicMatchAny(
          [i.title, i.summary, i.detail, i.place ?? "", ...(i.relatedPersons ?? []), ...i.sources],
          q,
        ),
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

  const showFullPath = () => {
    setFilter("all");
    setOpenEras(new Set(["seerah", "rashidun"]));
  };

  return (
    <DashboardScreen compose="mark">
    <SectionTemplatePage
      route="/tarikh-islami"
      title="التاريخ الإسلامي"
      subtitle="اختر مرحلة، ابحث عن حدث، أو ابدأ من المداخل المختارة — ثم اقرأ التفاصيل مرتّبة."
      groupTitle="الدول والعصور بالترتيب"
      className="topic-page--tarikh"
      eyebrow="خط زمني بالمراحل"
    >
      <div className="tarikh-hub">
        <nav className="tarikh-rail" aria-label="مسار العصور الإسلامية">
          <button
            type="button"
            className={`tarikh-rail__chip${filter === "all" ? " is-active" : ""}`}
            onClick={showFullPath}
          >
            <span className="tarikh-rail__label">المسار كاملاً</span>
            <span className="tarikh-rail__period">كل المراحل</span>
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

        {!query.trim() ? (
          <HistoryStageIndicator
            mode={filter === "all" ? "all" : "era"}
            stageIndex={filter === "all" ? stageInfo.index : stageInfo.index}
            stageTotal={stageInfo.total}
            eventCount={
              filter === "all"
                ? ISLAMIC_HISTORY_ITEMS.length
                : stageInfo.eventCount
            }
            meta={filter === "all" ? undefined : stageInfo.meta}
            onPrev={
              adjacent.prev
                ? () => focusEra(adjacent.prev as HistoryCategory)
                : filter !== "all"
                  ? showFullPath
                  : undefined
            }
            onNext={
              adjacent.next ? () => focusEra(adjacent.next as HistoryCategory) : undefined
            }
            prevLabel={
              adjacent.prev
                ? HISTORY_ERA_META[adjacent.prev].title
                : filter !== "all"
                  ? "المسار كاملاً"
                  : undefined
            }
            nextLabel={adjacent.next ? HISTORY_ERA_META[adjacent.next].title : undefined}
          />
        ) : null}

        <div className="tarikh-toolbar">
          <label className="tarikh-search">
            <span className="sr-only">بحث في التاريخ الإسلامي</span>
            <input
              {...SEARCH_INPUT_ATTRS}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => handleSearchEnterKey(e)}
              placeholder="ابحث عن حدث أو شخصية أو مكان…"
            />
          </label>
          {!query ? (
            <div className="tarikh-era-actions">
              <div className="tarikh-era-actions__row">
                <button type="button" className="tarikh-text-btn" onClick={expandAll}>
                  فتح كل المراحل
                </button>
                <button type="button" className="tarikh-text-btn" onClick={collapseAll}>
                  طي الكل
                </button>
                <button type="button" className="tarikh-text-btn" onClick={showFullPath}>
                  عرض الكل
                </button>
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
          <>
            {filter === "all" && startHere.length > 0 ? (
              <section
                className="tarikh-section tarikh-section--start"
                aria-labelledby="tarikh-start-heading"
              >
                <h2 id="tarikh-start-heading" className="tarikh-section__title">
                  ابدأ من هنا
                </h2>
                <p className="tarikh-section__lede">
                  مداخل مختارة للقارئ الجديد — ثم أكمل عبر المراحل بالترتيب.
                </p>
                <ul className="tarikh-card-list tarikh-card-list--compact">
                  {startHere.map((item) => (
                    <li key={item.id}>
                      <HistoryCard item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section className="tarikh-section">
              <h2 className="tarikh-section__title">
                {filter === "all" ? "المراحل بالترتيب" : filterLabel(filter)}
              </h2>
              <div className="tarikh-eras" role="list">
                {visibleEras.map(({ meta, events }) => (
                  <EraPanel
                    key={meta.id}
                    meta={meta}
                    events={events}
                    stageIndex={HISTORY_CATEGORY_ORDER.indexOf(meta.id) + 1}
                    open={openEras.has(meta.id) || filter === meta.id}
                    onToggle={() => toggleEra(meta.id)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        <section className="tarikh-section tarikh-section--muted">
          <h2 className="tarikh-section__title">روابط ذات صلة</h2>
          <div className="tarikh-related-links">
            {RELATED_HISTORY.map((l) => (
              <Link key={l.href} href={l.href} className="tarikh-chip">
                {l.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="tarikh-section tarikh-method">
          <h2 className="tarikh-section__title">منهجنا في التاريخ</h2>
          <ul className="tarikh-method__list">
            <li>نرتّب العصور زمنياً، ونفتح أحداث كل مرحلة داخلها.</li>
            <li>نُبقي تفاصيل السيرة النبوية في قسمها، مع ربط واضح من أحداث السيرة.</li>
            <li>نُميّز بين ما ثبت وما اختلف فيه، ولا نُسقط أحكامًا على أعيان بلا دليل.</li>
            <li>نضبط الكلام في الصحابة والفتن بضوابط أهل السنة، ونجتنب الإسرائيليات.</li>
          </ul>
        </section>

        <div className="tarikh-share">
          <ShareButtons title="التاريخ الإسلامي — سُنّة" />
        </div>

        <SectionQuiz sectionId="islamic-history" />
      </div>
    </SectionTemplatePage>
    </DashboardScreen>
  );
}
