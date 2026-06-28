import { PageHeader } from "@/components/ui-common";
import { PrayerSectionNav } from "@/components/prayer/PrayerSectionNav";
import { IbnQayyimRankCard } from "@/components/prayer/IbnQayyimRankCard";
import { PrayerRankAssessment } from "@/components/prayer/PrayerRankAssessment";
import { IBN_QAYYIM_RANKS, IBN_QAYYIM_SOURCE } from "@/lib/prayer-ibn-qayyim-ranks";

export default function PrayerRanksPage() {
  const share = async () => {
    const url = window.location.href;
    const title = "مراتب الناس في الصلاة — ابن القيم";
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="page-shell prayer-ranks-page prayer-ranks-page--ibn-qayyim">
      <PageHeader
        eyebrow="الصلاة"
        title="مراتب الناس في الصلاة"
        subtitle="تصنيف تربوي مستفاد من كلام الإمام ابن القيم — للمحاسبة والاجتهاد لا للحكم على الناس."
      />

      <PrayerSectionNav />

      <div className="prayer-ranks-actions">
        <button type="button" className="ui-card-btn" onClick={share}>مشاركة الصفحة</button>
        <button type="button" className="ui-card-btn" onClick={() => window.print()}>طباعة / PDF</button>
      </div>

      <section className="ui-card prayer-ranks-intro">
        <p>
          جعل الله الصلاة عمود الدين، ورتّب الناس فيها مراتب: من المفرّط إلى المقرّب.
          والمسلم يجاهد نفسه لينتقل من مرتبة إلى أعلى، فتزداد محبته لله وخشوعه في صلاته.
        </p>
        <p className="prayer-ranks-intro__note">
          هذا العرض تربوي إرشادي، مستند إلى المعنى المشهور في كتاب{" "}
          <strong>{IBN_QAYYIM_SOURCE.book}</strong> للإمام {IBN_QAYYIM_SOURCE.author}.
        </p>
      </section>

      <PrayerRankAssessment />

      <div className="ibn-qayyim-ranks-list">
        {IBN_QAYYIM_RANKS.map((rank) => (
          <IbnQayyimRankCard key={rank.level} rank={rank} />
        ))}
      </div>

      <section className="ui-card prayer-ranks-disclaimer">
        <h2>تنبيه علمي</h2>
        <p>
          هذا التصنيف مستفاد من كلام الإمام ابن القيم رحمه الله، والغرض منه محاسبة النفس
          والاجتهاد في تحسين الصلاة، وليس الحكم على الناس أو الجزم بمرتبة أحد.
          الله تعالى أعلم بما في الصدور، ومراتب العباد عند ربهم لا يعلمها إلا هو.
        </p>
        <p className="prayer-ranks-disclaimer__source">
          {IBN_QAYYIM_SOURCE.note}
        </p>
      </section>
    </div>
  );
}
