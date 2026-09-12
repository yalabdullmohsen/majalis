import { Link, useLocation, useRoute } from "wouter";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Droplets,
  HeartPulse,
  Leaf,
  Mountain,
  Orbit,
  PawPrint,
  ScrollText,
  Stethoscope,
  UserRound,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { InformationCard } from "@/components/ui/InformationCard";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { useAuth } from "@/components/AuthProvider";
import { getMiracles } from "@/lib/supabase";
import { AsyncDataView } from "@/components/AsyncDataView";
import {
  filterMiraclesSeed,
  getMiracleSeedBySlug,
  type MiracleSeedItem,
} from "@/lib/miracles-seed";
import { safeLoadEffect } from "@/lib/safe-load";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { ShareButtons } from "@/components/ContentActions";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { SectionEntryCard } from "@/components/ui/InternalCards";
import { TopicPage } from "@/components/topic/TopicPage";
import { KnowledgeLayout } from "@/components/knowledge";
import {
  ReadingProse,
  ReadingSectionCard,
} from "@/components/content/ReadingSectionCard";
import { RelatedContentStack } from "@/components/content/RelatedContentCard";
import { prefetchRoute } from "@/lib/prefetch-route";
import {
  MIRACLE_FIXED_CAUTION,
  MIRACLE_TOPIC_HUB,
  cleanSummaryBoilerplate,
  countMiraclesByTopic,
  extractIntro,
  extractLimitsNote,
  extractScientificNote,
  extractShariaMeaning,
  filterByTopic,
  miracleCardSummary,
  miracleCategoryChip,
  miracleMethodBadge,
  miracleShortSource,
  relatedMiracles,
  sortMiraclesMethodically,
  type MiracleTopicFilter,
} from "@/lib/miracles-ui";
import "@/styles/pages/miracles.css";
import { ListScreen } from "@/components/design-system/screens";
import "@/styles/knowledge-experience.css";


const TOPIC_ICONS: Record<Exclude<MiracleTopicFilter, "الكل">, LucideIcon> = {
  كونيات: Orbit,
  "خلق الإنسان": UserRound,
  طب: Stethoscope,
  أرض: Mountain,
  نبات: Leaf,
  حيوان: PawPrint,
  بحر: Droplets,
  زمن: Wind,
  "صحة ووقاية": HeartPulse,
};

type HubLane = "quran" | "sunnah";

function laneFromPath(path: string): HubLane | "hub" | "detail" {
  if (path.startsWith("/miracles/topic/")) return "detail";
  if (path.startsWith("/miracles/quran")) return "quran";
  if (path.startsWith("/miracles/sunnah")) return "sunnah";
  return "hub";
}

function sourceLabel(lane: HubLane): "قرآن" | "سنة" {
  return lane === "quran" ? "قرآن" : "سنة";
}

export default function MiraclesPage({
  initialItems,
}: {
  initialItems?: MiracleSeedItem[];
} = {}) {
  const [location] = useLocation();
  const [, detailParams] = useRoute("/miracles/topic/:slug");
  const mode = laneFromPath(location.split("?")[0] || "/miracles");
  const slug = detailParams?.slug ? decodeURIComponent(detailParams.slug) : "";

  if (mode === "hub") return <MiraclesHub />;
  if (mode === "detail") return <MiracleDetailPage slug={slug} />;
  return (
    <MiraclesListPage
      lane={mode}
      initialItems={initialItems}
    />
  );
}

