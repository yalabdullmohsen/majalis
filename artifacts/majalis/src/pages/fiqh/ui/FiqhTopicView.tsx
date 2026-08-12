import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { BookOpen, Scale } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { ShareButtons } from "@/components/ContentActions";
import { getFiqhHubTopic } from "@/lib/fiqh-hub-topics";
import { getRulingsEncyclopedia } from "@/lib/rulings-service";
import type { ShariaRulingExtended } from "@/lib/rulings-types";
import { RequestManager } from "@/lib/request-manager";
import { SkeletonCardGrid, Empty, ErrorState } from "@/components/ui-common";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { hrefRulings, hrefRulingsFilter } from "@/lib/content-href";
import "@/styles/pages/fiqh-hub.css";
import "@/styles/pages/fiqh-guide.css";

async function filterSeed(
  category?: string,
  subcategory?: string,
  limit = 12,
): Promise<ShariaRulingExtended[]> {
  const { RULINGS_ENCYCLOPEDIA_SEED } = await import("@/lib/rulings-encyclopedia-seed.generated");
  let rows = RULINGS_ENCYCLOPEDIA_SEED as ShariaRulingExtended[];
  if (category) {
    rows = rows.filter((r) => r.category === category);
  }
  if (subcategory) {
    rows = rows.filter(
      (r) =>
        r.subcategory === subcategory ||
        (Array.isArray(r.subcategories) && r.subcategories.includes(subcategory)) ||
        (Array.isArray(r.keywords) && r.keywords.includes(subcategory)),
    );
  }
  return rows.slice(0, limit);
}

export default function FiqhTopicPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId ?? "";
  const topic = getFiqhHubTopic(topicId);

  const [items, setItems] = useState<ShariaRulingExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageView("fiqh-topic", topicId || null);

  useEffect(() => {
    if (!topic || topic.kind !== "topic") return;
    applyPageSeo({
      path: topic.href,
      title: `${topic.title} | الفقه والأحكام | المجلس العلمي`,
      description: topic.desc,
      keywords: [topic.title, "فقه إسلامي", "أحكام شرعية", "المجلس العلمي"],
    });
  }, [topic]);

  useEffect(() => {
    if (!topic || topic.kind !== "topic") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    RequestManager.run(
      `fiqh-topic:${topic.id}`,
      () =>
        getRulingsEncyclopedia({
          page: 1,
          limit: 12,
          category: topic.rulingsCategory ?? "الكل",
          subcategory: topic.rulingsSubcategory,
          sort: "importance",
        }),
      { timeoutMs: 15_000 },
    )
      .then(async (result) => {
        if (cancelled) return;
        if (result.data.length > 0) {
          setItems(result.data);
          setError(null);
          return;
        }
        const seed = await filterSeed(topic.rulingsCategory, topic.rulingsSubcategory);
        if (cancelled) return;
        setItems(seed);
        if (result.dbError && result.dbError !== "empty" && seed.length === 0) {
          setError(result.dbError);
        }
      })
      .catch(async (err) => {
        if (cancelled) return;
        const seed = await filterSeed(topic.rulingsCategory, topic.rulingsSubcategory);
        if (cancelled) return;
        setItems(seed);
        if (seed.length === 0) setError(String((err as Error)?.message || err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [topic]);

  if (!topic || topic.kind !== "topic") {
    return (
      <div className="fg-page page-shell" dir="rtl">
        <Empty
          title="موضوع غير موجود"
          text="هذا الباب غير مدرج ضمن أقسام الفقه. عد إلى بوابة الفقه واختر بطاقة صحيحة."
        />
        <p className="fg-empty">
          <Link href="/fiqh">← العودة إلى الفقه والأحكام</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="fg-page fqh-topic-page page-shell" dir="rtl">
      <nav className="tawheed-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/fiqh">الفقه والأحكام</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{topic.title}</span>
      </nav>

      <header className="fg-hero">
        <span className="fg-hero__badge">باب فقهي مستقل</span>
        <h1 className="fg-hero__title">{topic.title}</h1>
        <p className="fg-hero__sub">{topic.desc}</p>
        <ShareButtons title={topic.title} url={`https://www.majlisilm.com${topic.href}`} />
      </header>

      {topic.relatedGuides && topic.relatedGuides.length > 0 && (
        <ExploreAlsoNav
          title="أدلة ومسارات مرتبطة"
          ariaLabel="أدلة ومسارات ذات صلة"
          links={topic.relatedGuides}
        />
      )}

      <section aria-labelledby="fiqh-topic-rulings-heading" className="fqh-topic-rulings">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 id="fiqh-topic-rulings-heading" className="fqp-section-title">
            <Scale size={18} aria-hidden="true" />
            مسائل من هذا الباب
          </h2>
          {topic.rulingsCategory && (
            <Link
              href={hrefRulingsFilter(topic.rulingsCategory, topic.rulingsSubcategory)}
              className="fqp-see-all"
            >
              فتح الفلتر في الموسوعة ←
            </Link>
          )}
        </div>

        {loading && <SkeletonCardGrid count={6} />}
        {!loading && error && items.length === 0 && (
          <ErrorState text={error} onRetry={() => window.location.reload()} />
        )}
        {!loading && !error && items.length === 0 && (
          <Empty
            title="لا مسائل معروضة حاليًا"
            text="يمكنك الرجوع إلى بوابة الفقه أو فتح موسوعة الأحكام من الرابط أعلاه."
          />
        )}
        {!loading && items.length > 0 && (
          <div className="fqh-hub-grid">
            {items.map((item) => (
              <Link key={item.id} href={hrefRulings(item.id)} className="fqh-hub-card fqh-topic-ruling-card">
                <span className="fqh-hub-card__emoji" aria-hidden="true">
                  <BookOpen size={22} />
                </span>
                <p className="fqh-hub-card__title">{item.title}</p>
                <p className="fqh-hub-card__desc">
                  {item.summary || item.body?.slice(0, 140) || item.category}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="fqh-topic-page__block">
        <RelatedKnowledge
          kind="fatwa"
          query={topic.title}
          title={`معرفة ذات صلة بـ${topic.title}`}
          limit={6}
        />
      </div>

      <div className="fqh-topic-page__block">
        <SectionQuiz categoryId="fiqh" title={`اختبر معلوماتك في ${topic.title}`} count={4} />
      </div>
    </div>
  );
}
