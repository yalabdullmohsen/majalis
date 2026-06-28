import { PageHeader } from "@/components/ui-common";
import { PRAYER_RANKS } from "@/lib/prayer-ranks-data";

export default function PrayerRanksPage() {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "مراتب الناس في الصلاة", url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="page-shell prayer-ranks-page">
      <PageHeader
        eyebrow="الصلاة"
        title="مراتب الناس في الصلاة"
        subtitle="عرض تربوي منسق للمراتب الخمس في حضور القلب وإقامة الصلاة."
      />

      <div className="prayer-ranks-actions">
        <button type="button" className="ui-card-btn" onClick={share}>مشاركة الصفحة</button>
        <button type="button" className="ui-card-btn" onClick={() => window.print()}>طباعة / PDF</button>
      </div>

      <section className="ui-card prayer-ranks-source">
        <strong>المصدر:</strong>
        <p>
          هذا العرض مستند إلى المعنى المشهور عن الإمام ابن القيم في مراتب الناس في الصلاة،
          ويُعرض هنا بصياغة تعليمية مختصرة مع التنبيه إلى مراجعة النص في مصادره عند النقل العلمي.
        </p>
      </section>

      <div className="prayer-ranks-timeline">
        {PRAYER_RANKS.map((rank, index) => (
          <article key={rank.title} className="ui-card prayer-rank-card">
            <span className="prayer-rank-card__num">{index + 1}</span>
            <div>
              <p className="prayer-rank-card__eyebrow">{rank.title}</p>
              <h2>{rank.label}</h2>
              <p className="prayer-rank-card__text">{rank.text}</p>
              <div className="prayer-rank-card__meta">
                <span>الحكم: {rank.ruling}</span>
                <span>فائدة: {rank.benefit}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="ui-card prayer-ranks-notes">
        <h2>تنبيهات وفوائد</h2>
        <ul>
          <li>الخشوع ثمرة العلم بالله ومجاهدة النفس، ولا يعني ورود الخاطر بطلان الصلاة.</li>
          <li>إصلاح الصلاة يبدأ بالمحافظة على الوقت والطهارة والأركان، ثم حضور القلب.</li>
          <li>من وجد نقصاً فليستعن بالله وليكثر من الدعاء: اللهم أعني على ذكرك وشكرك وحسن عبادتك.</li>
        </ul>
      </section>
    </div>
  );
}
