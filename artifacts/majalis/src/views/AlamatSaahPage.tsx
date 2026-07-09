import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/elite-2026.css";

/* ══════════════════════════════════════════════════════════════════
   §246 — علامات الساعة  (.as-*)
   ══════════════════════════════════════════════════════════════════ */

type Tab = "sughra" | "kubra" | "ashrat" | "tahdhukat";

interface Alama {
  title: string;
  desc: string;
  source?: string;
  status?: "وقعت" | "جارية" | "لم تقع";
}

/* ══ العلامات الصغرى ══ */
const SUGHRA: Alama[] = [
  {
    title: "بعثة النبي ﷺ",
    desc: "قال ﷺ: «بُعثتُ أنا والساعةُ كهاتَين» — وأشار بإصبعَيه السبابة والوسطى. فبعثته ﷺ أول علامات الساعة.",
    source: "البخاري: ٦٥٠٣",
    status: "وقعت",
  },
  {
    title: "وفاة النبي ﷺ",
    desc: "قال ﷺ: «لا تقوم الساعة حتى تُقبَض نفسي، ثم يكون بعدي فتنة». فوفاته ﷺ علامة من علامات الساعة.",
    source: "مسلم",
    status: "وقعت",
  },
  {
    title: "فتح بيت المقدس",
    desc: "«فتحُ بيتِ المقدسِ» من علامات الساعة التي أخبر عنها عوف بن مالك. وقد تحقق في زمن عمر بن الخطاب رضي الله عنه.",
    source: "البخاري: ٣١٧٦",
    status: "وقعت",
  },
  {
    title: "طاعون عمواس",
    desc: "طاعون موصوف في الحديث بأنه «وجع» يأخذ الصالحين. وقع في خلافة عمر وذهب فيه أبو عبيدة ومعاذ وغيرهم.",
    source: "البخاري: ٣١٧٦",
    status: "وقعت",
  },
  {
    title: "كثرة المال وفيضان الفتن",
    desc: "قال ﷺ: «لا تقوم الساعة حتى يكثر المال ويفيض حتى يخرج الرجل بزكاة ماله فلا يجد أحداً يقبلها منه».",
    source: "البخاري",
    status: "جارية",
  },
  {
    title: "التنافس في بناء الأبنية وتشييد الطوال",
    desc: "قال ﷺ في حديث جبريل في وصف الساعة: «وأن ترى الحفاةَ العراةَ رعاءَ الشاءِ يتطاولون في البنيان».",
    source: "مسلم: ٨",
    status: "جارية",
  },
  {
    title: "ظهور الفتن وادِّعاء النبوة",
    desc: "قال ﷺ: «لا تقوم الساعة حتى يُبعَث دجَّالون كذَّابون قريبٌ من ثلاثين كلُّهم يزعمُ أنَّه رسولُ الله».",
    source: "البخاري",
    status: "جارية",
  },
  {
    title: "رفع العلم وظهور الجهل",
    desc: "«يُقبَض العلم، ويظهر الجهل والفتن، ويكثر الهرج». والهرج: القتل.",
    source: "البخاري: ٨٠",
    status: "جارية",
  },
  {
    title: "كثرة الزنا والخمر",
    desc: "«لا تقوم الساعة حتى يُشرَب الخمر ويُزنى».",
    source: "ابن ماجه",
    status: "جارية",
  },
  {
    title: "السفاهة والتباهي بالأثاث",
    desc: "«لا تقوم الساعة حتى يتباهى الناس في المساجد».",
    source: "أبو داود",
    status: "جارية",
  },
  {
    title: "بروز الشمس من المغرب",
    desc: "من العلامات الكبرى التي تُدخل في باب الصغرى عند بعض العلماء بسبب قربها من قيام الساعة.",
    source: "مسلم: ١١٥",
    status: "لم تقع",
  },
  {
    title: "خروج الدجال",
    desc: "علامة كبرى تُذكر في السياق. خروجه من المشرق ويمكث أربعين يوماً، وفتنته عظيمة.",
    source: "مسلم: ٢٨٣٧",
    status: "لم تقع",
  },
];

