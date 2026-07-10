import { useEffect } from "react";
import { PageHeader } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

// ─── مراتب المصلين ───────────────────────────────────────────────────────

export const RANKS = [
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
    ruling: "تكفَّر عنه السيئات",
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

// ─── فضائل الصلاة ────────────────────────────────────────────────────────

const PRAYER_VIRTUES = [
  {
    title: "عمود الإسلام",
    text: "الصلاة عمود الإسلام، من أقامها فقد أقام الدين، ومن هدمها فقد هدم الدين.",
    source: "شعب الإيمان للبيهقي",
    grade: "صحيح",
    narrator: "معاذ بن جبل",
  },
  {
    title: "أول ما يُحاسب عليه",
    text: "أول ما يُحاسب به العبد يوم القيامة من عمله صلاته، فإن صلحت فقد أفلح وأنجح، وإن فسدت فقد خاب وخسر.",
    source: "سنن الترمذي (٤١٣)",
    grade: "صحيح",
    narrator: "أبو هريرة رضي الله عنه",
  },
  {
    title: "النهي عن الفحشاء والمنكر",
    text: "﴿إِنَّ الصَّلَاةَ تَنْهَى عَنِ الْفَحْشَاءِ وَالْمُنكَرِ﴾",
    source: "العنكبوت: ٤٥",
    grade: "قرآن",
    narrator: "",
  },
  {
    title: "كفّارة للذنوب",
    text: "أرأيتم لو أن نهراً بباب أحدكم يغتسل منه كل يوم خمس مرات، هل يبقى من درنه شيء؟ قالوا: لا يبقى من درنه شيء. قال: فذلك مثل الصلوات الخمس يمحو الله بهن الخطايا.",
    source: "صحيح البخاري (٥٢٨)",
    grade: "صحيح",
    narrator: "أبو هريرة رضي الله عنه",
  },
  {
    title: "صلة بين العبد وربه",
    text: "قسمتُ الصلاة بيني وبين عبدي نصفين، ولعبدي ما سأل. فإذا قال العبد: الحمد لله رب العالمين. قال الله: حمدني عبدي.",
    source: "صحيح مسلم (٣٩٥)",
    grade: "صحيح",
    narrator: "أبو هريرة رضي الله عنه",
  },
  {
    title: "أحب الأعمال إلى الله",
    text: "قلتُ: أيُّ العمل أحبُّ إلى الله؟ قال: الصلاة على وقتها. قلت: ثم أيّ؟ قال: بر الوالدين. قلت: ثم أيّ؟ قال: الجهاد في سبيل الله.",
    source: "صحيح البخاري (٥٢٧)",
    grade: "صحيح",
    narrator: "عبدالله بن مسعود رضي الله عنه",
  },
  {
    title: "نور يوم القيامة",
    text: "بشِّر المشّائين في الظُّلَم إلى المساجد بالنور التام يوم القيامة.",
    source: "سنن أبي داود (٥٦١)، سنن الترمذي (٢٢٣)",
    grade: "صحيح",
    narrator: "بريدة رضي الله عنه",
  },
  {
    title: "الصلاة مع الجماعة",
    text: "صلاة الجماعة تفضل صلاة الفذِّ بسبع وعشرين درجة.",
    source: "صحيح البخاري (٦٤٥)، صحيح مسلم (٦٥٠)",
    grade: "صحيح",
    narrator: "عبدالله بن عمر رضي الله عنهما",
  },
  {
    title: "قرّة عين النبي ﷺ",
    text: "حُبِّبَ إليَّ من دنياكم: النساء والطيب، وجُعلت قرة عيني في الصلاة.",
    source: "سنن النسائي (٣٩٤٠)",
    grade: "صحيح",
    narrator: "أنس بن مالك رضي الله عنه",
  },
];

// ─── وصايا في إصلاح الصلاة ──────────────────────────────────────────────

const PRAYER_TIPS = [
  { num: "١", tip: "تعلّم أحكام الصلاة من مصادرها الصحيحة قبل أن تُبدأ بإصلاحها." },
  { num: "٢", tip: "المحافظة على الوقت مقدَّمة على الخشوع، ابدأ بأداء الصلاة في أول وقتها." },
  { num: "٣", tip: "استحضر معنى التكبيرة الأولى: الله أكبر من كل ما في ذهنك وهمّك." },
  { num: "٤", tip: "قرأة الفاتحة بتدبر ووقوف، اسأل الله الهداية مع كل ﴿اهدنا الصراط المستقيم﴾." },
  { num: "٥", tip: "قلّل التشعّب في الدنيا قبل الصلاة، هيّئ نفسك لمناجاة الله بعيداً عن الشواغل." },
  { num: "٦", tip: "أكثر من الدعاء في السجود، فهو أقرب ما يكون العبد من ربه." },
  { num: "٧", tip: "اختم صلاتك بالاستغفار والذكر المأثور، فالمداومة عليه أثبت من الكثير المنقطع." },
  { num: "٨", tip: "تفكَّر في معنى كل جملة تقولها: التكبير، التسبيح، التشهد — كلها خطاب لله مباشرة." },
  { num: "٩", tip: "صلِّ قدر الإمكان في المسجد جماعةً، فالصف المستقيم والإمام العادل يُعينان على الخشوع." },
  { num: "١٠", tip: "إذا فاتتك ركعة أو أدركك السهو فلا تجزع، البشرية طبع — المهم الرجوع والاستئناف بإذن الله." },
];

// ─── شارة درجة الحديث ────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  const cls = grade === "صحيح" ? "prv-badge--sahih" : grade === "قرآن" ? "prv-badge--quran" : "prv-badge--other";
  return <span className={`prv-badge ${cls}`}>{grade}</span>;
}

