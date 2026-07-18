import { Link } from "wouter";
import { getTodayAsma } from "@/lib/asma-husna-data";

const CATEGORY_COLORS: Record<string, string> = {
  الجلال: "#176B57",
  الجمال: "#0E6655",
  الرحمة: "#1A5276",
  القدرة: "#6C3483",
  العلم:  "#117A65",
  الخلق:  "#1A5276",
  العدل:  "#7D6608",
};

export function HomeAsmaCard() {
  const asma = getTodayAsma();
  const accentColor = CATEGORY_COLORS[asma.category] ?? "#176B57";

  return (
    <section className="hac" aria-labelledby="hac-heading" style={{ "--hac-accent": accentColor } as React.CSSProperties}>
      <div className="hac__eyebrow">
        <p className="home-eyebrow">اسم الله اليومي</p>
        <Link href="/asma-husna" className="home-section-link">الأسماء الحسنى</Link>
      </div>
      <div className="hac__card ui-card">
        <div className="hac__num-badge">{asma.num} / 99</div>
        <div className="hac__body">
          <p className="hac__arabic">{asma.arabic}</p>
          <p className="hac__transliteration">{asma.transliteration}</p>
          <p className="hac__meaning">{asma.meaning}</p>
          <div className="hac__divider" />
          <div className="hac__benefit-row">
            <span className="hac__benefit-label">الفائدة</span>
            <p className="hac__benefit">{asma.benefit}</p>
          </div>
        </div>
        <span className="hac__category-badge">{asma.category}</span>
      </div>
    </section>
  );
}

export default HomeAsmaCard;
