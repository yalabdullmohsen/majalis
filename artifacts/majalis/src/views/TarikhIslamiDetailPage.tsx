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
import {
  getHistoryItem,
  HISTORY_CATEGORIES,
  ISLAMIC_HISTORY_ITEMS,
  type HistoryCategory,
  type VerificationLevel,
} from "@/data/islamic-history";
import "@/styles/pages/tarikh-islami.css";

const VERIFICATION_LABEL: Record<VerificationLevel, string> = {
  confirmed: "مؤكد",
  likely: "راجح",
  disputed: "مختلف فيه",
  "needs-review": "راجح",
};

export default function TarikhIslamiDetailPage() {
  const [, params] = useRoute("/tarikh-islami/:id");
  const id = params?.id ?? "";
  const item = getHistoryItem(id);

  const related = useMemo(() => {
    if (!item) return [];
    return ISLAMIC_HISTORY_ITEMS.filter(
      (x) =>
        x.id !== item.id &&
        (x.category === item.category ||
          x.relatedPersons?.some((p) => item.relatedPersons?.includes(p))),
    ).slice(0, 6);
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

  return (
    <TopicPage
      themeId="history"
      sectionRoute="/tarikh-islami"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "التاريخ الإسلامي", href: "/tarikh-islami" },
        { label: item.title },
      ]}
      eyebrow={HISTORY_CATEGORIES[item.category]}
      title={item.title}
      subtitle={item.summary}
      className="topic-page--tarikh-detail"
    >
      <div className="tarikh-detail-reading">
        <div className="tarikh-detail__meta" aria-label="بيانات الحدث">
          {item.hijriDate ? <span>هـ: {item.hijriDate}</span> : null}
          {item.gregorianDate ? <span>م: {item.gregorianDate}</span> : null}
          {item.place ? <span>{item.place}</span> : null}
          <span className={`tarikh-badge tarikh-badge--${item.verification}`}>
            {VERIFICATION_LABEL[item.verification]}
          </span>
        </div>

        {item.portalHref ? (
          <Link href={item.portalHref} className="tarikh-chip tarikh-chip--portal">
            {item.portalLabel || "ادخل القسم التفصيلي"}
          </Link>
        ) : null}

        <ReadingSectionCard title="نبذة مختصرة" variant="summary">
          <ReadingProse text={item.summary} />
        </ReadingSectionCard>

        <ReadingSectionCard title="الشرح" variant="default">
          <ReadingProse text={item.detail} />
        </ReadingSectionCard>

        {item.causes ? (
          <ReadingSectionCard title="الأسباب" variant="default">
            <ReadingProse text={item.causes} />
          </ReadingSectionCard>
        ) : null}

        {item.outcomes ? (
          <ReadingSectionCard title="النتائج" variant="default">
            <ReadingProse text={item.outcomes} />
          </ReadingSectionCard>
        ) : null}

        {item.lessons ? (
          <ReadingSectionCard title="العبر والفوائد" variant="lessons">
            <ReadingProse text={item.lessons} />
          </ReadingSectionCard>
        ) : null}

        {item.relatedPersons?.length ? (
          <ReadingSectionCard title="شخصيات مرتبطة" variant="default">
            <ReadingBulletList items={item.relatedPersons} />
          </ReadingSectionCard>
        ) : null}

        <ReadingSectionCard title="المصادر" variant="sources">
          <ReadingBulletList items={item.sources} />
        </ReadingSectionCard>

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

        {related.length > 0 ? (
          <ReadingSectionCard title="اقرأ أيضًا" variant="related" className="tarikh-detail-read-also">
            <RelatedContentStack
              paddedForNav
              items={related.map((r) => ({
                href: `/tarikh-islami/${r.id}`,
                title: r.title,
                category: HISTORY_CATEGORIES[r.category as HistoryCategory],
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
      </div>
    </TopicPage>
  );
}
