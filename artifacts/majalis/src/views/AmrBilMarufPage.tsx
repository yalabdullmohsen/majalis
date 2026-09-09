import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import {
  AMR_BIL_MARUF_LEVELS,
  AMR_BIL_MARUF_CONDITIONS,
  AMR_BIL_MARUF_META,
  MAJOR_MUNKARAAT,
  MAJOR_MAARUF,
} from "@/lib/amr-bil-maruf-seed";
import "@/styles/section-makarim-pattern.css";

export default function AmrBilMarufPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/amr-bil-maruf",
      title: "الأمر بالمعروف والنهي عن المنكر | سُنّة",
      description:
        "مراتب الأمر بالمعروف والنهي عن المنكر الثلاث وشروطها وأحكامها وفق المذاهب الفقهية الأربعة. محتوى معتمد في منهج سُنّة",
      keywords: ["أمر بالمعروف", "نهي عن المنكر", "مراتب", "شروط", "فقه"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "الأمر بالمعروف والنهي عن المنكر",
          description:
            "مراتب الأمر بالمعروف والنهي عن المنكر الثلاث وشروطها وأحكامها وفق المذاهب الفقهية الأربعة. محتوى معتمد في منهج سُنّة",
          url: "https://www.ssunnah.com/amr-bil-maruf",
          inLanguage: "ar",
          publisher: { "@type": "Organization", name: "سُنّة", url: "https://www.ssunnah.com" },
        },
      ],
    });
  }, []);

  return (
    <SectionTemplatePage
      route="/amr-bil-maruf"
      title="الأمر بالمعروف والنهي عن المنكر"
      subtitle="مراتبه الثلاث، شروطه، وأحكامه في الفقه الإسلامي"
      groupTitle="المراتب والشروط"
      className="topic-page--amr"
      eyebrow="الفقه والآداب"
    >
      <div className="amr-page">
        <section className="amr-basis" aria-labelledby="amr-basis-title">
          <span className="amr-basis__label" id="amr-basis-title">
            الأساس الشرعي
          </span>
          <p className="amr-basis__quran">{AMR_BIL_MARUF_META.quran_basis}</p>
          <p className="amr-basis__ref">{AMR_BIL_MARUF_META.quran_source}</p>
          <p className="amr-basis__hadith">«{AMR_BIL_MARUF_META.main_hadith}»</p>
          <p className="amr-basis__ref">{AMR_BIL_MARUF_META.main_hadith_source}</p>
        </section>

        <div className="amr-ruling">
          <span className="amr-ruling__icon" aria-hidden="true">
            <SectionIcon name="⚖️" size={18} />
          </span>
          <div>
            <span className="amr-ruling__label">الحكم الشرعي</span>
            <p className="amr-level__desc">{AMR_BIL_MARUF_META.ruling}</p>
          </div>
        </div>

        <h2 className="amr-section-title">المراتب الثلاث</h2>
        <div className="amr-levels">
          {AMR_BIL_MARUF_LEVELS.map((level) => (
            <article key={level.id} className="amr-level">
              <div className="amr-level__header">
                <span className="amr-level__rank" aria-hidden="true">
                  {level.rank}
                </span>
                <div>
                  <h3 className="amr-level__title">{level.title}</h3>
                  <p className="amr-level__meta">
                    {level.is_obligatory ? "فرض عين" : "فرض كفاية"} — {level.who_can_do}
                  </p>
                </div>
              </div>
              <div className="amr-level__body">
                <p className="amr-level__desc">{level.description}</p>
                <div>
                  <p className="amr-level__block-title">الشروط والضوابط</p>
                  <ul className="amr-level__list">
                    {level.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div className="amr-conditions">
                  {level.evidence.map((ev, i) => (
                    <div
                      key={i}
                      className={`amr-evidence${ev.type === "حديث" ? " amr-evidence--hadith" : " amr-evidence--quran"}`}
                    >
                      <span className="amr-evidence__type">{ev.type}</span>
                      <p className="amr-evidence__text">
                        {ev.type === "حديث" ? `«${ev.text}»` : ev.text}
                      </p>
                      <p className="amr-evidence__src">{ev.source}</p>
                    </div>
                  ))}
                </div>
                <p className="amr-notes">
                  <SectionIcon name="📚" size={14} /> {level.notes}
                </p>
              </div>
            </article>
          ))}
        </div>

        <h2 className="amr-section-title">الشروط العامة للأمر بالمعروف والنهي عن المنكر</h2>
        <div className="amr-conditions">
          {AMR_BIL_MARUF_CONDITIONS.map((cond, i) => (
            <div key={cond.id} className="amr-condition">
              <h3 className="amr-condition__title">
                {i + 1}. {cond.title}
              </h3>
              <p className="amr-condition__body">{cond.detail}</p>
              {cond.scholar_note ? (
                <p className="amr-notes amr-notes--flush">{cond.scholar_note}</p>
              ) : null}
            </div>
          ))}
        </div>

        <h2 className="amr-section-title">أمثلة على المنكرات والمعروفات الكبرى</h2>
        <div className="amr-levels">
          <div className="amr-level">
            <div className="amr-level__header">
              <span className="amr-level__rank" aria-hidden="true">
                <SectionIcon name="🚫" size={16} />
              </span>
              <h3 className="amr-level__title">منكرات تستوجب الإنكار</h3>
            </div>
            <div className="amr-level__body">
              {MAJOR_MUNKARAAT.map((m) => (
                <div key={m.id} className="amr-condition">
                  <h4 className="amr-condition__title">{m.title}</h4>
                  <p className="amr-condition__body">{m.explanation}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="amr-level">
            <div className="amr-level__header">
              <span className="amr-level__rank" aria-hidden="true">
                <SectionIcon name="✅" size={16} />
              </span>
              <h3 className="amr-level__title">معروفات ينبغي الأمر بها</h3>
            </div>
            <div className="amr-level__body">
              {MAJOR_MAARUF.map((m) => (
                <div key={m.id} className="amr-condition">
                  <h4 className="amr-condition__title">{m.title}</h4>
                  <p className="amr-condition__body">{m.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="amr-section-title">أقوال العلماء</h2>
        <div className="amr-conditions">
          {AMR_BIL_MARUF_META.scholars_sayings.map((s, i) => (
            <figure key={i} className="amr-evidence amr-evidence--hadith">
              <blockquote className="amr-evidence__text">«{s.saying}»</blockquote>
              <figcaption className="amr-evidence__src">
                {s.scholar} — {s.source}
              </figcaption>
            </figure>
          ))}
        </div>

        <section className="amr-basis" aria-labelledby="amr-refs-title">
          <h3 className="amr-condition__title" id="amr-refs-title">
            <SectionIcon name="📚" size={18} /> المراجع الأساسية
          </h3>
          <ul className="amr-level__list">
            {AMR_BIL_MARUF_META.key_books.map((book, i) => (
              <li key={i}>{book}</li>
            ))}
          </ul>
        </section>

        <div className="px-4 pb-6 mt-4">
          <SectionQuiz sectionId="akhlaq" title="اختبر معلوماتك في الأمر بالمعروف" count={4} />
        </div>
      </div>
    </SectionTemplatePage>
  );
}
