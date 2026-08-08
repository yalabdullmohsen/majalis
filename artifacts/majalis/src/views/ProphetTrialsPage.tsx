import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  PROPHET_TRIALS,
  type ProphetTrial,
} from "@/content/prophet-trials";
import "@/styles/pages/prophet-trials.css";

/** ترتيب عرض الأنبياء كما في المحتوى المنشور */
const PROPHET_ORDER = [
  "nuh",
  "ibrahim",
  "ayyub",
  "yunus",
  "musa",
  "yusuf",
  "muhammad",
] as const;

function groupByProphet(trials: ProphetTrial[]) {
  const map = new Map<string, { nameAr: string; trials: ProphetTrial[] }>();
  for (const trial of trials) {
    const existing = map.get(trial.prophetSlug);
    if (existing) {
      existing.trials.push(trial);
    } else {
      map.set(trial.prophetSlug, {
        nameAr: trial.prophetNameAr,
        trials: [trial],
      });
    }
  }
  return PROPHET_ORDER.map((slug) => {
    const group = map.get(slug);
    if (!group) return null;
    return { slug, ...group };
  }).filter(Boolean) as { slug: string; nameAr: string; trials: ProphetTrial[] }[];
}

export default function ProphetTrialsPage() {
  useEffect(() => {
    applyPageSeo({
      title: "ابتلاءات الأنبياء | مجالس العلم",
      description:
        "مواقف ابتلاء الأنبياء عليهم السلام موثّقة بآيات القرآن والأحاديث الصحيحة، مع السياق والموقف والثمرة والدروس.",
      path: "/prophet-trials",
    });
  }, []);

  const groups = useMemo(() => groupByProphet(PROPHET_TRIALS), []);

  return (
    <div className="pt-page page-shell" dir="rtl">
      <div className="pt-back-wrap">
        <Link href="/prophets" className="pt-back-link">
          ← قصص الأنبياء
        </Link>
      </div>

      <header className="pt-hero">
        <h1 className="pt-hero__title">ابتلاءات الأنبياء</h1>
        <p className="pt-hero__sub">
          مواقف مختارة مما ثبت في القرآن أو الصحيح، بلا إسرائيليات ولا قصص مخترعة.
          لكل ابتلاء سياقه وموقف النبي وثمرته وشواهده.
        </p>
      </header>

      <main className="pt-body">
        {groups.map((group) => (
          <section key={group.slug} className="pt-group" aria-labelledby={`pt-${group.slug}`}>
            <h2 id={`pt-${group.slug}`} className="pt-group__title">
              {group.nameAr}
            </h2>
            <div className="pt-list">
              {group.trials.map((trial) => (
                <article key={trial.id} className="pt-card" id={trial.id}>
                  <h3 className="pt-card__title">{trial.trialTitleAr}</h3>

                  <p className="pt-card__block">
                    <span className="pt-card__label">السياق</span>
                    {trial.contextAr}
                  </p>
                  <p className="pt-card__block">
                    <span className="pt-card__label">الموقف</span>
                    {trial.stanceAr}
                  </p>
                  <p className="pt-card__block">
                    <span className="pt-card__label">الثمرة</span>
                    {trial.fruitAr}
                  </p>

                  {trial.lessonsAr.length > 0 && (
                    <>
                      <span className="pt-card__label">دروس</span>
                      <ul className="pt-lessons">
                        {trial.lessonsAr.map((lesson) => (
                          <li key={lesson}>{lesson}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="pt-citations">
                    <h4 className="pt-citations__title">الشواهد</h4>
                    <ul className="pt-citations__list">
                      {trial.citations.map((c, i) => (
                        <li key={`${trial.id}-c-${i}`} className="pt-citation">
                          <span className="pt-citation__meta">
                            {c.kind === "ayah" ? "آية" : "حديث"} · {c.source} · {c.reference} · {c.grade}
                          </span>
                          {c.textExcerpt ? (
                            <span className="pt-citation__excerpt">{c.textExcerpt}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <p className="pt-note">
          المنهج: لا يُدرج هنا إلا ما له مرجع قرآني (سورة:آية) أو حديث مُدرَّج مع درجته ومصدره.
          ما اشتهر بلا سند محرَّر يُحفظ للمراجعة ولا يُعرض كحقيقة قاطعة.
        </p>
      </main>
    </div>
  );
}
