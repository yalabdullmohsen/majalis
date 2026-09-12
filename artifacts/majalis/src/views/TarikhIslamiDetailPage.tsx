import { useEffect, useMemo } from "react";
import { Link, useRoute } from "wouter";
import { TopicPage } from "@/components/topic/TopicPage";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import {
  ReadingBulletList,
  ReadingProse,
  ReadingSectionCard,
} from "@/components/content/ReadingSectionCard";
import { RelatedContentStack } from "@/components/content/RelatedContentCard";
import { KnowledgeLayout } from "@/components/knowledge";
import {
  getAdjacentHistoryItems,
  getEraStageInfo,
  getHistoryItem,
  getSameEraRelated,
  HISTORY_CATEGORIES,
  HISTORY_ERA_META,
  HISTORY_KIND_LABELS,
  type VerificationLevel,
} from "@/data/islamic-history";
import "@/styles/pages/tarikh-islami.css";
import { UtilityScreen } from "@/components/design-system/screens";

const VERIFICATION_LABEL: Record<VerificationLevel, string> = {
  confirmed: "مؤكد",
  likely: "راجح",
  disputed: "مختلف فيه",
  "needs-review": "راجح",
};

type TocItem = { id: string; label: string };

export default function TarikhIslamiDetailPage() {
  const [, params] = useRoute("/tarikh-islami/:id");
  const id = params?.id ?? "";
  const item = getHistoryItem(id);

  const adjacent = useMemo(() => (item ? getAdjacentHistoryItems(item.id) : {}), [item]);
  const sameEra = useMemo(() => (item ? getSameEraRelated(item, 6) : []), [item]);
  const stage = useMemo(
    () => (item ? getEraStageInfo(item.category) : null),
    [item],
  );

  const toc = useMemo((): TocItem[] => {
    if (!item) return [];
    const items: TocItem[] = [
      { id: "tarikh-sec-summary", label: "نبذة" },
      { id: "tarikh-sec-context", label: "السياق" },
      { id: "tarikh-sec-detail", label: "الشرح" },
    ];
    if (item.causes) items.push({ id: "tarikh-sec-causes", label: "الأسباب" });
    if (item.outcomes) items.push({ id: "tarikh-sec-outcomes", label: "النتائج" });
    if (item.lessons) items.push({ id: "tarikh-sec-lessons", label: "الفوائد" });
    if (item.relatedPersons?.length) {
      items.push({ id: "tarikh-sec-persons", label: "شخصيات" });
    }
    items.push({ id: "tarikh-sec-sources", label: "المصادر" });
    return items;
  }, [item]);

  useEffect(() => {
    if (!item) {
      applyPageSeo({
        path: `/tarikh-islami/${id}`,
        title: "عنصر غير موجود | التاريخ الإسلامي",
        description: "لم يُعثر على هذا العنصر في فهرس التاريخ الإسلامي.",
        robots: "noindex, follow",
      });
      return;
    }
    applyPageSeo({
      path: `/tarikh-islami/${item.id}`,
      title: `${item.title} | التاريخ الإسلامي | سُنّة`,
      description: item.summary,
      keywords: [item.title, "التاريخ الإسلامي", HISTORY_CATEGORIES[item.category]],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: item.summary,
          inLanguage: "ar",
          about: HISTORY_CATEGORIES[item.category],
        },
      ],
    });
  }, [id, item]);

  if (!item) {
    return (
      <TopicPage
        themeId="history"
        sectionRoute="/tarikh-islami"
        breadcrumb={[
          { label: "الرئيسية", href: "/" },
          { label: "التاريخ الإسلامي", href: "/tarikh-islami" },
          { label: "غير موجود" },
        ]}
        eyebrow="التاريخ الإسلامي"
        title="عنصر غير موجود"
        subtitle="لم يُعثر على هذا العنصر في فهرس التاريخ الإسلامي."
        className="topic-page--tarikh-detail"
      >
        <Link href="/tarikh-islami" className="tarikh-link">
          العودة إلى التاريخ الإسلامي
        </Link>
      </TopicPage>
    );
  }

  const eraMeta = HISTORY_ERA_META[item.category];
  const eraHref = `/tarikh-islami?tab=${item.category}`;
  const isSeerahPortal = Boolean(item.portalHref) && item.category === "seerah";

  const contextLines = [
    `المرحلة: ${eraMeta.title} (${eraMeta.period})`,
    eraMeta.center ? `المركز: ${eraMeta.center}` : null,
    item.place ? `المكان: ${item.place}` : null,
    item.hijriDate || item.gregorianDate
      ? `الزمن: ${[item.hijriDate, item.gregorianDate].filter(Boolean).join(" · ")}`
      : item.era
        ? `الزمن: ${item.era}`
        : null,
    `التصنيف: ${HISTORY_KIND_LABELS[item.kind]}`,
  ].filter(Boolean) as string[];

  return (
    <UtilityScreen compose="mark">
    <TopicPage
      themeId="history"
      sectionRoute="/tarikh-islami"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "التاريخ الإسلامي", href: "/tarikh-islami" },
        { label: HISTORY_CATEGORIES[item.category], href: eraHref },
        { label: item.title },
      ]}
      eyebrow={`${HISTORY_CATEGORIES[item.category]}${
        stage ? ` · المرحلة ${stage.index}/${stage.total}` : ""
      }`}
      title={item.title}
      subtitle={item.summary}
      className="topic-page--tarikh-detail"
    >
      <KnowledgeLayout kind="timeline" className="tarikh-detail-reading" data-kx="1">
        <div className="tarikh-detail__meta" aria-label="بيانات الحدث">
          {item.hijriDate ? <span>هـ: {item.hijriDate}</span> : null}
          {item.gregorianDate ? <span>م: {item.gregorianDate}</span> : null}
          {item.place ? <span>{item.place}</span> : null}
          <span className="tarikh-badge">{HISTORY_KIND_LABELS[item.kind]}</span>
          <span className={`tarikh-badge tarikh-badge--${item.verification}`}>
            {VERIFICATION_LABEL[item.verification]}
          </span>
        </div>

        {isSeerahPortal && item.portalHref ? (
          <Link href={item.portalHref} className="tarikh-chip tarikh-chip--portal">
            {item.portalLabel || "السيرة النبوية"}
          </Link>
        ) : null}

        <nav className="tarikh-toc" aria-label="فهرس أقسام الصفحة">
          {toc.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="tarikh-toc__link">
              {t.label}
            </a>
          ))}
        </nav>

        <nav className="tarikh-adjacent" aria-label="التنقل بين أحداث المرحلة">
          {adjacent.prev ? (
            <Link
              href={`/tarikh-islami/${adjacent.prev.id}`}
              className="tarikh-adjacent__link tarikh-adjacent__link--prev"
            >
              <span className="tarikh-adjacent__dir">السابق</span>
              <span className="tarikh-adjacent__title">{adjacent.prev.title}</span>
            </Link>
          ) : (
            <span className="tarikh-adjacent__link is-empty" />
          )}
          {adjacent.next ? (
            <Link
              href={`/tarikh-islami/${adjacent.next.id}`}
              className="tarikh-adjacent__link tarikh-adjacent__link--next"
            >
              <span className="tarikh-adjacent__dir">التالي</span>
              <span className="tarikh-adjacent__title">{adjacent.next.title}</span>
            </Link>
          ) : (
            <span className="tarikh-adjacent__link is-empty" />
          )}
        </nav>

        <div id="tarikh-sec-summary">
          <ReadingSectionCard title="نبذة مختصرة" variant="summary">
            <ReadingProse text={item.summary} />
          </ReadingSectionCard>
        </div>

        <div id="tarikh-sec-context">
          <ReadingSectionCard title="السياق التاريخي" variant="notes">
            <ReadingBulletList items={contextLines} />
            <p className="tarikh-context-blurb">{eraMeta.blurb}</p>
          </ReadingSectionCard>
        </div>

        <div id="tarikh-sec-detail">
          <ReadingSectionCard title="الشرح" variant="definition">
            <ReadingProse text={item.detail} />
          </ReadingSectionCard>
        </div>

        {item.causes ? (
          <div id="tarikh-sec-causes">
            <ReadingSectionCard title="الأسباب" variant="timeline">
              <ReadingProse text={item.causes} />
            </ReadingSectionCard>
          </div>
        ) : null}

        {item.outcomes ? (
          <div id="tarikh-sec-outcomes">
            <ReadingSectionCard title="النتائج" variant="outcomes">
              <ReadingProse text={item.outcomes} />
            </ReadingSectionCard>
          </div>
        ) : null}

        {item.lessons ? (
          <div id="tarikh-sec-lessons">
            <ReadingSectionCard title="العبر والفوائد" variant="lessons">
              <ReadingProse text={item.lessons} />
            </ReadingSectionCard>
          </div>
        ) : null}

        {item.relatedPersons?.length ? (
          <div id="tarikh-sec-persons">
            <ReadingSectionCard title="شخصيات مرتبطة" variant="concepts">
              <ReadingBulletList items={item.relatedPersons} />
            </ReadingSectionCard>
          </div>
        ) : null}

        <div id="tarikh-sec-sources">
          <ReadingSectionCard title="المصادر" variant="sources">
            <ReadingBulletList items={item.sources} />
          </ReadingSectionCard>
        </div>

        {item.relatedLinks?.length ? (
          <ReadingSectionCard title="روابط ذات صلة" variant="related">
            <RelatedContentStack
              items={item.relatedLinks.map((l) => ({
                href: l.href,
                title: l.label,
                category: "رابط ذو صلة",
              }))}
            />
          </ReadingSectionCard>
        ) : null}

        {sameEra.length > 0 ? (
          <ReadingSectionCard title="اقرأ أيضًا" variant="related" className="tarikh-detail-read-also">
            <RelatedContentStack
              paddedForNav
              items={sameEra.map((r) => ({
                href: `/tarikh-islami/${r.id}`,
                title: r.title,
                category: HISTORY_CATEGORIES[r.category],
                summary: r.summary,
              }))}
            />
          </ReadingSectionCard>
        ) : null}

        <div className="tarikh-detail__share">
          <ShareButtons
            title={`${item.title} — سُنّة`}
            url={`https://www.ssunnah.com/tarikh-islami/${item.id}`}
          />
        </div>
      </KnowledgeLayout>
    </TopicPage>
    </UtilityScreen>
  );
}
