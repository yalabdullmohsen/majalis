import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { getQaQuestions } from "@/lib/supabase";
import { getDailyQa } from "@/lib/daily-content";
import { cleanDisplayText } from "@/lib/display-text";

export function HomeDailyQuestion() {
  const [question, setQuestion] = useState<{ question: string; category?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQaQuestions()
      .then(({ data }) => {
        const items = data || [];
        if (items.length > 0) {
          const picked = getDailyQa(items);
          setQuestion({ question: picked.question, category: picked.qa_categories?.name || picked.category });
        } else {
          setQuestion(null);
        }
      })
      .catch(() => setQuestion(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section home-daily-single home-daily-qa" aria-labelledby="daily-qa-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">فوائد سريعة</p>
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
      ) : (
        <p className="lessons-empty-state">لا يوجد سؤال متاح حالياً.</p>
      )}
    </section>
  );
}

export default HomeDailyQuestion;
