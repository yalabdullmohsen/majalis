import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { DEMO_QA, DEMO_QA_CATEGORIES } from "@/lib/demo-content";
import { getQaQuestions } from "@/lib/supabase";
import { getDailyQa } from "@/lib/daily-content";
import { pickRotatedItem } from "@/lib/content-library/rotation";
import { cleanDisplayText } from "@/lib/display-text";

type QaView = { id: string; question: string; category?: string; answer?: string };

function categoryLabel(categoryId?: string) {
  if (!categoryId) return undefined;
  return DEMO_QA_CATEGORIES.find((c) => c.id === categoryId)?.name || categoryId;
}

function pickQuestion<T extends { id: string; question: string; category?: string; answer?: string }>(
  items: T[],
): T {
  if (typeof window === "undefined") return getDailyQa(items);
  return pickRotatedItem("question", items);
}

export function HomeDailyQuestion() {
  const [question, setQuestion] = useState<QaView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQaQuestions()
      .then(({ data }) => {
        const items = (data || []).map((q) => ({
          id: String(q.id || q.question),
          question: q.question,
          category: q.qa_categories?.name || categoryLabel(q.category_id),
          answer: q.answer,
        }));

        if (items.length > 0) {
          setQuestion(pickQuestion(items));
          return;
        }

        const seed = DEMO_QA.map((q) => ({
          id: q.id,
          question: q.question,
          category: categoryLabel(q.category_id),
          answer: q.answer,
        }));
        setQuestion(pickQuestion(seed));
      })
      .catch(() => {
        const seed = DEMO_QA.map((q) => ({
          id: q.id,
          question: q.question,
          category: categoryLabel(q.category_id),
        }));
        setQuestion(pickQuestion(seed));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section home-daily-single home-daily-qa" aria-labelledby="daily-qa-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">أسئلة شرعية</p>
          <h2 id="daily-qa-heading">سؤال اليوم</h2>
        </div>
        <Link href="/qa" className="home-section-link">كل الأسئلة</Link>
      </div>
      {loading ? (
        <Loading />
      ) : question ? (
        <Link href="/qa" className="home-qa-card ui-card home-daily-card">
          <div className="home-qa-card__body">
            <h3 className="home-qa-card__question">{cleanDisplayText(question.question)}</h3>
          </div>
          {question.category && (
            <footer className="home-qa-card__footer">
              <span className="home-qa-chip">{cleanDisplayText(question.category)}</span>
            </footer>
          )}
        </Link>
      ) : null}
    </section>
  );
}

export default HomeDailyQuestion;