// ─── محتوى الصفحة ───────────────────────────────────────────────────────

export function PrayerRanksContent() {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "مراتب الناس في الصلاة", url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="prayer-ranks-page">
      <div className="prayer-ranks-actions">
        <button type="button" className="ui-card-btn" onClick={share}>مشاركة</button>
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

      {/* فضائل الصلاة */}
      <section className="prv-section" aria-labelledby="virtues-heading">
        <h2 id="virtues-heading" className="prv-section-title">فضائل الصلاة</h2>
        <div className="prv-virtues-grid">
          {PRAYER_VIRTUES.map((v) => (
            <div key={v.title} className="prv-virtue-card ui-card">
              <p className="prv-virtue-title">{v.title}</p>
              <p className="prv-virtue-text">
                {v.source.startsWith("الع") || v.source.startsWith("سبأ") || v.grade === "قرآن"
                  ? v.text
                  : `«${v.text}»`}
              </p>
              <div className="prv-virtue-foot">
                <GradeBadge grade={v.grade} />
                {v.narrator && <span className="prv-virtue-narrator">رواه {v.narrator}</span>}
                <span className="prv-virtue-source">{v.source}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* وصايا الإصلاح */}
      <section className="prv-section" aria-labelledby="tips-heading">
        <h2 id="tips-heading" className="prv-section-title">وصايا في إصلاح الصلاة</h2>
        <div className="prv-tips-list">
          {PRAYER_TIPS.map((t) => (
            <div key={t.num} className="prv-tip">
              <span className="prv-tip-num">{t.num}</span>
              <p className="prv-tip-text">{t.tip}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ui-card prayer-ranks-notes">
        <h2>تنبيهات وفوائد</h2>
        <ul>
          <li>الخشوع ثمرة العلم بالله ومجاهدة النفس، ولا يعني ورود الخاطر بطلان الصلاة.</li>
          <li>إصلاح الصلاة يبدأ بالمحافظة على الوقت والطهارة والأركان، ثم حضور القلب.</li>
          <li>من وجد نقصاً فليستعن بالله وليكثر من الدعاء: اللهم أعني على ذكرك وشكرك وحسن عبادتك.</li>
          <li>الصلاة في جماعة أفضل من صلاة الفذّ بسبع وعشرين درجة، فاحرص على المسجد.</li>
        </ul>
      </section>
      <div className="twh-share">
        <ShareButtons title="فضائل الصلاة ومراتبها — المجلس العلمي" url="https://majlisilm.com/prayer-ranks" />
      </div>
    </div>
  );
}

export default function PrayerRanksPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/prayer-ranks",
      title: "فضائل الصلاة ومراتبها | المجلس العلمي",
      description: "مراتب الناس الخمسة في الصلاة بحسب ابن القيم، مع فضائل الصلاة من القرآن والسنة الصحيحة ووصايا في إصلاح الصلاة.",
      keywords: ["فضائل الصلاة", "مراتب الصلاة", "الصلاة في الإسلام", "أهمية الصلاة", "فقه الصلاة", "خشوع"],
    });
  }, []);

  return (
    <div className="page-shell prayer-ranks-page">
      <PageHeader
        eyebrow="الصلاة"
        title="مراتب الناس في الصلاة"
        subtitle="عرض تربوي منسق للمراتب الخمسة في حضور القلب وإقامة الصلاة، مع فضائل الصلاة من القرآن والسنة."
      />
      <PrayerRanksContent />
    </div>
  );
}
