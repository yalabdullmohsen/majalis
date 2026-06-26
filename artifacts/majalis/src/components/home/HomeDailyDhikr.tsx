import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getDailyDhikrRotated } from "@/lib/content-library/loader";
import { getDailyDhikr } from "@/lib/daily-content";
import { displayText } from "@/lib/display-text";
import { DailyContentActions } from "@/components/daily/DailyContentActions";

type DhikrView = { id: string; text: string; category?: string; source?: string };

export function HomeDailyDhikr() {
  const [dhikr, setDhikr] = useState<DhikrView>(() => getDailyDhikr());

  useEffect(() => {
    getDailyDhikrRotated()
      .then((item) =>
        setDhikr({
          id: item.id,
          text: item.text,
          category: item.categoryId === "adh-morning" ? "أذكار الصباح" : item.categoryName || "ذكر",
          source: item.source,
        }),
      )
      .catch(() => setDhikr(getDailyDhikr()));
  }, []);

  return (
    <section className="home-section home-daily-single" aria-labelledby="daily-dhikr-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">ورد يومي</p>
          <h2 id="daily-dhikr-heading">ذكر اليوم</h2>
        </div>
        <Link href="/adhkar" className="home-section-link">الأذكار</Link>
      </div>
      <article className="ui-card home-daily-card home-daily-card--dhikr">
        {dhikr.category && <span className="page-tag">{dhikr.category}</span>}
        <p className="home-daily-faida-text">{displayText(dhikr.text)}</p>
        {dhikr.source && <p className="home-daily-meta">{dhikr.source}</p>}
        <DailyContentActions
          title="ذكر اليوم — المجلس العلمي"
          text={dhikr.text}
          source={dhikr.source}
          storageKey={`dhikr-${dhikr.id}`}
        />
      </article>
    </section>
  );
}

export default HomeDailyDhikr;