/* ══ العلامات الكبرى العشر ══ */
const KUBRA: { num: number; title: string; desc: string; ref?: string }[] = [
  {
    num: 1,
    title: "الدجَّال",
    desc: "فتنة الدجال أعظم فتنة منذ خلق آدم. يدَّعي الربوبية ومعه جنان ونار. ينزل عيسى ﷺ فيقتله.",
    ref: "مسلم: ٢٩٠٢",
  },
  {
    num: 2,
    title: "نزول عيسى ﷺ",
    desc: "ينزل عيسى ابن مريم عند المنارة البيضاء شرقي دمشق، فيكسر الصليب ويقتل الخنزير ويضع الجزية.",
    ref: "مسلم: ٢٩٣٧",
  },
  {
    num: 3,
    title: "يأجوج ومأجوج",
    desc: "يخرجون بعد قتل الدجال، فيفسدون في الأرض. يدعو عيسى فيُهلكهم الله بالنَّغَف في رقابهم.",
    ref: "مسلم: ٢٩٣٧",
  },
  {
    num: 4,
    title: "الدخان",
    desc: "قال تعالى: ﴿فَارْتَقِبْ يَوْمَ تَأْتِي السَّمَاءُ بِدُخَانٍ مُّبِينٍ﴾. يصيب المؤمن كالزكام والكافر يصيبه حتى يخرج من أذنيه.",
    ref: "الدخان: ١٠، مسلم: ٢٧٩٨",
  },
  {
    num: 5,
    title: "الدابة",
    desc: "دابة تخرج من الأرض تُكلِّم الناس وتَسِم الكافر بين عينيه بـ«كافر». قال تعالى: ﴿وَإِذَا وَقَعَ الْقَوْلُ عَلَيْهِمْ أَخْرَجْنَا لَهُمْ دَابَّةً مِّنَ الْأَرْضِ﴾.",
    ref: "النمل: ٨٢",
  },
  {
    num: 6,
    title: "طلوع الشمس من المغرب",
    desc: "تطلع الشمس من مغربها فيُغلَق باب التوبة. «لا تقوم الساعة حتى تطلع الشمس من مغربها، فإذا طلعت ورآها الناس آمنوا أجمعون».",
    ref: "البخاري: ٤٦٣٦",
  },
  {
    num: 7,
    title: "النار التي تُحشر الناس",
    desc: "نار تخرج من قِبَل عدن أو اليمن تطرد الناس إلى المحشر، تبيت معهم حيث باتوا وتقيل حيث قالوا.",
    ref: "مسلم: ٢٩٠١",
  },
  {
    num: 8,
    title: "الخسف بالمشرق",
    desc: "خسف عظيم في المشرق يبتلع جيشاً. «يُخسَف بجيش يؤمُّ البيت فيُخسَف بأوَّلهم وآخرهم».",
    ref: "البخاري: ٢١١٨",
  },
  {
    num: 9,
    title: "الخسف بالمغرب",
    desc: "خسف آخر في المغرب من أشراط الساعة الكبرى.",
    ref: "مسلم: ٢٩٠١",
  },
  {
    num: 10,
    title: "الخسف في جزيرة العرب",
    desc: "خسف ثالث في جزيرة العرب. هذه الثلاثة خسوف من جملة العلامات العشر الكبرى.",
    ref: "مسلم: ٢٩٠١",
  },
];

