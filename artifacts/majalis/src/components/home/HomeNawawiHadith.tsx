import { useMemo } from "react";
import { Link } from "wouter";
import { ARBAEEN_NAWAWI } from "@/lib/arbaeen-nawawi-seed";

function getTodayHadith() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return ARBAEEN_NAWAWI[dayOfYear % ARBAEEN_NAWAWI.length];
}

export function HomeNawawiHadith() {
  const hadith = useMemo(() => getTodayHadith(), []);
  const shortText = hadith.text.length > 160 ? hadith.text.slice(0, 157) + "…" : hadith.text;

  return (
    <section className="hnh" aria-labelledby="hnh-heading">
      <div className="hnh__eyebrow">
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <polygon points="8,1 10,6 15.5,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0.5,6 6,6" fill="#2d7a5a" opacity="0.9"/>
          </svg>
          <p className="home-eyebrow">حديث اليوم</p>
        </div>
        <Link href="/arbaeen-nawawi" className="home-section-link">الأربعون النووية</Link>
      </div>
      <div className="hnh__card ui-card">
        <div className="hnh__num">{hadith.id} / 40</div>
        <h2 id="hnh-heading" className="hnh__title">{hadith.title}</h2>
        <blockquote className="hnh__text">«{shortText}»</blockquote>
        <footer className="hnh__footer">
          <span className="hnh__source">{hadith.source}</span>
          {hadith.benefits && (
            <p className="hnh__benefit">
              <span className="hnh__benefit-label">الفائدة</span>
              {hadith.benefits}
            </p>
          )}
        </footer>
      </div>
    </section>
  );
}

export default HomeNawawiHadith;
