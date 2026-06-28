import { PageHeader } from "@/components/ui-common";
import { PrayerSectionNav } from "@/components/prayer/PrayerSectionNav";
import { PRAYER_VIRTUES } from "@/lib/prayer-ibn-qayyim-ranks";

export default function PrayerVirtuesPage() {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "فضائل الصلاة", url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="page-shell prayer-virtues-page">
      <PageHeader
        eyebrow="الصلاة"
        title="فضائل الصلاة"
        subtitle="من فضائل الصلاة في الكتاب والسنة — للتذكير والترغيب."
      />

      <PrayerSectionNav />

      <div className="prayer-ranks-actions">
        <button type="button" className="ui-card-btn" onClick={share}>مشاركة الصفحة</button>
      </div>

      <section className="ui-card prayer-ranks-intro">
        <p>
          الصلاة أعظم أركان الإسلام بعد الشهادتين، وفضائلها كثيرة في القرآن والسنة.
          هذه صفحة قابلة للتوسعة بإضافة أقوال العلماء والفوائد مستقبلاً.
        </p>
      </section>

      <div className="prayer-virtues-grid">
        {PRAYER_VIRTUES.map((v) => (
          <article key={v.title} className="ui-card prayer-virtue-card">
            <span className="prayer-virtue-card__source">{v.source}</span>
            <h2>{v.title}</h2>
            <p>{v.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
