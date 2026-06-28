import { useMemo, useState, type CSSProperties } from "react";
import {
  ASSESSMENT_QUESTIONS,
  IBN_QAYYIM_RANKS,
} from "@/lib/prayer-ibn-qayyim-ranks";
import type { AssessmentAnswers } from "@/lib/prayer-ibn-qayyim-ranks";
import {
  computeAdvisoryRank,
  loadAssessmentAnswers,
  saveAssessmentAnswers,
} from "@/lib/prayer-rank-assessment";

export function PrayerRankAssessment() {
  const [answers, setAnswers] = useState<AssessmentAnswers>(() => loadAssessmentAnswers());
  const [expanded, setExpanded] = useState(false);

  const result = useMemo(() => computeAdvisoryRank(answers), [answers]);

  const setAnswer = (id: string, value: boolean) => {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    saveAssessmentAnswers(next);
  };

  return (
    <section className="ui-card prayer-rank-assessment">
      <h2>حالك الحالية</h2>
      <p className="prayer-rank-assessment__intro">
        قد تكون أقرب إلى <strong>{result.rank.name}</strong> — {result.rank.summary}
      </p>

      <div
        className="prayer-rank-assessment__badge"
        style={{ "--rank-color": result.rank.color, "--rank-color-soft": result.rank.colorSoft } as CSSProperties}
      >
        <span aria-hidden>{result.rank.icon}</span>
        <div>
          <strong>{result.rank.title}</strong>
          <span>{result.rank.name}</span>
        </div>
        <small>{result.confidence === "medium" ? "تقدير مبني على المتابعة والاستبيان" : "تقدير أولي — أكمل الاستبيان"}</small>
      </div>

      {result.reasons.length > 0 && (
        <ul className="prayer-rank-assessment__reasons">
          {result.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      <p className="prayer-rank-assessment__disclaimer-inline">{result.disclaimer}</p>

      <button
        type="button"
        className="prayer-rank-assessment__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? "إخفاء الاستبيان" : "استبيان تقييم اختياري"}
      </button>

      {expanded && (
        <div className="prayer-rank-assessment__questions">
          {ASSESSMENT_QUESTIONS.map((q) => (
            <fieldset key={q.id} className="prayer-rank-assessment__question">
              <legend>{q.text}</legend>
              <div>
                <label>
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === true}
                    onChange={() => setAnswer(q.id, true)}
                  />
                  نعم
                </label>
                <label>
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === false}
                    onChange={() => setAnswer(q.id, false)}
                  />
                  لا / أحياناً
                </label>
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <details className="prayer-rank-assessment__ladder">
        <summary>عرض المراتب الخمس للمقارنة</summary>
        <ol>
          {IBN_QAYYIM_RANKS.map((r) => (
            <li key={r.level} style={{ color: r.color }}>
              {r.title}: {r.name}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
