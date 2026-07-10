import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { getAllNawazilItems, getNawazilTopicItems } from "@/lib/fiqh-council-service";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { NAWAZIL_TOPICS } from "@/lib/fiqh-council-nawazil";
import {
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  formatFiqhItemMeta,
  type FiqhCouncilItem,
  type FiqhItemType,
} from "@/lib/fiqh-council-types";

export default function FiqhCouncilNawazilPage() {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [items, setItems] = useState<FiqhCouncilItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/nawazil",
      title: "النوازل المعاصرة | المجمع الفقهي | المجلس العلمي",
      description: "النوازل الفقهية المعاصرة، مسائل العصر الحديث من التقنية والاقتصاد الرقمي والطب والبيئة.",
      keywords: ["نوازل معاصرة", "مسائل معاصرة", "فقه معاصر", "نوازل فقهية", "مستجدات فقهية"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "النوازل المعاصرة", url: "https://majlisilm.com/fiqh-council/nawazil", about: { "@type": "Thing", name: "النوازل الفقهية والمستجدات المعاصرة" } }],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const load = activeTopic
      ? getNawazilTopicItems(activeTopic, 20)
      : getAllNawazilItems(30);
    load.then(({ data }) => setItems(data)).finally(() => setLoading(false));
  }, [activeTopic]);

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page fiqh-nawazil-page">
      <PageHeader
        eyebrow="الفقه المعاصر"
        title="فقه النوازل"
        subtitle="قضايا معاصرة مرتبطة بقرارات وفتاوى موثّقة، دون إصدار أحكام مستقلة."
      />

      <FiqhCouncilSubnav />

      <div className="content-hub-chips fiqh-nawazil-chips">
        <button
          type="button"
          className={!activeTopic ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          onClick={() => setActiveTopic(null)}
          aria-pressed={!activeTopic}
        >
          الكل
        </button>
        {NAWAZIL_TOPICS.map((topic) => (
          <button
            key={topic.slug}
            type="button"
            className={activeTopic === topic.slug ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            onClick={() => setActiveTopic(topic.slug)}
            aria-pressed={activeTopic === topic.slug}
          >
            {topic.title}
          </button>
        ))}
      </div>

      {activeTopic && (
        <p className="fiqh-nawazil-desc">
          {NAWAZIL_TOPICS.find((t) => t.slug === activeTopic)?.description}
        </p>
      )}

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : items.length === 0 ? (
        <Empty text="لا توجد مواد موثّقة لهذا الموضوع حالياً." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.slug}
              href={fiqhItemHref(item.slug)}
              title={item.title}
              tag={FIQH_ITEM_TYPE_LABELS[item.type as FiqhItemType]}
              meta={formatFiqhItemMeta(item)}
              summary={item.summary}
            />
          ))}
        </div>
      )}

      <section className="fiqh-council-section">
        <h2 className="fiqh-council-section-title">موضوعات النوازل</h2>
        <div className="fiqh-nawazil-topics-grid">
          {NAWAZIL_TOPICS.map((topic) => (
            <button
              key={topic.slug}
              type="button"
              className="fiqh-nawazil-topic-card"
              onClick={() => setActiveTopic(topic.slug)}
            >
              <strong>{topic.title}</strong>
              <span>{topic.description}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="fiqh-nawazil-note">
        المحتوى المعروض مستمد من قرارات وفتاوى رسمية منشورة. للمراجعة الكاملة، راجع
        {" "}<Link href="/fiqh-council">صفحة المجمع الفقهي</Link>.
      </p>

      <div className="twh-share">
        <ShareButtons title="نوازل فقهية معاصرة — المجلس العلمي" url="https://majlisilm.com/fiqh-council/nawazil" />
      </div>
    </div>
  );
}
