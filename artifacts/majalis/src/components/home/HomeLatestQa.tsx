import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { getQaQuestions } from "@/lib/supabase";
import { cleanDisplayText } from "@/lib/display-text";

export function HomeLatestQa() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQaQuestions()
      .then(({ data }) => setItems((data || []).slice(0, 4)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="latest-qa-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">فوائد سريعة</p>
          <h2 id="latest-qa-heading">آخر الأسئلة</h2>
        </div>
        <Link href="/qa" className="home-section-link">كل الأسئلة</Link>
      </div>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="lessons-empty-state">لا توجد أسئلة متاحة حالياً.</p>
      ) : (
        <div className="home-qa-grid">
          {items.map((item) => (
            <Link key={item.id} href="/qa" className="home-qa-card ui-card">
              <div className="home-qa-card__body">
                <h3 className="home-qa-card__question">{cleanDisplayText(item.question)}</h3>
              </div>
              {(item.qa_categories?.name || item.category) && (
                <footer className="home-qa-card__footer">
                  <span className="home-qa-chip">
                    {cleanDisplayText(item.qa_categories?.name || item.category)}
                  </span>
                </footer>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeLatestQa;
