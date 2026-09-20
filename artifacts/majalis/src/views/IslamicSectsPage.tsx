import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { EMPTY } from "@/lib/ui-copy";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { SEARCH_INPUT_ATTRS, handleSearchEnterKey } from "@/lib/search-input";
import { KnowledgeSummaryCard } from "@/components/knowledge/KnowledgeSummaryCard";
import {
  ISLAMIC_SECTS,
  type IslamicSect,
} from "@/data/islamic-sects";
import {
  loadKnowledgeListState,
  restoreKnowledgeListScroll,
  saveKnowledgeListState,
} from "@/lib/knowledge-list-scroll";
import "@/styles/pages/islamic-sects.css";
import { UtilityScreen } from "@/components/design-system/screens";

const LIST_PATH = "/islamic-sects";
const CATEGORIES = ["الكل", "مدرسة سنية", "شيعة", "مدرسة عقدية", "فرقة مستقلة", "فرقة تاريخية"];
const STATUS_FILTER = ["الكل", "قائمة", "تاريخية"];

function needsNumericReview(sect: IslamicSect): boolean {
  return /\d+\s*[-–—]\s*\d+\s*%|\d+\s*%/.test(sect.spread || "");
}

export default function IslamicSectsPage() {
  const [saved] = useState(() =>
    typeof window !== "undefined" ? loadKnowledgeListState(LIST_PATH) : null,
  );
  const [category, setCategory] = useState(saved?.category ?? "الكل");
  const [statusF, setStatusF] = useState(saved?.status ?? "الكل");
  const [search, setSearch] = useState(saved?.search ?? "");

  useEffect(() => {
    applyPageSeo({
      path: LIST_PATH,
      title: "الفرق الإسلامية — نشأتها وعقائدها | سُنّة",
      description:
        "موسوعة علمية تاريخية في الفرق والمذاهب الإسلامية: نشأة كل فرقة وأصولها العقدية وأبرز علمائها وكتبها وانتشارها.",
      keywords: ["فرق إسلامية", "مذاهب", "أهل السنة", "الشيعة", "المعتزلة", "الخوارج", "تاريخ الإسلام"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "الفرق والمذاهب الإسلامية",
          description:
            "موسوعة الفرق الإسلامية: نشأة كل فرقة وأصولها العقدية؛ مع بيان أصول كل فرقة وعلمائها؛ موسوعة تاريخية في الفرق الإسلامية",
          numberOfItems: ISLAMIC_SECTS.length,
          itemListElement: ISLAMIC_SECTS.slice(0, 20).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.fullName || s.name,
            url: `https://www.ssunnah.com${LIST_PATH}/${s.id}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => {
    if (saved && typeof saved.scrollY === "number") {
      restoreKnowledgeListScroll(saved.scrollY);
    }
  }, [saved]);

  const filtered = ISLAMIC_SECTS.filter((s) => {
    const catOk = category === "الكل" || s.category === category;
    const stOk = statusF === "الكل" || s.status === statusF;
    const textOk =
      !search.trim() ||
      arabicMatchAny([s.name, s.fullName, s.founder, s.origin, s.foundingCause], search);
    return catOk && stOk && textOk;
  });

  const persistBeforeNavigate = () => {
    saveKnowledgeListState(LIST_PATH, {
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      search,
      category,
      status: statusF,
    });
  };

  return (
    <UtilityScreen compose="mark">
      <SectionTemplatePage
        route={LIST_PATH}
        title="الفرق الإسلامية"
        subtitle="موسوعة علمية تاريخية في الفرق والمذاهب — نشأتها وعقائدها وأبرز علمائها"
        groupTitle="الفرق والمذاهب"
        className="topic-page--sects"
        eyebrow="العقيدة والتوحيد"
      >
        <div className="sect-hub">
          <p className="sect-hub__note">
            <strong>ملاحظة منهجية:</strong> هذه الصفحة استعراض علمي تاريخي وفق ما دوّنه العلماء في
            كتب الملل والنحل والفرق، ولا تمثل فتوى شرعية. الحكم التفصيلي على الفرق يُرجع فيه إلى علماء
            أهل السنة المعتمدين.
          </p>

          <input
            {...SEARCH_INPUT_ATTRS}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => handleSearchEnterKey(e)}
            placeholder="ابحث في الفرق والمذاهب…"
            className="sect-hub__search"
            aria-label="بحث في الفرق الإسلامية"
          />

          <div className="sect-hub__filters">
            <p className="sect-hub__filter-label">التصنيف</p>
            <div className="sect-hub__chips" role="group" aria-label="تصفية التصنيف">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`sect-hub__chip${category === c ? " is-active" : ""}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="sect-hub__filter-label">الحالة</p>
            <div className="sect-hub__chips" role="group" aria-label="تصفية الحالة">
              {STATUS_FILTER.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`sect-hub__chip${statusF === s ? " is-active" : ""}`}
                  onClick={() => setStatusF(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <p className="sect-hub__results" aria-live="polite">
            {filtered.length === 0 ? EMPTY.searchShort : `${filtered.length} نتيجة`}
          </p>

          {filtered.length === 0 ? (
            <div className="sect-hub__empty" role="status">
              <p>{EMPTY.search}</p>
              <button
                type="button"
                className="sect-hub__chip is-active"
                onClick={() => {
                  setSearch("");
                  setCategory("الكل");
                  setStatusF("الكل");
                }}
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
                category={sect.category}
                status={sect.status}
                statusMuted={sect.status === "تاريخية"}
                summary={sect.foundingCause}
                reviewHint={needsNumericReview(sect) ? "يحتاج تحققًا" : undefined}
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
          <SectionQuiz sectionId="aqidah" title="اختبر معلوماتك في العقيدة والفرق" count={4} />
        </div>
      </SectionTemplatePage>
    </UtilityScreen>
  );
}
