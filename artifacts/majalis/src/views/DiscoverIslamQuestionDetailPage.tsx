import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { getQuestionBySlug, type DawahQuestion } from "@/lib/dawah-service";
import { supabase } from "@/lib/supabase";
import "@/styles/discover-islam.css";

export default function DiscoverIslamQuestionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<DawahQuestion | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    setItem(undefined);
    getQuestionBySlug(slug).then((q) => {
      setItem(q);
      if (q) {
        applyPageSeo({
          path: `/discover-islam/questions/${slug}`,
          title: `${q.title} | التعريف بالإسلام`,
          description: q.short_answer,
          jsonLd: [{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [{ "@type": "Question", name: q.title, acceptedAnswer: { "@type": "Answer", text: q.short_answer } }],
          }],
        });
        void supabase.from("dawah_questions").update({ view_count: (q.view_count || 0) + 1 }).eq("id", q.id);
      }
    });
  }, [slug]);

  if (item === undefined) return <div className="page-shell narrow"><PageHeader eyebrow="التعريف بالإسلام" title="جارٍ التحميل..." /></div>;
  if (item === null) return <div className="page-shell narrow"><Empty text="لم يُعثر على هذا السؤال، أو أنه لا يزال قيد المراجعة." /></div>;

  return (
    <div className="page-shell narrow dii-question-page">
      <PageHeader eyebrow="سؤال وجواب" title={item.title} showBack />

      <div className="ui-card dii-answer-card">
        <span className="page-tag">الجواب المختصر</span>
        <p className="dii-short-answer">{item.short_answer}</p>
      </div>

      <div className="ui-card" style={{ marginTop: "1rem" }}>
        <span className="page-tag">التفصيل</span>
        <p className="page-desc dii-detailed-answer">{item.detailed_answer}</p>
      </div>

      {item.evidences?.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2 className="page-section-title">الأدلة</h2>
          <ul className="dii-evidence-list">
            {item.evidences.map((e, i) => (
              <li key={i} className="ui-card dii-evidence-item">
                <span className="page-tag">{e.type === "quran" ? "قرآن" : "حديث"} — {e.ref}</span>
                <p>{e.text}</p>
                {e.grading && <p className="dii-evidence-grading">الدرجة: {e.grading}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.glossary_terms?.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2 className="page-section-title">مصطلحات</h2>
          <dl className="dii-glossary">
            {item.glossary_terms.map((g, i) => (
              <div key={i}><dt>{g.term}</dt><dd>{g.definition}</dd></div>
            ))}
          </dl>
        </section>
      )}

      {item.sources?.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2 className="page-section-title">المصادر</h2>
          <ul className="dii-sources-list">
            {item.sources.map((s, i) => (
              <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> : s.title}{s.author ? ` — ${s.author}` : ""}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="twh-share" style={{ marginTop: "1.5rem" }}>
        <ShareButtons title={item.title} url={`https://www.majlisilm.com/discover-islam/questions/${item.slug}`} />
        <Link href="/discover-islam/contact" className="page-link-inline">لديك سؤال آخر؟ تحدّث مع داعية ←</Link>
      </div>
    </div>
  );
}