/* ══ الاستعداد للساعة ══ */
const TAHDHUKAT: Alama[] = [
  {
    title: "الإكثار من ذكر الله",
    desc: "«أكثروا ذكر الله قبل أن تأتيكم الساعة وتحول بينكم وبين كثير مما تريدون». الذاكر لله في الفتن كالشجرة الثابتة في العاصفة.",
    source: "ابن ماجه",
  },
  {
    title: "الاستعاذة من فتنة الدجال",
    desc: "قال ﷺ: «إذا تشهَّد أحدكم فليستعِذ بالله من أربع: اللهم إني أعوذ بك من عذاب جهنم، ومن عذاب القبر، ومن فتنة المحيا والممات، ومن شر فتنة المسيح الدجال».",
    source: "مسلم",
  },
  {
    title: "حفظ أوائل سورة الكهف",
    desc: "«من حفظ عشر آيات من أول سورة الكهف عُصِم من الدجال». وفي رواية: آخر سورة الكهف.",
    source: "مسلم: ٨٠٩",
  },
  {
    title: "التمسك بالسنة النبوية",
    desc: "«عليكم بسنتي وسنة الخلفاء الراشدين المهديين من بعدي، عضُّوا عليها بالنواجذ، وإياكم ومحدثات الأمور».",
    source: "الترمذي",
  },
  {
    title: "الهجرة إلى الشام",
    desc: "قال ﷺ: «ستقع الفتن، وإن أفضل مقام المؤمن إذ ذاك أن يكون في الشام — وهو يومئذ مع عيسى».",
    source: "مسند أحمد",
  },
  {
    title: "الاعتصام بجماعة المسلمين",
    desc: "«من أراد بحبوحة الجنة فليلزم الجماعة، فإن الشيطان مع الواحد وهو من الاثنين أبعد».",
    source: "الترمذي",
  },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "sughra",     label: "العلامات الصغرى" },
  { id: "kubra",      label: "العلامات الكبرى العشر" },
  { id: "ashrat",     label: "الأشراط والترتيب" },
  { id: "tahdhukat",  label: "الاستعداد" },
];

const STATUS_MOD: Record<string, string> = {
  "وقعت":  "as-status--waqat",
  "جارية": "as-status--jariya",
  "لم تقع": "as-status--lam-taqaa",
};

