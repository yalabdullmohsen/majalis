import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Search,
  ScrollText,
} from "lucide-react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { useAuth } from "@/components/AuthProvider";
import { getMiracles } from "@/lib/supabase";
import { AsyncDataView } from "@/components/AsyncDataView";
import type { MiracleSeedItem } from "@/lib/miracles-seed";
import { safeLoadEffect } from "@/lib/safe-load";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { ShareButtons } from "@/components/ContentActions";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { TopicPage } from "@/components/topic/TopicPage";
import {
  MIRACLE_FIXED_CAUTION,
  MIRACLE_TOPIC_FILTERS,
  type MiracleTopicFilter,
  cleanSummaryBoilerplate,
  extractIntro,
  extractLimitsNote,
  extractScientificNote,
  extractShariaMeaning,
  filterByTopic,
  miracleCardSummary,
  miracleMethodBadge,
  miracleShortSource,
  miracleTopicLabel,
  relatedMiracles,
  sortMiraclesMethodically,
} from "@/lib/miracles-ui";
import "@/styles/pages/miracles.css";

type SourceTypeFilter = "الكل" | "قرآن" | "سنة";

function topicFromQuery(raw: string | null): MiracleTopicFilter | null {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw);
  if ((MIRACLE_TOPIC_FILTERS as readonly string[]).includes(decoded)) {
    return decoded as MiracleTopicFilter;
  }
  // توافق مع ?cat=التصنيف القديم
  const mapped = miracleTopicLabel(decoded);
  return mapped;
}

