import { useEffect } from "react";
import { Link, Redirect, useRoute } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { getTawhidTopic } from "@/lib/tawhid-topics";
import { TopicPage } from "@/components/topic/TopicPage";
import { KnowledgeLayout } from "@/components/knowledge";
import "@/styles/pages/tawhid.css";
import { UtilityScreen } from "@/components/design-system/screens";

/**
 * صفحة موضوع فرعي تحت بوابة التوحيد — مسار مستقل /tawhid/:slug
 */
export default function TawhidTopicPage() {
  const [, params] = useRoute("/tawhid/:slug");
  const slug = params?.slug;
  const topic = getTawhidTopic(slug);

  useEffect(() => {
    if (!topic) return;
    applyPageSeo({
      path: `/tawhid/${topic.slug}`,
      title: `${topic.title} | سُنّة`,
      description: topic.description,
      ogType: "article",
    });
  }, [topic]);

  if (!slug || !topic) {
    return <Redirect to="/tawhid" />;
  }

  return (
    <UtilityScreen compose="mark">
    <TopicPage
      themeId="aqeedah"
      sectionRoute="/tawhid"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "العقيدة والتوحيد", href: "/tawhid" },
        { label: topic.title },
      ]}
      eyebrow="العقيدة والتوحيد"
      title={topic.title}
      subtitle={topic.description}
      className="topic-page--tawhid-topic"
    >
      <KnowledgeLayout kind="knowledge" className="tawhid-hub" data-kx="1">
        <section className="twh-section" aria-labelledby="topic-blocks-heading">
          <h2 id="topic-blocks-heading" className="sr-only">
            {topic.title}
          </h2>
          <div className="tawheed-principles-grid">
            {topic.blocks.map((b) => (
              <article key={b.title} className="tawheed-principle-card" data-kx-kind={b.ayah || b.hadith ? "evidence" : "definition"}>
                <p className="tawheed-principle-card__title">{b.title}</p>
                <p className="tawheed-principle-card__body">{b.body}</p>
                {b.ayah ? (
                  <blockquote className="tawheed-type-card__ayah">
                    ﴿{b.ayah.text}﴾
                    <cite>{b.ayah.ref}</cite>
                  </blockquote>
                ) : null}
                {b.hadith ? (
                  <div className="twh-hadith-wrap">
                    <p className="twh-hadith-text">«{b.hadith.text}»</p>
                    <p className="twh-source-ref">{b.hadith.source}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <div className="twh-subsection-link" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link href="/tawhid" className="twh-goto-btn">
            ← العودة إلى بوابة العقيدة والتوحيد
          </Link>
          <Link href="/islamic-sects#ahl-al-sunna" className="twh-goto-btn">
            أهل السنة في الفرق ←
          </Link>
        </div>

        <div className="twh-share">
          <ShareButtons
            title={`${topic.title} — سُنّة`}
            url={`https://www.ssunnah.com/tawhid/${topic.slug}`}
          />
        </div>
      </KnowledgeLayout>
    </TopicPage>
    </UtilityScreen>
  );
}