export default function AlamatSaahPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sughra");

  useEffect(() => {
    applyPageSeo({
      path: "/alamat-saah",
      title: "علامات الساعة | المجلس العلمي",
      description: "علامات الساعة الصغرى والكبرى من الأحاديث الصحيحة — ما وقع وما هو جارٍ وما لم يقع بعد، مع الاستعداد للآخرة.",
      keywords: ["علامات الساعة", "أشراط الساعة", "الدجال", "يأجوج مأجوج", "نزول عيسى", "العلامات الكبرى"],
    });
  }, []);

  return (
    <div className="as-page" dir="rtl">
      {/* Hero */}
      <section className="as-hero">
        <div className="as-hero__inner">
          <div className="as-hero__badge">علم أشراط الساعة</div>
          <h1 className="as-hero__title">علامات الساعة</h1>
          <p className="as-hero__sub">
            من أحاديث النبي ﷺ الصحيحة — صغراها وكبراها وما وقع وما لم يقع وكيف نستعد
          </p>
          <div className="as-hero__ayah">
            ﴿هَلْ يَنظُرُونَ إِلَّا أَن تَأْتِيَهُمُ السَّاعَةُ بَغْتَةً وَهُمْ لَا يَشْعُرُونَ﴾
            <span> — الزخرف: ٦٦</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="as-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`as-tab${activeTab === t.id ? " as-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
            aria-pressed={activeTab === t.id}
          >{t.label}</button>
        ))}
      </div>

      <div className="as-container">

        {/* العلامات الصغرى */}
        {activeTab === "sughra" && (
          <div>
            <div className="as-intro">
              <p>العلامات الصغرى هي المقدِّمات البعيدة للساعة، وقد وقع كثيرها وبعضها لا يزال جارياً. والصغرى لا تعني صغر خطورتها بل قِدَمها في الظهور قبل الكبرى.</p>
            </div>
            <div className="as-status-legend">
              {["وقعت","جارية","لم تقع"].map(s => (
                <span key={s} className="as-legend-item">
                  <span className={`as-dot ${STATUS_MOD[s]}`} />
                  {s}
                </span>
              ))}
            </div>
            <div className="as-list">
              {SUGHRA.map((a, i) => (
                <div key={i} className="as-alama-card">
                  <div className="as-alama-card__head">
                    <h3 className="as-alama-card__title">{a.title}</h3>
                    {a.status && (
                      <span className={`as-alama-card__status ${STATUS_MOD[a.status] ?? ""}`}>{a.status}</span>
                    )}
                  </div>
                  <p className="as-alama-card__desc">{a.desc}</p>
                  {a.source && <p className="as-alama-card__source">{a.source}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* العلامات الكبرى */}
        {activeTab === "kubra" && (
          <div>
            <div className="as-intro">
              <p>
                العلامات الكبرى عشر، جاءت في حديث واحد جامع: «لا تقوم الساعة حتى تروا عشر آيات: الدخان، والدجال، والدابة، وطلوع الشمس من مغربها، ونزول عيسى بن مريم، ويأجوج ومأجوج، وثلاثة خسوف، وآخر ذلك نار تخرج من اليمن تطرد الناس إلى محشرهم».
              </p>
            </div>
            <div className="as-kubra-grid">
              {KUBRA.map(k => (
                <div key={k.num} className="as-kubra-card">
                  <div className="as-kubra-num">{k.num}</div>
                  <h3 className="as-kubra-title">{k.title}</h3>
                  <p className="as-kubra-desc">{k.desc}</p>
                  {k.ref && <p className="as-kubra-ref">{k.ref}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الأشراط والترتيب */}
        {activeTab === "ashrat" && (
          <div>
            <div className="as-intro">
              <p>جاء في الأحاديث ترتيب بعض العلامات الكبرى وتتابعها. وقد ذهب ابن حجر في الفتح وغيره إلى تحديد الترتيب المرجَّح.</p>
            </div>
            <div className="as-timeline">
              {[
                { label: "الدخان",                  detail: "قد يكون أول الكبرى" },
                { label: "الدجال",                   detail: "فتنة عظيمة — أربعون يوماً" },
                { label: "الدابة من الأرض",           detail: "تكلِّم الناس وتسمهم" },
                { label: "طلوع الشمس من المغرب",      detail: "يُغلَق بعدها باب التوبة" },
                { label: "الخسوف الثلاثة",            detail: "في المشرق والمغرب وجزيرة العرب" },
                { label: "نزول عيسى ﷺ",              detail: "يقتل الدجال ويُهلك يأجوج ومأجوج" },
                { label: "يأجوج ومأجوج",              detail: "يفسدون بعد قتل الدجال" },
                { label: "النار من اليمن",             detail: "تحشر الناس إلى أرض المحشر" },
              ].map((step, i) => (
                <div key={i} className="as-timeline-item">
                  <div className="as-tl-num">{i + 1}</div>
                  <div className="as-tl-body">
                    <h4 className="as-tl-title">{step.label}</h4>
                    <p className="as-tl-detail">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="as-note">
              <strong>ملاحظة:</strong> الترتيب الدقيق بين بعض العلامات محل خلاف بين العلماء، والثابت هو وقوعها جميعاً قبل قيام الساعة.
            </div>
          </div>
        )}

        {/* الاستعداد */}
        {activeTab === "tahdhukat" && (
          <div>
            <div className="as-intro">
              <p>الإيمان بعلامات الساعة لا يعني الاستسلام والجمود، بل هو دافع للعمل الصالح والتمسك بالسنة قبل أن تُغلَق أبواب التوبة.</p>
            </div>
            <div className="as-list">
              {TAHDHUKAT.map((a, i) => (
                <div key={i} className="as-alama-card as-alama-card--tahdhu">
                  <div className="as-alama-card__num">{i + 1}</div>
                  <div>
                    <h3 className="as-alama-card__title">{a.title}</h3>
                    <p className="as-alama-card__desc">{a.desc}</p>
                    {a.source && <p className="as-alama-card__source">{a.source}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
