import { PageHeader } from "@/components/ui-common";
import { ARBAEEN_NAWAWI } from "@/lib/arbaeen-nawawi-seed";

export default function ArbaeenNawawiPage() {
  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="السنة"
        title="الأربعون النووية"
        subtitle="أحاديث مختصرة مع شرح موجز وفوائد ومصدر."
      />

      <div className="nawawi-grid">
        {ARBAEEN_NAWAWI.map((hadith) => (
          <article key={hadith.id} className="nawawi-card ui-card">
            <span className="nawawi-num">{hadith.id}</span>
            <h2>{hadith.title}</h2>
            <p className="nawawi-text home-ayah-text">{hadith.text}</p>
            <h3>الشرح</h3>
            <p>{hadith.explanation}</p>
            <h3>الفوائد</h3>
            <p>{hadith.benefits}</p>
            <p className="nawawi-source">{hadith.source}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