function MiraclesHub() {
  const allSeed = useMemo(() => filterMiraclesSeed(), []);
  const quranCount = allSeed.filter((m) => m.source_type === "قرآن").length;
  const sunnahCount = allSeed.filter((m) => m.source_type === "سنة").length;
  const topicCounts = useMemo(() => countMiraclesByTopic(allSeed), [allSeed]);

  useEffect(() => {
    applyPageSeo({
      path: "/miracles",
      title: "الإعجاز العلمي | سُنّة",
      description:
        "تأملات علمية منضبطة في إشارات الوحي — موضوعات ومساران: القرآن والسنة، بلا جزم قطعي بنظريات متغيّرة.",
      keywords: ["إعجاز علمي", "إعجاز القرآن", "إعجاز السنة", "إشارات كونية", "تفكر في الخلق"],
    });
  }, []);

  return (
    <TopicPage
      className="topic-page--miracles"
      themeId="quran"
      sectionRoute="/miracles"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "الأقسام", href: "/sections" },
        { label: "الإعجاز العلمي" },
      ]}
      eyebrow="تأملات منضبطة"
      title="الإعجاز العلمي"
      subtitle="موضوعات للتأمل في إشارات الوحي — بصياغة حذرة بلا مبالغة."
      quote={{
        text: "﴿سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ حَتَّىٰ يَتَبَيَّنَ لَهُمْ أَنَّهُ الْحَقُّ﴾",
        ref: "فصّلت: ٥٣",
        type: "ayah",
      }}
    >
      <KnowledgeLayout kind="library" className="mk-page mk-page--hub" data-kx="1">
        <InformationCard title="منهج العرض" tone="caution" className="mk-info-card">
          <p>
            هذا القسم يعرض وجوه تأمل علمية منضبطة، ولا يجعل النظريات المتغيرة تفسيرًا قطعيًا للنص الشرعي.
            {` ${MIRACLE_FIXED_CAUTION}`}
          </p>
        </InformationCard>

        <h2 className="mk-hub-heading">المسارات</h2>
        <div className="mk-hub-lanes hub-card-grid" role="navigation" aria-label="مسارات الإعجاز العلمي">
          <SectionEntryCard
            href="/miracles/quran"
            title="الإعجاز العلمي في القرآن الكريم"
            description="تأملات في آيات الخلق والكون — يُستأنس بها ولا تُجعل تفسيرًا قطعيًا."
            meta={`${quranCount} موضوعًا`}
            Icon={BookOpen}
            variant="detailed"
            className="mk-lane-card mk-lane-card--quran"
          />
          <SectionEntryCard
            href="/miracles/sunnah"
            title="الإعجاز العلمي في السنة النبوية"
            description="إشارات عند ثبوت الحديث — بصياغة: يذكر بعض الباحثين / وجه تأمل."
            meta={`${sunnahCount} موضوعًا`}
            Icon={ScrollText}
            variant="detailed"
            className="mk-lane-card mk-lane-card--sunnah"
          />
        </div>

        <h2 className="mk-hub-heading">الموضوعات</h2>
        <div className="mk-topic-grid" role="navigation" aria-label="موضوعات الإعجاز العلمي">
          {MIRACLE_TOPIC_HUB.map((topic) => {
            const count = topicCounts[topic.topic] || 0;
            if (!count) return null;
            const Icon = TOPIC_ICONS[topic.topic];
            const countLabel = count === 1 ? "موضوع واحد" : `${count} مواضيع`;
            return (
              <SectionEntryCard
                key={topic.topic}
                href={`/miracles/quran?topic=${encodeURIComponent(topic.topic)}`}
                title={topic.title}
                description={topic.description}
                meta={countLabel}
                Icon={Icon}
                variant="compact"
                className="mk-topic-card"
              />
            );
          })}
        </div>

        <ExploreAlsoNav
          title="استكشف أيضًا"
          links={[
            { href: "/quran-hub", label: "مركز القرآن الكريم" },
            { href: "/tafsir", label: "علم التفسير" },
            { href: "/hadith", label: "الحديث الشريف" },
            { href: "/methodology", label: "منهج الموقع" },
          ]}
        />
      </KnowledgeLayout>
    </TopicPage>
  );
}


