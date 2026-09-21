import { useEffect, useMemo, useState, startTransition, useDeferredValue } from "react";
import { applyPageSeo } from "@/lib/seo";
import { EMPTY } from "@/lib/ui-copy";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { SEARCH_INPUT_ATTRS, handleSearchEnterKey } from "@/lib/search-input";
import { KnowledgeSummaryCard } from "@/components/knowledge/KnowledgeSummaryCard";
import {
  buildFilterChips,
  countPublishedIslamicSectsFromMeta,
  entityKindLabelAr,
  filterIslamicSectSummaries,
  listPublishedIslamicSectSummaries,
} from "@/lib/islamic-sects";
import {
  loadKnowledgeListState,
  restoreKnowledgeListScroll,
  saveKnowledgeListState,
} from "@/lib/knowledge-list-scroll";
import "@/styles/pages/islamic-sects.css";
import { UtilityScreen } from "@/components/design-system/screens";

const LIST_PATH = "/islamic-sects";

export default function IslamicSectsPage() {
  const [saved] = useState(() =>
    typeof window !== "undefined" ? loadKnowledgeListState(LIST_PATH) : null,
  );
  const [entityKind, setEntityKind] = useState(saved?.entityKind ?? "الكل");
  const [historicalStatus, setHistoricalStatus] = useState(
    saved?.historicalStatus ?? "الكل",
  );
  const [eraBucket, setEraBucket] = useState(saved?.eraBucket ?? "الكل");
  const [legacyCategory, setLegacyCategory] = useState(
    saved?.category ?? "الكل",
  );
  const [search, setSearch] = useState(saved?.search ?? "");
  const deferredSearch = useDeferredValue(search);

  const published = useMemo(() => listPublishedIslamicSectSummaries(), []);
  const publishedTotal = countPublishedIslamicSectsFromMeta();
  const hasPublished = publishedTotal > 0;

  const filtered = useMemo(
    () =>
      hasPublished
        ? filterIslamicSectSummaries(published, {
            search: deferredSearch,
            entityKind,
            historicalStatus,
            eraBucket,
            legacyCategory,
          })
        : [],
    [
      hasPublished,
      published,
      deferredSearch,
      entityKind,
      historicalStatus,
      eraBucket,
      legacyCategory,
    ],
  );

  const entityChips = useMemo(
    () => (hasPublished ? buildFilterChips(published, "entityKind", entityKindLabelAr) : []),
    [hasPublished, published],
  );
  const statusChips = useMemo(
    () => (hasPublished ? buildFilterChips(published, "historicalStatus") : []),
    [hasPublished, published],
  );
  const eraChips = useMemo(
    () => (hasPublished ? buildFilterChips(published, "eraBucket") : []),
    [hasPublished, published],
  );
  const legacyChips = useMemo(
    () => (hasPublished ? buildFilterChips(published, "legacyCategory") : []),
    [hasPublished, published],
  );

  useEffect(() => {
    applyPageSeo({
      path: LIST_PATH,
      title: "الفرق الإسلامية — نشأتها وعقائدها | سُنّة",
      description: hasPublished
        ? "موسوعة علمية تاريخية في الفرق والمذاهب الإسلامية: تُعرض السجلات المعتمدة بعد المراجعة البشرية فقط."
        : "قسم الفرق الإسلامية قيد الإعداد. يُعرض للعامة ما اكتملت مراجعته واعتماده فقط.",
      keywords: ["فرق إسلامية", "مذاهب", "أهل السنة", "تاريخ الإسلام"],
      robots: hasPublished ? undefined : "noindex, follow",
      jsonLd: hasPublished
        ? [
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "الفرق والمذاهب الإسلامية",
              description:
                "سجلات الفرق الإسلامية المنشورة بعد مراجعة بشرية ومصادر معتمدة",
              numberOfItems: publishedTotal,
              itemListElement: published.slice(0, 20).map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: s.name,
                url: `https://www.ssunnah.com${LIST_PATH}/${s.id}`,
              })),
            },
          ]
        : undefined,
    });
  }, [hasPublished, published, publishedTotal]);

  useEffect(() => {
    if (saved && typeof saved.scrollY === "number") {
      restoreKnowledgeListScroll(saved.scrollY);
    }
  }, [saved]);

  const persistBeforeNavigate = () => {
    saveKnowledgeListState(LIST_PATH, {
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      search,
      category: legacyCategory,
      entityKind,
      historicalStatus,
      eraBucket,
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      setSearch("");
      setEntityKind("الكل");
      setHistoricalStatus("الكل");
      setEraBucket("الكل");
      setLegacyCategory("الكل");
    });
  };

  return (
    <UtilityScreen compose="mark">
      <SectionTemplatePage
        route={LIST_PATH}
        title="الفرق الإسلامية"
        subtitle={
          hasPublished
            ? "موسوعة علمية تاريخية — يُعرض للعامة ما اجتاز المراجعة البشرية فقط"
            : EMPTY.sectionPreparing
        }
        groupTitle="الفرق والمذاهب"
        className="topic-page--sects"
        eyebrow="العقيدة والتوحيد"
      >
        <div className="sect-hub">
          <p className="sect-hub__note">
            <strong>ملاحظة منهجية:</strong> العرض للعامة مقصور على السجلات المعتمدة بعد
            مراجعة بشرية ومصادر موثّقة. لا فتوى شرعية من التطبيق.
          </p>

          {!hasPublished ? (
            <div className="sect-hub__empty" role="status">
              <p>{EMPTY.sectionPreparing}</p>
            </div>
          ) : (
            <>
              <input
                {...SEARCH_INPUT_ATTRS}
                value={search}
                onChange={(e) => {
                  const v = e.target.value;
                  startTransition(() => setSearch(v));
                }}
                onKeyDown={(e) => handleSearchEnterKey(e)}
                placeholder="ابحث بالاسم أو الأسماء البديلة أو الملخص…"
                className="sect-hub__search"
                aria-label="بحث في الفرق الإسلامية المنشورة"
              />

              <div className="sect-hub__filters">
                {entityChips.length > 1 ? (
                  <>
                    <p className="sect-hub__filter-label">النوع</p>
                    <div className="sect-hub__chips" role="group" aria-label="تصفية النوع">
                      {entityChips.map((c) => (
                        <button
                          type="button"
                          key={c.value}
                          className={`sect-hub__chip${entityKind === c.value ? " is-active" : ""}`}
                          onClick={() => startTransition(() => setEntityKind(c.value))}
                        >
                          {c.label}
                          {c.value !== "الكل" ? ` (${c.count})` : ""}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                {statusChips.length > 1 ? (
                  <>
                    <p className="sect-hub__filter-label">الحالة التاريخية</p>
                    <div
                      className="sect-hub__chips"
                      role="group"
                      aria-label="تصفية الحالة التاريخية"
                    >
                      {statusChips.map((c) => (
                        <button
                          type="button"
                          key={c.value}
                          className={`sect-hub__chip${historicalStatus === c.value ? " is-active" : ""}`}
                          onClick={() =>
                            startTransition(() => setHistoricalStatus(c.value))
                          }
                        >
                          {c.label}
                          {c.value !== "الكل" ? ` (${c.count})` : ""}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                {eraChips.length > 1 ? (
                  <>
                    <p className="sect-hub__filter-label">الفترة</p>
                    <div className="sect-hub__chips" role="group" aria-label="تصفية الفترة">
                      {eraChips.map((c) => (
                        <button
                          type="button"
                          key={c.value}
                          className={`sect-hub__chip${eraBucket === c.value ? " is-active" : ""}`}
                          onClick={() => startTransition(() => setEraBucket(c.value))}
                        >
                          {c.label}
                          {c.value !== "الكل" ? ` (${c.count})` : ""}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                {legacyChips.length > 1 ? (
                  <>
                    <p className="sect-hub__filter-label">التصنيف</p>
                    <div className="sect-hub__chips" role="group" aria-label="تصفية التصنيف">
                      {legacyChips.map((c) => (
                        <button
                          type="button"
                          key={c.value}
                          className={`sect-hub__chip${legacyCategory === c.value ? " is-active" : ""}`}
                          onClick={() =>
                            startTransition(() => setLegacyCategory(c.value))
                          }
                        >
                          {c.label}
                          {c.value !== "الكل" ? ` (${c.count})` : ""}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <p className="sect-hub__results" aria-live="polite">
                {filtered.length === 0
                  ? EMPTY.searchShort
                  : `${filtered.length} من ${publishedTotal}`}
              </p>

              {filtered.length === 0 ? (
                <div className="sect-hub__empty" role="status">
                  <p>{EMPTY.search}</p>
                  <button
                    type="button"
                    className="sect-hub__chip is-active"
                    onClick={resetFilters}
                  >
                    مسح عوامل التصفية
                  </button>
                </div>
              ) : null}

              <div className="sect-hub__grid">
                {filtered.map((sect) => (
                  <KnowledgeSummaryCard
                    key={sect.id}
                    id={sect.id}
                    href={`${LIST_PATH}/${sect.id}`}
                    title={sect.name}
                    icon={sect.icon}
                    category={entityKindLabelAr(sect.entityKind)}
                    status={sect.statusLabel}
                    statusMuted={sect.historicalStatus === "historical"}
                    summary={sect.summary}
                    onNavigate={persistBeforeNavigate}
                  />
                ))}
              </div>

              <div className="sect-hub__share">
                <p className="sect-hub__share-title">شارك الفائدة</p>
                <ShareButtons
                  title="الفرق الإسلامية — سُنّة"
                  url={`https://www.ssunnah.com${LIST_PATH}`}
                />
              </div>
              <SectionQuiz
                sectionId="aqidah"
                title="اختبر معلوماتك في العقيدة والفرق"
                count={4}
              />
            </>
          )}
        </div>
      </SectionTemplatePage>
    </UtilityScreen>
  );
}
