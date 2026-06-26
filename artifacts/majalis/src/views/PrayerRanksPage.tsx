import { PageHeader } from "@/components/ui-common";

const RANKS = [
  {
    title: "المرتبة الأولى",
    label: "المفرّط في أصل الصلاة",
    ruling: "معرّض للعقوبة",
    text: "من نقص من وضوئها ومواقيتها وحدودها وأركانها، فلم يحفظ لها حقها الظاهر.",
    benefit: "أول طريق إصلاح الصلاة: تعلم شروطها وأركانها والمواظبة على وقتها.",
  },
  {
    title: "المرتبة الثانية",
    label: "المحافظ ظاهراً مع الوساوس",
    ruling: "محاسَب على غفلته",
    text: "من حافظ على المواقيت والحدود والأركان الظاهرة، لكنه أضاع مجاهدة نفسه في الوسوسة والخواطر.",
    benefit: "حضور القلب عبادة تحتاج مجاهدة، وليس مجرد أداء حركات.",
  },
  {
    title: "المرتبة الثالثة",
    label: "المجاهد في صلاته",
    ruling: "تكفَّر عنه السيئات",
    text: "من حافظ على حدود الصلاة وجاهد الشيطان والخواطر حتى لا يسرق من صلاته.",
    benefit: "مدافعة الخواطر وطلب الخشوع من أعظم أسباب قبول الصلاة.",
  },
  {
    title: "المرتبة الرابعة",
    label: "المكمّل لحقوق الصلاة",
    ruling: "مثاب مأجور",
    text: "من قام إلى الصلاة فأكمل حقوقها وحدودها، واستغرق قلبه في حفظها وأدائها كما ينبغي.",
    benefit: "إتقان الظاهر والباطن يرفع الصلاة من عادة يومية إلى عبادة حاضرة.",
  },
  {
    title: "المرتبة الخامسة",
    label: "المقرّب المناجي",
    ruling: "مقرّب من ربه",
    text: "من قام إلى الصلاة وقد أخذ قلبه ووضعه بين يدي ربه، ناظراً بقلبه إليه، ممتلئاً من محبته وتعظيمه.",
    benefit: "هذه أعلى المراتب: صلاة القلوب المقبلة على الله حباً وتعظيماً وأنساً.",
  },
];

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
        {RANKS.map((rank, index) => (
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