function MiraclesListPage({
  lane,
  initialItems,
}: {
  lane: HubLane;
  initialItems?: MiracleSeedItem[];
}) {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  const sourceType = sourceLabel(lane);
  const topicParam = useMemo((): MiracleTopicFilter => {
    const q = location.includes("?") ? location.split("?")[1] : "";
    const raw = new URLSearchParams(q).get("topic") || "";
    if (!raw || raw === "الكل") return "الكل";
    return raw as MiracleTopicFilter;
  }, [location]);
  const title =
    lane === "quran"
      ? "الإعجاز العلمي في القرآن الكريم"
      : "الإعجاز العلمي في السنة النبوية";
  const seedForLane = useMemo(
    () => sortMiraclesMethodically(filterMiraclesSeed({ sourceType })),
    [sourceType],
  );
  const [items, setItems] = useState<MiracleSeedItem[]>(() => {
    if (initialItems?.length) {
      return sortMiraclesMethodically(initialItems.filter((i) => i.source_type === sourceType));
    }
    return seedForLane;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [openSources, setOpenSources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    applyPageSeo({
      path: lane === "quran" ? "/miracles/quran" : "/miracles/sunnah",
      title: `${title} | سُنّة`,
      description:
        lane === "quran"
          ? "موضوعات تأمل علمي منضبطة في آيات القرآن — بلا جزم قطعي بالنظريات المعاصرة."
          : "موضوعات تأمل علمي منضبطة في السنة الثابتة — بلا عرض لما لم يثبت.",
      keywords: ["إعجاز علمي", title, "إشارات كونية"],
    });
  }, [lane, title]);

  /* عند تبديل المسار: اعرض البذرة فورًا ثم حدّث في الخلفية */
  useEffect(() => {
    setItems(seedForLane);
    setError(null);
  }, [seedForLane]);

  useEffect(() => {
    setError(null);
    return safeLoadEffect(
      setLoading,
      () => getMiracles({ sourceType }),
      ({ data }) => {
        const rows = ((data as MiracleSeedItem[]) ?? []).filter(
          (m) => m.source_type === sourceType && m.verification_status !== "needs_review",
        );
        if (rows.length) setItems(sortMiraclesMethodically(rows));
      },
      (msg) => {
        /* لا تفرّغ القائمة عند فشل إعادة الجلب — أبقِ البذرة/البيانات السابقة */
        setError(msg);
      },
      { label: `miracles-list:${sourceType}:${reloadKey}` },
    );
  }, [sourceType, reloadKey]);

  /* هيكل فقط عند أول دخول بلا أي عناصر (بذرة أو شبكة) */
    const visibleItems = useMemo(() => {
    if (topicParam === "الكل") return items;
    return filterByTopic(items, topicParam);
  }, [items, topicParam]);

  const status =
    loading && items.length === 0
      ? "loading"
      : error && items.length === 0
        ? "error"
        : items.length === 0
          ? "empty"
          : "success";

  return (
    <TopicPage
      className="topic-page--miracles"
      themeId="quran"
      sectionRoute="/miracles"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "الإعجاز العلمي", href: "/miracles" },
        { label: title },
      ]}
      eyebrow="الإعجاز العلمي"
      title={title}
      subtitle={
        lane === "quran"
          ? "موضوعات قرآنية فقط — وجه تأمل وإشارة، لا تفسير قطعي بنظرية معاصرة."
          : "موضوعات من السنة الثابتة فقط — ما لم يثبت لا يُعرض."
      }
    >
      <div className={`mk-page mk-page--list mk-page--${lane}`} dir="rtl">
        <AsyncDataView
          status={status}
          error={error}
          onRetry={() => setReloadKey((k) => k + 1)}
          emptyText="لا توجد موضوعات معتمدة في هذا المسار حاليًا."
          keepContentWhileLoading
          contentBusy={loading && items.length > 0}
        >
          <div className="mk-grid">
            {visibleItems.map((item) => {
              const badge = miracleMethodBadge(item);
              const summary = miracleCardSummary(item);
              const shortSrc = miracleShortSource(item.scholarly_source);
              const sourcesOpen = Boolean(openSources[item.id]);

              return (
                <article key={item.id} className={`mk-card mk-card--${lane} soft-card soft-card--on-light`}>
                  <Link
                    href={`/miracles/topic/${encodeURIComponent(item.slug)}`}
                    className="mk-card__hit mj-pressable"
                    aria-label={`اقرأ تفصيل: ${item.title}`}
                    onPointerEnter={() =>
                      prefetchRoute(`/miracles/topic/${encodeURIComponent(item.slug)}`)
                    }
                    onPointerDown={() =>
                      prefetchRoute(`/miracles/topic/${encodeURIComponent(item.slug)}`)
                    }
                  >
                  <header className="mk-card__head">
                    <h2 className="mk-card__title">{item.title}</h2>
                    <div className="mk-card__meta">
                      <span className="mk-pill mk-pill--topic">{miracleCategoryChip(item)}</span>
                      <span
                        className={`mk-pill mk-pill--method mk-pill--${
                          badge === "يحتاج حذر"
                            ? "warn"
                            : badge === "تأمل منضبط"
                              ? "caution"
                              : "signal"
                        }`}
                      >
                        {badge}
                      </span>
                    </div>
                  </header>

                  {(item.verse || item.reference) && (
                    <p className="mk-card__ref">
                      {item.verse ? (
                        <span className="mk-card__ref-text">﴿ {item.verse} ﴾</span>
                      ) : null}
                      {item.reference ? (
                        <span className="mk-card__ref-cite">{item.reference}</span>
                      ) : null}
                    </p>
                  )}

                  <p className="mk-card__summary">{summary}</p>

                  {shortSrc ? (
                    <div className="mk-card__sources">
                      <button
                        type="button"
                        className="mk-sources-toggle"
                        aria-expanded={sourcesOpen}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenSources((prev) => ({ ...prev, [item.id]: !sourcesOpen }));
                        }}
                      >
                        {sourcesOpen ? "إخفاء المصادر" : "إظهار المصادر"}
                      </button>
                      {sourcesOpen ? (
                        <p className="mk-card__source-line">{item.scholarly_source}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mk-card__footer">
                    <span className="mk-expand-btn" aria-hidden="true">
                      <BookOpen size={14} strokeWidth={2} aria-hidden="true" />
                      اقرأ التفصيل
                      <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
                    </span>
                  </div>
                  </Link>

                  {isAdmin && <AdminQuickEdit section="miracles" searchTerm={item.title} />}
                </article>
              );
            })}
          </div>
        </AsyncDataView>

        <ShareButtons title={`${title} — سُنّة`} url={`https://www.ssunnah.com/miracles/${lane}`} />

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

function MiracleDetailPage({ slug }: { slug: string }) {
  const { isAdmin } = useAuth();
  const seeded = useMemo(() => getMiracleSeedBySlug(slug), [slug]);
  const [item, setItem] = useState<MiracleSeedItem | null>(seeded);
  const [siblings, setSiblings] = useState<MiracleSeedItem[]>([]);
  const [loading, setLoading] = useState(!seeded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seeded) {
      setItem(seeded);
      setSiblings(filterMiraclesSeed({ sourceType: seeded.source_type }));
      setLoading(false);
      setError(null);
    }
    return safeLoadEffect(
      setLoading,
      () => getMiracles({ sourceType: seeded?.source_type }),
      ({ data }) => {
        const rows = ((data as MiracleSeedItem[]) ?? []).filter(
          (m) => m.verification_status !== "needs_review",
        );
        const found = rows.find((m) => m.slug === slug) || seeded || null;
        if (!found) {
          setError("الموضوع غير موجود أو غير معتمد للعرض.");
          setItem(null);
          return;
        }
        const rich = getMiracleSeedBySlug(found.slug) || found;
        if (rich.verification_status === "needs_review") {
          setError("هذا الموضوع قيد المراجعة وغير ظاهر للعامة.");
          setItem(null);
          return;
        }
        setItem(rich);
        setSiblings(rows.filter((m) => m.source_type === rich.source_type));
        setError(null);
      },
      (msg) => {
        if (!seeded) {
          setError(msg);
          setItem(null);
        }
      },
      { label: `miracle-detail:${slug}` },
    );
  }, [slug, seeded]);

  useEffect(() => {
    if (!item) return;
    applyPageSeo({
      path: `/miracles/topic/${item.slug}`,
      title: `${item.title} | الإعجاز العلمي | سُنّة`,
      description: miracleCardSummary(item),
      keywords: ["إعجاز علمي", item.title, item.category],
    });
  }, [item]);

  const listHref =
    item?.source_type === "سنة" ? "/miracles/sunnah" : "/miracles/quran";
  const related = item ? relatedMiracles(item, siblings.length ? siblings : filterMiraclesSeed({ sourceType: item.source_type })) : [];

  if (loading && !item) {
    return (
      <TopicPage
        className="topic-page--miracles"
        themeId="quran"
        sectionRoute="/miracles"
        breadcrumb={[
          { label: "الرئيسية", href: "/" },
          { label: "الإعجاز العلمي", href: "/miracles" },
          { label: "…" },
        ]}
        title="…"
        eyebrow="الإعجاز العلمي"
      >
        <div className="mk-page" dir="rtl" role="status" aria-busy="true" aria-label="تحديث المحتوى">
          <div className="mk-detail-skel" aria-hidden="true">
            <div className="mk-detail-skel__hero" />
            <div className="mk-detail-skel__line" />
            <div className="mk-detail-skel__line mk-detail-skel__line--short" />
            <div className="mk-detail-skel__card" />
            <div className="mk-detail-skel__card" />
          </div>
        </div>
      </TopicPage>
    );
  }

  if (!item) {
    return (
      <TopicPage
        className="topic-page--miracles"
        themeId="quran"
        sectionRoute="/miracles"
        breadcrumb={[
          { label: "الرئيسية", href: "/" },
          { label: "الإعجاز العلمي", href: "/miracles" },
          { label: "موضوع غير متاح" },
        ]}
        title="موضوع غير متاح"
        eyebrow="الإعجاز العلمي"
      >
        <div className="mk-page" dir="rtl">
          <p className="page-desc">{error || "تعذّر عرض هذا الموضوع."}</p>
          <Link href="/miracles" className="mk-expand-btn">العودة للإعجاز العلمي</Link>
        </div>
      </TopicPage>
    );
  }

  const intro = extractIntro(item.body);
  const meaning =
    extractShariaMeaning(item.body, item.tafsir_summary) ||
    cleanSummaryBoilerplate(item.tafsir_summary || "");
  const scientific = extractScientificNote(item.body);
  const limits = extractLimitsNote(item.body);
  const badge = miracleMethodBadge(item);

  return (
    <ListScreen compose="mark">
    <TopicPage
      className="topic-page--miracles"
      themeId="quran"
      sectionRoute="/miracles"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "الإعجاز العلمي", href: "/miracles" },
        {
          label: item.source_type === "سنة" ? "السنة" : "القرآن",
          href: listHref,
        },
        { label: item.title },
      ]}
      eyebrow="الإعجاز العلمي"
      title={item.title}
      subtitle={`${miracleCategoryChip(item)} · ${badge}`}
    >
      <KnowledgeLayout kind="reader" className={`mk-page mk-page--detail mk-page--${item.source_type === "سنة" ? "sunnah" : "quran"}`} data-kx="1">
        <article className="mk-detail">
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

          {intro && intro !== meaning ? (
            <ReadingSectionCard title="النص في سياقه" variant="default">
              <ReadingProse text={intro} />
            </ReadingSectionCard>
          ) : null}

          {meaning ? (
            <ReadingSectionCard title="المعنى الشرعي أولًا" variant="summary">
              <ReadingProse text={meaning} />
            </ReadingSectionCard>
          ) : null}

          <ReadingSectionCard title="وجه التأمل العلمي (بصياغة حذرة)" variant="default">
            <ReadingProse
              text={
                scientific ||
                "يذكر بعض الباحثين أوجه تقارب للتأمل؛ ولا يلزم منه تفسير قطعي للآية أو الحديث بنظرية معاصرة."
              }
            />
          </ReadingSectionCard>

          <ReadingSectionCard title="حدود الاستدلال" variant="default">
            <ReadingProse
              text={
                limits ||
                "الملاحظة العلمية للتأمل فقط؛ لا تُجعل النظرية المعاصرة تفسيرًا قطعيًا للنص، ولا يُبنى عليها حكم أو عقيدة."
              }
            />
          </ReadingSectionCard>

          <aside className="mk-caution" role="note">
            <AlertTriangle size={15} strokeWidth={1.8} aria-hidden="true" />
            <p>{MIRACLE_FIXED_CAUTION}</p>
          </aside>

          {item.scholarly_source ? (
            <ReadingSectionCard title="المصادر والمراجع" variant="sources">
              <ReadingProse text={item.scholarly_source} />
            </ReadingSectionCard>
          ) : null}

          {related.length > 0 ? (
            <ReadingSectionCard title="مواد ذات صلة" variant="related">
              <RelatedContentStack
                paddedForNav
                items={related.map((r) => ({
                  href: `/miracles/topic/${encodeURIComponent(r.slug)}`,
                  title: r.title,
                  category: miracleCategoryChip(r),
                  summary: miracleMethodBadge(r),
                }))}
              />
            </ReadingSectionCard>
          ) : null}
        </article>

        {isAdmin && <AdminQuickEdit section="miracles" searchTerm={item.title} />}

        <ShareButtons
          title={item.title}
          url={`https://www.ssunnah.com/miracles/topic/${encodeURIComponent(item.slug)}`}
        />
      </KnowledgeLayout>
    </TopicPage>
    </ListScreen>
  );
}
