import { Link } from "wouter";
import { useEffect } from "react";
import { BookOpen, Scale } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { HubCard } from "@/components/ui/HubCard";
import { USUL_HUB_TOPICS } from "@/lib/fiqh/fiqh-usul-topics";
import "@/styles/pages/fiqh-hub.css";
import "@/styles/components/hub-card.css";

export default function FiqhUsulPage() {
  usePageView("fiqh-usul", null);
  useEffect(() => {
    applyPageSeo({
      path: "/fiqh/usul",
      title: "أصول الفقه | سُنّة",
      description: "هيكل أبواب أصول الفقه: الأدلة، الحكم الشرعي، دلالات الألفاظ، الإجماع والقياس والقواعد.",
      keywords: ["أصول الفقه", "أدلة الأحكام", "سُنّة"],
    });
  }, []);

  const detailTopics = USUL_HUB_TOPICS.filter((t) => t.details && t.details.length > 0);

  return (
    <SectionTemplatePage
      route="/fiqh/usul"
      title="أصول الفقه"
      subtitle="قواعد الاستنباط والأدلة — أبواب مرتبة للتعرّف على هيكل العلم دون اختراع أحكام بلا مصدر."
      eyebrow="الفقه · أصول"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "الفقه", href: "/fiqh" },
        { label: "أصول الفقه" },
      ]}
      groupTitle="أبواب أصول الفقه"
    >
      <div className="fiqh-usul-page" dir="rtl">
        <p className="fiqh-usul-page__lead">
          المباحث أدناه هيكل تعليمي يربط المحتوى المنشور في المنصة. ما وُسم «هيكل» يعرض الإطار فقط مع إحالة إلى المتن، بلا تفصيل أحكام جديدة.
        </p>

        <div className="hub-card-grid fiqh-usul-grid">
          {USUL_HUB_TOPICS.map((topic) => (
            <HubCard
              key={topic.id}
              href={topic.href ?? `#usul-${topic.id}`}
              title={topic.title}
              description={topic.summary}
              badge={topic.kind}
              meta={topic.status === "structure" ? "هيكل تعليمي" : "محتوى موثّق"}
              Icon={topic.id === "qawaid" ? Scale : BookOpen}
              featured={topic.status === "ready" && Boolean(topic.details)}
            />
          ))}
        </div>

        {detailTopics.map((topic) => (
          <section
            key={topic.id}
            id={`usul-${topic.id}`}
            className="fiqh-usul-section"
            aria-labelledby={`usul-title-${topic.id}`}
          >
            <header className="fiqh-usul-section__head">
              <h2 id={`usul-title-${topic.id}`} className="fiqh-usul-section__title">
                {topic.title}
              </h2>
              <p className="fiqh-usul-section__sub">{topic.summary}</p>
            </header>
            <div className="fiqh-usul-detail-grid">
              {topic.details!.map((block) => (
                <article key={block.title} className="fiqh-usul-card fiqh-usul-card--rich">
                  <h3 className="fiqh-usul-card__title">{block.title}</h3>
                  <p className="fiqh-usul-card__body">{block.summary}</p>
                  {block.evidence ? (
                    <p className="fiqh-usul-card__evidence">
                      <strong>الدليل: </strong>
                      {block.evidence}
                    </p>
                  ) : null}
                  <p className="fiqh-usul-card__src">
                    {block.source.book} — {block.source.author} — {block.source.ref}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="fiqh-usul-section" aria-labelledby="usul-structure-title">
          <header className="fiqh-usul-section__head">
            <h2 id="usul-structure-title" className="fiqh-usul-section__title">
              أبواب بهيكل فقط
            </h2>
            <p className="fiqh-usul-section__sub">
              تُعرض كإطار مع مصدر المتن؛ المحتوى التفصيلي يُستكمل لاحقًا من مصادر معتمدة.
            </p>
          </header>
          <div className="fiqh-usul-detail-grid">
            {USUL_HUB_TOPICS.filter((t) => t.status === "structure").map((topic) => (
              <article
                key={topic.id}
                id={`usul-${topic.id}`}
                className="fiqh-usul-card fiqh-usul-card--structure"
              >
                <span className="fiqh-usul-card__badge">هيكل</span>
                <h3 className="fiqh-usul-card__title">{topic.title}</h3>
                <p className="fiqh-usul-card__body">{topic.summary}</p>
                {topic.source ? (
                  <p className="fiqh-usul-card__src">
                    المرجع: {topic.source.book} — {topic.source.author} — {topic.source.ref}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <p className="fiqh-usul-page__nav">
          <Link href="/fiqh">← العودة إلى الفقه</Link>
          {" · "}
          <Link href="/fiqh-qawaid">القواعد الفقهية</Link>
        </p>
        <div className="fiqh-fab-clearance" />
      </div>
    </SectionTemplatePage>
  );
}
