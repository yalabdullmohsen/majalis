import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { PrayerSectionNav } from "@/components/prayer/PrayerSectionNav";
import { PRAYER_RULINGS_TOPICS } from "@/lib/prayer-ibn-qayyim-ranks";

export default function PrayerRulingsPage() {
  return (
    <div className="page-shell prayer-rulings-page">
      <PageHeader
        eyebrow="الصلاة"
        title="أحكام الصلاة"
        subtitle="مدخل إلى أحكام الصلاة — للتعلّم والمراجعة."
      />

      <PrayerSectionNav />

      <section className="ui-card prayer-ranks-intro">
        <p>
          أحكام الصلاة من أهم ما يحتاجه المسلم. يمكنك مراجعة موسوعة الأحكام في المنصة
          للتفصيل، وهذه الصفحة تقدّم مدخلاً منظماً قابلاً للتوسعة.
        </p>
      </section>

      <div className="prayer-rulings-grid">
        {PRAYER_RULINGS_TOPICS.map((t) => (
          <article key={t.title} className="ui-card prayer-ruling-card">
            <h2>{t.title}</h2>
            <p>{t.desc}</p>
          </article>
        ))}
      </div>

      <section className="ui-card prayer-rulings-cta">
        <h2>المزيد من الأحكام</h2>
        <p>تصفّح موسوعة الأحكام في المنصة للاطلاع على فتاوى وأحكام مفصّلة في باب الصلاة.</p>
        <Link href="/rulings" className="ui-card-btn">موسوعة الأحكام</Link>
      </section>
    </div>
  );
}