export default function MiraclesPage({
  initialItems,
}: {
  initialItems?: MiracleSeedItem[];
} = {}) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<MiracleSeedItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<MiracleTopicFilter>("الكل");
  const [sourceType, setSourceType] = useState<SourceTypeFilter>("الكل");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromCat = topicFromQuery(params.get("cat") || params.get("topic"));
    if (fromCat) setTopic(fromCat);
    const src = params.get("src");
    if (src === "قرآن" || src === "سنة") setSourceType(src);
  }, []);

  useEffect(() => {
    applyPageSeo({
      path: "/miracles",
      title: "الإعجاز العلمي في القرآن والسنة | سُنّة",
      description:
        "تأملات علمية منضبطة في إشارات الوحي؛ بلا جزم قطعي بنظريات متغيّرة، وبلا إعجاز عددي.",
      keywords: ["إعجاز علمي", "إعجاز القرآن", "إعجاز السنة", "إشارات كونية", "تفكر في الخلق"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "الإعجاز العلمي في القرآن والسنة",
          description:
            "تأملات علمية منضبطة مع تنبيه منهجي؛ لا تُجعل النظريات تفسيراً قطعياً للنص الشرعي",
          itemListElement: MIRACLE_TOPIC_FILTERS.filter((c) => c !== "الكل").map((cat, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: cat,
            url: `https://www.ssunnah.com/miracles?topic=${encodeURIComponent(cat)}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => {
    if (initialItems && sourceType === "الكل" && reloadKey === 0) return;
    setError(null);
    return safeLoadEffect(
      setLoading,
      () =>
        getMiracles({
          sourceType: sourceType === "الكل" ? undefined : sourceType,
        }),
      ({ data }) => setItems((data as MiracleSeedItem[]) ?? []),
      (msg) => {
        setError(msg);
        setItems([]);
      },
      { label: `miracles:${sourceType}:${reloadKey}` },
    );
  }, [sourceType, initialItems, reloadKey]);

  useEffect(() => {
    if (loading) return;
    const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!hashId) return;
    setExpanded(hashId);
    const timer = window.setTimeout(() => {
      document.getElementById(hashId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [loading, items]);

  const displayed = useMemo(() => {
    let rows = sortMiraclesMethodically(filterByTopic(items, topic));
    if (search.trim()) {
      rows = rows.filter((i) =>
        arabicMatchAny(
          [i.title ?? "", i.body ?? "", i.category ?? "", i.scholarly_source ?? "", i.reference ?? ""],
          search,
        ),
      );
    }
    return rows;
  }, [items, topic, search]);

  const status = loading ? "loading" : error ? "error" : displayed.length === 0 ? "empty" : "success";

  const visibleTopics = useMemo(() => {
    const present = new Set(items.map((m) => miracleTopicLabel(m)));
    return MIRACLE_TOPIC_FILTERS.filter((t) => t === "الكل" || present.has(t));
  }, [items]);

  return (
    <TopicPage
      themeId="quran"
      sectionRoute="/miracles"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "الأقسام", href: "/sections" },
        { label: "الإعجاز العلمي في القرآن والسنة" },
      ]}
      eyebrow="تأملات منضبطة"
      title="الإعجاز العلمي في القرآن والسنة"
      subtitle="قسمان واضحان: القرآن الكريم · السنة النبوية — بصياغة علمية آمنة بلا مبالغات."
      quote={{
        text: "﴿سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ حَتَّىٰ يَتَبَيَّنَ لَهُمْ أَنَّهُ الْحَقُّ﴾",
        ref: "فصّلت: ٥٣",
        type: "ayah",
      }}
      tabs={[
        { id: "all", label: "الكل" },
        { id: "quran", label: "الإعجاز العلمي في القرآن الكريم" },
        { id: "sunnah", label: "الإعجاز العلمي في السنة النبوية" },
      ]}
      activeTab={sourceType === "قرآن" ? "quran" : sourceType === "سنة" ? "sunnah" : "all"}
      onTabChange={(id) => {
        setExpanded(null);
        if (id === "quran") setSourceType("قرآن");
        else if (id === "sunnah") setSourceType("سنة");
        else setSourceType("الكل");
      }}
      syncTabParam={false}
    >
      <div className="mk-page mk-page--embedded" dir="rtl">
        <div className="mk-hub-split" role="navigation" aria-label="أقسام الإعجاز">
          <button
            type="button"
            className={`mk-hub-split__card${sourceType === "قرآن" ? " is-active" : ""}`}
            onClick={() => {
              setSourceType("قرآن");
              setExpanded(null);
            }}
          >
            <BookOpen size={18} strokeWidth={1.8} aria-hidden="true" />
            <span className="mk-hub-split__title">الإعجاز العلمي في القرآن الكريم</span>
            <span className="mk-hub-split__desc">
              تأملات في آيات الخلق والكون — يُستأنس بها ولا تُجعل تفسيراً قطعياً.
            </span>
          </button>
          <button
            type="button"
            className={`mk-hub-split__card${sourceType === "سنة" ? " is-active" : ""}`}
            onClick={() => {
              setSourceType("سنة");
              setExpanded(null);
            }}
          >
            <ScrollText size={18} strokeWidth={1.8} aria-hidden="true" />
            <span className="mk-hub-split__title">الإعجاز العلمي في السنة النبوية</span>
            <span className="mk-hub-split__desc">
              إشارات في الحديث عند ثبوت المعنى — بصياغة: ذكر بعض الباحثين / من أوجه التأمل.
            </span>
          </button>
        </div>

        <p className="mk-hero__note">
          <AlertTriangle size={16} strokeWidth={1.8} aria-hidden="true" />
          <span>
            هذا القسم يعرض تأملات علمية منضبطة، ولا يجعل النظريات المتغيرة تفسيراً قطعياً للنص الشرعي.
            راجع{" "}
            <Link href="/quran-hub" className="mk-hero__link">
              مركز القرآن الكريم
            </Link>{" "}
            و{" "}
            <Link href="/methodology" className="mk-hero__link">
              منهج الموقع
            </Link>
            . {MIRACLE_FIXED_CAUTION}
          </span>
        </p>

        <div className="mk-search-bar">
          <form
            className="mk-search-bar__row"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="mk-search-bar__input-wrap">
              <Search size={16} strokeWidth={2} aria-hidden="true" className="mk-search-bar__icon" />
              <input
                type="search"
                className="mk-search-bar__input"
                placeholder="ابحث داخل قسم الإعجاز…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="بحث في الإعجاز العلمي"
                enterKeyHint="search"
              />
            </div>
          </form>
          {!loading && <span className="mk-search-bar__count">{displayed.length} موضوع</span>}

          <div className="mk-chips" role="toolbar" aria-label="فلتر الموضوعات">
            {visibleTopics.map((t) => (
              <button
                key={t}
                type="button"
                className={`mk-chip${topic === t ? " is-active" : ""}`}
                aria-pressed={topic === t}
                onClick={() => {
                  setTopic(t);
                  setExpanded(null);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <AsyncDataView
          status={status}
          error={error}
          onRetry={() => setReloadKey((k) => k + 1)}
          emptyText="لا توجد مواد مطابقة في هذا التصنيف. جرّب موضوعاً آخر أو أعد ضبط البحث."
        >
          <div className="mk-grid">
            {displayed.map((item) => {
              const isExpanded = expanded === item.id;
              const topicLabel = miracleTopicLabel(item);
              const badge = miracleMethodBadge(item);
              const summary = miracleCardSummary(item);
              const shortSrc = miracleShortSource(item.scholarly_source);
              const related = isExpanded ? relatedMiracles(item, displayed) : [];

              return (
                <article
                  id={item.id}
                  key={item.id}
                  className={`mk-card mk-card--${item.source_type === "سنة" ? "sunnah" : "quran"}${isExpanded ? " is-expanded" : ""}`}
                >
                  <header className="mk-card__head">
                    <h2 className="mk-card__title">{item.title}</h2>
                    <div className="mk-card__meta">
                      <span className="mk-pill mk-pill--topic">{topicLabel}</span>
                      <span className="mk-pill mk-pill--src">
                        {item.source_type === "قرآن" ? "قرآن" : "سنة"}
                      </span>
                      <span className={`mk-pill mk-pill--method mk-pill--${badge === "تأمل منضبط" ? "caution" : "signal"}`}>
                        {badge}
                      </span>
                    </div>
                  </header>

                  <p className="mk-card__summary">{summary}</p>

                  {shortSrc ? (
                    <p className="mk-card__source">
                      <ScrollText size={12} strokeWidth={1.8} aria-hidden="true" />
                      <span>{shortSrc}</span>
                    </p>
                  ) : null}

                  {isExpanded ? (
                    <MiracleDetailLazy item={item} related={related} onOpenRelated={setExpanded} />
                  ) : null}

                  <div className="mk-card__footer">
                    <button
                      type="button"
                      className="mk-expand-btn"
                      aria-expanded={isExpanded}
                      onClick={() => setExpanded(isExpanded ? null : item.id)}
                    >
                      <BookOpen size={14} strokeWidth={2} aria-hidden="true" />
                      {isExpanded ? "إخفاء التفصيل" : "اقرأ التفصيل العلمي"}
                    </button>
                  </div>

                  {isAdmin && <AdminQuickEdit section="miracles" searchTerm={item.title} />}
                </article>
              );
            })}
          </div>
        </AsyncDataView>

        {isAdmin && <AdminQuickEdit section="miracles" />}

        <ShareButtons title="الإعجاز العلمي — سُنّة" url="https://www.ssunnah.com/miracles" />

        <ExploreAlsoNav
          title="استكشف أيضًا"
          links={[
            { href: "/quran-hub", label: "مركز القرآن الكريم" },
            { href: "/tafsir", label: "علم التفسير" },
            { href: "/hadith", label: "الحديث الشريف" },
            { href: "/methodology", label: "منهج الموقع" },
          ]}
        />

        <div className="mk-content-end" role="separator" aria-label="نهاية محتوى القسم">
          نهاية محتوى القسم
        </div>
        <div className="mk-quiz-wrap">
          <SectionQuiz sectionId="quran" title="اختبر معلوماتك حول التدبر والإشارات الكونية" count={4} />
        </div>
      </div>
    </TopicPage>
  );
}

/** تفاصيل تُحمَّل فقط عند التوسيع (lazy content) */
function MiracleDetailLazy({
  item,
  related,
  onOpenRelated,
}: {
  item: MiracleSeedItem;
  related: MiracleSeedItem[];
  onOpenRelated: (id: string) => void;
}) {
  const intro = extractIntro(item.body);
  const meaning =
    extractShariaMeaning(item.body, item.tafsir_summary) ||
    cleanSummaryBoilerplate(item.tafsir_summary || "");
  const scientific = extractScientificNote(item.body);
  const limits = extractLimitsNote(item.body);

  return (
    <div className="miracle-detail is-open" aria-label="التفصيل العلمي">
      {intro ? (
        <section className="mk-detail-block">
          <h3 className="miracle-detail__label">مقدمة مختصرة</h3>
          <p className="miracle-detail__text">{intro}</p>
        </section>
      ) : null}

      {(item.verse || item.reference) && (
        <figure className="miracle-ayah">
          {item.verse ? (
            <blockquote className="miracle-ayah__text" lang="ar" dir="rtl">
              ﴿ {item.verse} ﴾
            </blockquote>
          ) : null}
          {item.reference ? (
            <figcaption className="miracle-ayah__ref">
              <BookOpen size={12} strokeWidth={2} aria-hidden="true" />
              <span>{item.reference}</span>
            </figcaption>
          ) : null}
        </figure>
      )}

      {meaning ? (
        <section className="miracle-explain" aria-label="المعنى الشرعي">
          <header className="miracle-explain__head">
            <span className="miracle-explain__mark" aria-hidden="true" />
            <h3 className="miracle-explain__label">المعنى الشرعي أولاً</h3>
          </header>
          <p className="miracle-explain__text">{meaning}</p>
        </section>
      ) : null}

      {scientific ? (
        <section className="mk-detail-block">
          <h3 className="miracle-detail__label">وجه التأمل العلمي (بصياغة حذرة)</h3>
          <p className="miracle-detail__text">{scientific}</p>
        </section>
      ) : (
        <section className="mk-detail-block">
          <h3 className="miracle-detail__label">التفصيل</h3>
          <p className="miracle-detail__text">{item.body}</p>
        </section>
      )}

      <section className="mk-detail-block">
        <h3 className="miracle-detail__label">حدود الاستدلال</h3>
        <p className="miracle-detail__text">
          {limits ||
            "الملاحظة العلمية للتأمل فقط؛ لا تُجعل النظرية المعاصرة تفسيراً قطعياً للنص، ولا يُبنى عليها حكم أو عقيدة."}
        </p>
      </section>

      {item.scholarly_source ? (
        <section className="mk-detail-block">
          <h3 className="miracle-detail__label">المصدر الشرعي والمراجع</h3>
          <p className="miracle-detail__text">{item.scholarly_source}</p>
        </section>
      ) : null}

      <aside className="mk-caution" role="note">
        <AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" />
        <p>{MIRACLE_FIXED_CAUTION}</p>
      </aside>

      {related.length > 0 ? (
        <section className="mk-related" aria-label="مواد ذات صلة من قسم الإعجاز">
          <h3 className="miracle-detail__label">مواد ذات صلة (من نفس القسم)</h3>
          <ul className="mk-related__list">
            {related.map((r) => (
              <li key={r.id}>
                <a
                  href={`#${encodeURIComponent(r.id)}`}
                  className="mk-related__link"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenRelated(r.id);
                    window.history.replaceState(null, "", `#${encodeURIComponent(r.id)}`);
                    window.setTimeout(() => {
                      document.getElementById(r.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 40);
                  }}
                >
                  <span className="mk-related__title">{r.title}</span>
                  <span className="mk-related__meta">
                    {r.source_type} · {miracleTopicLabel(r)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
