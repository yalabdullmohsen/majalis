import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getDailyWisdomRotated } from "@/lib/content-library/loader";
import { DailyContentActions } from "@/components/daily/DailyContentActions";

type WisdomEntry = { id: string; text: string; author: string; category: string; source: string };

export function HomeDailyWisdom() {
  const [wisdom, setWisdom] = useState<WisdomEntry | null>(null);

  useEffect(() => {
    getDailyWisdomRotated().then(setWisdom).catch(() => setWisdom(null));
  }, []);

  if (!wisdom) return null;

  return (
    <section className="home-section home-daily-single" aria-labelledby="daily-wisdom-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-wisdom-heading">حكمة اليوم</h2>
        </div>
        <Link href="/arbaeen-nawawi" className="home-section-link">الأربعون النووية</Link>
      </div>
      <article className="ui-card home-daily-card">
        <blockquote className="home-daily-quote">{wisdom.text}</blockquote>
        <p className="home-daily-meta"><strong>{wisdom.author}</strong></p>
        <p className="home-daily-meta">{wisdom.source}</p>
        <DailyContentActions
          title="حكمة اليوم — المجلس العلمي"
          text={wisdom.text}
          source={`${wisdom.source} — ${wisdom.author}`}
          storageKey={`wisdom-${wisdom.id}`}
        />
      </article>
    </section>
  );
}

export default HomeDailyWisdom;
