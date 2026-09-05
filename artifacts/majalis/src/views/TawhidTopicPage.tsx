import { useEffect } from "react";
import { Link, Redirect, useRoute } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { getTawhidTopic } from "@/lib/tawhid-topics";
import { topicThemeCssVars, getTopicTheme } from "@/config/topic-themes";
import "@/styles/pages/tawhid.css";
import "@/styles/pages/misc-page-legacy.css";

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
    <div className="page-shell" dir="rtl">
      <nav className="tawheed-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/tawhid">العقيدة والتوحيد</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{topic.title}</span>
      </nav>

      <header
        className="twh-hub-hero on-dark"
        data-on-dark
        style={topicThemeCssVars(getTopicTheme("aqeedah"))}
      >
        <div className="twh-hub-hero__inner">
          <p className="home-eyebrow">العقيدة والتوحيد</p>
          <h1 className="twh-hub-hero__title">
            <span aria-hidden="true">{topic.emoji} </span>
            {topic.title}
          </h1>
          <p className="twh-hub-hero__sub">{topic.description}</p>
        </div>
      </header>

      <section className="twh-section" aria-labelledby="topic-blocks-heading">
        <h2 id="topic-blocks-heading" className="tawheed-principles-heading">
          {topic.title}
        </h2>
        <div className="tawheed-principles-grid">
          {topic.blocks.map((b) => (
            <article key={b.title} className="tawheed-principle-card">
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
        <Link href="/tawhid" className="twh-goto-btn">← العودة إلى بوابة العقيدة والتوحيد</Link>
        <Link href="/islamic-sects#ahl-al-sunna" className="twh-goto-btn">أهل السنة في الفرق ←</Link>
      </div>

      <div className="twh-share">
        <ShareButtons
          title={`${topic.title} — سُنّة`}
          url={`https://www.ssunnah.com/tawhid/${topic.slug}`}
        />
      </div>
    </div>
  );
}
