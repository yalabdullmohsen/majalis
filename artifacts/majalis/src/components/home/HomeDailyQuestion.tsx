import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { RequestManager } from "@/lib/request-manager";
import { getQaQuestions } from "@/lib/supabase";
import { getDailyQa } from "@/lib/daily-content";
import { cleanDisplayText } from "@/lib/display-text";

export function HomeDailyQuestion() {
  const [question, setQuestion] = useState<{ question: string; category?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void RequestManager.run("home:daily-question", () => getQaQuestions())
      .then(({ data }) => {
        const items = data || [];
        if (items.length > 0) {
          const picked = getDailyQa(items);
          if (picked?.question) {
            setQuestion({ question: picked.question, category: picked.qa_categories?.name || picked.category });
          } else {
            setQuestion(null);
          }
        } else {
          setQuestion(null);
        }
      })
      .catch(() => setQuestion(null))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !question) return null;

  return (
    <section className="home-section home-daily-single home-daily-qa" aria-labelledby="daily-qa-heading">
      <div className="home-section-head">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,1 10,6 15.5,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0.5,6 6,6" fill="#173D35" opacity="0.8"/>
          </svg>
          <div>
            <p className="home-eyebrow">فوائد سريعة</p>
            <h2 id="daily-qa-heading">سؤال اليوم</h2>
          </div>
        </div>
        <Link href="/qa" className="home-section-link">كل الأسئلة</Link>
      </div>
      <PageLoadingGuard loading={loading} empty={!loading && !question} emptyText="لا توجد بيانات حالياً">
        {question ? (
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
          <span />
        )}
      </PageLoadingGuard>
    </section>
  );
}

export default HomeDailyQuestion;
