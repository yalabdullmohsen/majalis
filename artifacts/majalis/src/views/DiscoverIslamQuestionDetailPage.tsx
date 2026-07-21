import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";
import { getQuestionBySlug, getQuestionTranslations, type DawahQuestion, type DawahTranslation } from "@/lib/dawah-service";
import { supabase } from "@/lib/supabase";
import "@/styles/discover-islam.css";

const LANG_LABELS: Record<string, string> = { en: "English", fr: "Français", es: "Español" };

export default function DiscoverIslamQuestionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<DawahQuestion | null | undefined>(undefined);
  const [translations, setTranslations] = useState<DawahTranslation[]>([]);
  const [viewLang, setViewLang] = useState<string>("ar");

  useEffect(() => {
    if (!slug) return;
    setItem(undefined);
    setTranslations([]);
    setViewLang("ar");
    getQuestionBySlug(slug).then((q) => {
      setItem(q);
      if (q) {
        getQuestionTranslations(q.id).then(setTranslations);
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

  const activeTranslation = viewLang === "ar" ? null : translations.find((t) => t.lang === viewLang);
  const displayTitle = activeTranslation?.title || item.title;
  const displayShortAnswer = activeTranslation?.summary || item.short_answer;

  return (
    <div className="page-shell narrow dii-question-page">
      <div dir={viewLang === "ar" ? "rtl" : "ltr"}>
        <PageHeader eyebrow="سؤال وجواب" title={displayTitle} showBack />
      </div>

      {translations.length > 0 && (
        <div className="dii-lang-row" role="tablist" aria-label="الترجمات المتاحة">
          <span className="dii-lang-label">الترجمات المتاحة:</span>
          <button type="button" onClick={() => setViewLang("ar")} className={viewLang === "ar" ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>العربية</button>
          {translations.map((t) => (
            <button key={t.lang} type="button" onClick={() => setViewLang(t.lang)} className={viewLang === t.lang ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}>
              {LANG_LABELS[t.lang] || t.lang}
            </button>
          ))}
        </div>
      )}

      <div className="ui-card dii-answer-card" dir={viewLang === "ar" ? "rtl" : "ltr"}>
        <span className="page-tag">{viewLang === "ar" ? "الجواب المختصر" : "Short Answer"}</span>
        <p className="dii-short-answer">{displayShortAnswer}</p>
      </div>

      {viewLang === "ar" ? (
        <div className="ui-card" style={{ marginTop: "1rem" }}>
          <span className="page-tag">التفصيل</span>
          <p className="page-desc dii-detailed-answer">{item.detailed_answer}</p>
        </div>
      ) : (
        <div className="ui-card" style={{ marginTop: "1rem" }}>
          <p className="page-desc">التفصيل الكامل متاح بالعربية حاليًا فقط. الترجمة الكاملة قيد الإعداد.</p>
        </div>
      )}

      {viewLang === "ar" && item.evidences?.length > 0 && (
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

      {viewLang === "ar" && item.glossary_terms?.length > 0 && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2 className="page-section-title">مصطلحات</h2>
          <dl className="dii-glossary">
            {item.glossary_terms.map((g, i) => (
              <div key={i}><dt>{g.term}</dt><dd>{g.definition}</dd></div>
            ))}
          </dl>
        </section>
      )}

      {viewLang === "ar" && item.sources?.length > 0 && (
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
