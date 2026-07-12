import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect, useState, useMemo } from "react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";


type MawTab = "varasa" | "huquq" | "asab" | "hajb" | "masail";

const TABS: { id: MawTab; label: string; icon: string }[] = [
  { id: "varasa",  label: "الورثة وحصصهم",  icon: "👥" },
  { id: "huquq",   label: "الحقوق قبل الإرث", icon: "⚖️" },
  { id: "asab",    label: "العَصَبة",         icon: "🏛️" },
  { id: "hajb",    label: "الحجب والردّ",     icon: "🚫" },
  { id: "masail",  label: "مسائل مختارة",    icon: "📐" },
];

/* ── الورثة ── */
interface Warith {
  name: string;
  gender: "ذكر" | "أنثى" | "كلاهما";
  subs: { condition: string; share: string }[];
  dalil?: string;
}
const WARASA: Warith[] = [
  {
    name: "الزوج",
    gender: "ذكر",
    subs: [
      { condition: "إذا لم يكن للزوجة ولد أو ولد ابن", share: "النصف، ½" },
      { condition: "إذا كان لها ولد أو ولد ابن", share: "الربع، ¼" },
    ],
    dalil: "وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ، النساء: 12",
  },
  {
    name: "الزوجة",
    gender: "أنثى",
    subs: [
      { condition: "إذا لم يكن للزوج ولد أو ولد ابن", share: "الربع، ¼" },
      { condition: "إذا كان له ولد أو ولد ابن", share: "الثمن، ⅛" },
    ],
    dalil: "وَلَهُنَّ الرُّبُعُ مِمَّا تَرَكْتُمْ، النساء: 12",
  },
  {
    name: "الأب",
    gender: "ذكر",
    subs: [
      { condition: "إذا لم يكن للميت ولد أو ولد ابن", share: "عَصَبة (كل الباقي)" },
      { condition: "إذا كان للميت ولد ذكر", share: "السدس فرضاً، ⅙" },
      { condition: "إذا كان للميت بنت أو بنت ابن فقط", share: "السدس + عَصَبة" },
    ],
    dalil: "وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ، النساء: 11",
  },
  {
    name: "الأم",
    gender: "أنثى",
    subs: [
      { condition: "إذا لم يكن ولد ولا اثنان فأكثر من الإخوة", share: "الثلث، ⅓" },
      { condition: "إذا كان ولد أو جمع من الإخوة", share: "السدس، ⅙" },
    ],
    dalil: "وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ، النساء: 11",
  },
  {
    name: "الابن",
    gender: "ذكر",
    subs: [
      { condition: "دائماً يرث عَصَبة", share: "عَصَبة، يأخذ الباقي (أو كل التركة)" },
    ],
    dalil: "لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ، النساء: 11",
  },
  {
    name: "البنت",
    gender: "أنثى",
    subs: [
      { condition: "إذا كانت وحدها بلا أخ", share: "النصف، ½" },
      { condition: "إذا كانتا فأكثر بلا أخ", share: "الثلثان، ⅔" },
      { condition: "مع ابن (أخ لها)", share: "عَصَبة، للذكر مثل حظ الأنثيين" },
    ],
    dalil: "يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ، النساء: 11",
  },
  {
    name: "الجدّ (أب الأب)",
    gender: "ذكر",
    subs: [
      { condition: "إذا لم يكن أب", share: "يأخذ حكم الأب في كثير من المسائل" },
      { condition: "مع إخوة", share: "المسألة خلافية، الأشهر يُقاسَم الإخوة" },
    ],
  },
  {
    name: "الأخت الشقيقة",
    gender: "أنثى",
    subs: [
      { condition: "وحدها بلا إخوة أشقاء ولا فرع وارث", share: "النصف، ½" },
      { condition: "اثنتان فأكثر بنفس الشرط", share: "الثلثان، ⅔" },
      { condition: "مع أخ شقيق", share: "عَصَبة مع الغير" },
    ],
    dalil: "إِنِ امْرُؤٌ هَلَكَ لَيْسَ لَهُ وَلَدٌ وَلَهُ أُخْتٌ، النساء: 176",
  },
];

/* ── الحقوق السابقة للإرث ── */
const HUQUQ = [
  { num: 1, title: "مئونة التجهيز والدفن", desc: "تُخرج من أصل التركة نفقات تجهيز الميت وتكفينه ودفنه بالمعروف، وهي أول حق يؤخذ.", priority: "الأول" },
  { num: 2, title: "الديون", desc: "كل دين ثابت في ذمة الميت سواء كان لله كالزكاة والكفارة أو للناس، يُسدَّد قبل الإرث.", priority: "الثاني" },
  { num: 3, title: "الوصية", desc: "تُنفَّذ الوصية الشرعية وحدّها الأقصى ثلث التركة، ما أوصى به الميت لغير الوارث.", priority: "الثالث" },
  { num: 4, title: "الإرث", desc: "بعد استيفاء الحقوق السابقة تُوزَّع التركة الباقية على الورثة وفق أنصبتهم الشرعية.", priority: "الرابع" },
];

/* ── أسباب الإرث وموانعه ── */
const ASBAB_MAWAANI = {
  asbab: [
    { title: "النكاح الصحيح", desc: "عقد الزواج الصحيح، يُورث بين الزوجين ولو قبل الدخول" },
    { title: "النسب", desc: "رابطة الدم، الأصول والفروع والحواشي" },
    { title: "الولاء", desc: "عتق العبد، المعتِق يرث معتَقه إن لم يكن له وارث أقرب" },
  ],
  mawaani: [
    { title: "القتل العمد", desc: "من قتل مورّثه عمداً وعدواناً لا يرثه، درءاً لتعجيل الإرث" },
    { title: "اختلاف الدين", desc: "المسلم لا يرث الكافر والكافر لا يرث المسلم، الحديث والإجماع" },
    { title: "الرقّ", desc: "العبد لا يرث ولا يُورث، وهو حكم تاريخي لا وجود لموضوعه الآن" },
  ],
};

/* ── العَصَبة ── */
const ASAB_TYPES = [
  {
    type: "عَصَبة بنفسه",
    desc: "كل ذكر لا تتوسط في نسبته للميت أنثى، يأخذ ما بقي بعد أصحاب الفروض.",
    ex: ["الابن وابن الابن", "الأب والجدّ", "الأخ الشقيق والأخ لأب", "العم وابن العم"],
  },
  {
    type: "عَصَبة بغيره",
    desc: "الأنثى تصير عَصَبة بوجود ذكر من نفس الدرجة يُعصّبها، فيقتسمان للذكر مثل حظ الأنثيين.",
    ex: ["البنت مع الابن", "بنت الابن مع ابن الابن", "الأخت الشقيقة مع الأخ الشقيق"],
  },
  {
    type: "عَصَبة مع غيره",
    desc: "الأخت الشقيقة أو لأب تصير عَصَبة مع البنت أو بنت الابن، فيأخذن الباقي بعد نصيب البنات.",
    ex: ["الأخت الشقيقة مع بنت الميت"],
  },
];

/* ── الحَجْب ── */
const HAJB_TYPES = [
  {
    type: "الحجب بالوصف (حجب الحرمان الكامل)",
    cases: [
      "القاتل: محجوب بسبب القتل",
      "الكافر: محجوب بسبب اختلاف الدين",
      "الأخ لأم: محجوب بالأب والجدّ والفرع الوارث",
    ],
  },
  {
    type: "الحجب بالشخص (حجب النقصان أو الإسقاط)",
    cases: [
      "الجدّ يحجبه الأب",
      "ابن الابن يحجبه الابن",
      "الأخ لأب يحجبه الأخ الشقيق",
      "الأم تُنقص حصتها من الثلث إلى السدس بوجود الفرع الوارث",
    ],
  },
];

/* ── مسائل مختارة ── */
const MASAIL = [
  {
    title: "مسألة العُمَريَّتَين",
    desc: "إذا اجتمع زوج وأبوان: للزوج النصف، وللأم ثلث الباقي (لا ثلث الكل)، سُمّيت بعُمَريَّتَين لقضاء عمر ﵁ بها.",
    formula: "زوج ½ + أم ⅓ الباقي + أب الباقي",
  },
  {
    title: "مسألة المشتركة (الحِمارية)",
    desc: "زوجة + أم + أخوان لأم + إخوة أشقاء. سُمّيت الحِمارية لأن أحدهم قال لعمر: هبْ أن أبانا كان حماراً! فأشركهم.",
    formula: "الزوجة ¼ + الأم ⅙ + الإخوة لأم ⅓ + الأشقاء يُشاركون",
  },
  {
    title: "الميراث عبر الحساب",
    desc: "أصل المسألة: أصغر عدد صحيح تنقسم عليه التركة، كالجذر المشترك للمقامات. ثم تُضرب النسبة × أصل المسألة.",
    formula: "أصل المسألة = م.م.م (للمقامات) ← ثم توزيع الحصص",
  },
  {
    title: "المسألة المنبرية (اليُميلة)",
    desc: "توفي رجل عن زوجة وبنتين وأبوين — لما قرأها علي ﵁ على المنبر أجاب في الحال بدون حساب ظاهر، فسميت بالمنبرية.",
    formula: "زوجة ⅛ + بنتان ⅔ + أم ⅙ + أب ⅙ + تعصيب = ٢٤ أصل",
  },
  {
    title: "مسألة الغرَّاوَين",
    desc: "توفيت وعنها زوج وأبوان فقط أو زوجة وأبوان — يكون للأم ثلث الباقي بعد نصيب الزوج/الزوجة، لا ثلث الجميع.",
    formula: "زوج ½ + أم ثلث الباقي (⅙) + أب الباقي (⅙+تعصيب)",
  },
  {
    title: "مسألة الأكدرية",
    desc: "زوج وأم وجد وأخت شقيقة — سُميت كذلك لكدرها قواعد الجد، إذ كدّرت على الجد بأخذه جزءاً من نصيب الأخت.",
    formula: "زوج ½ + أم ⅓ + جد ⅙ + أخت ⅙ ← ثم عول المسألة إلى ٩",
  },
  {
    title: "مسألة العَوْل",
    desc: "إذا زادت السهام عن رأس المال يُزاد في أصل المسألة حتى تستوعب الحصص — هذا هو العَوْل، وبه قضى عمر ﵁.",
    formula: "مثال: زوج ½ + أختان ⅔ = ٤/٦+٤/٦ > ١ → أصل ٩ بدل ٦",
  },
  {
    title: "مسألة الرَّدّ",
    desc: "إذا بقي من التركة فضل بعد توزيع ذوي الفروض وانعدم العصبة — يُردّ الباقي على أصحاب الفروض بنسب حصصهم.",
    formula: "مثال: أم ⅙ + بنت ½ + لا عصبة → يُرد الثلث الباقي بالنسبة",
  },
  {
    title: "توريث الخنثى المُشكِل",
    desc: "مَن لا يُعلم أذكر أم أنثى — يُوقف جزء من التركة حتى يتبين، وعند تعذر التبين يأخذ نصف نصيب ذكر ونصف نصيب أنثى.",
    formula: "نصيبه = (نصيب ذكر + نصيب أنثى) ÷ ٢",
  },
  {
    title: "مسألة الجدّ مع الإخوة (مسائل ابن مسعود)",
    desc: "الجدّ مع الإخوة موضع خلاف مشهور: ذهب أبو بكر وعثمان وابن عباس إلى أن الجد يحجب الإخوة تماماً كالأب. وذهب عمر وعلي وزيد بن ثابت وجمهور الفقهاء إلى مقاسمتهم أو المقدَّم له من الثلث أو السدس.",
    formula: "الجد: أفضل ثلاثة: ثلث الكل / السدس / المقاسمة",
  },
  {
    title: "المفقود وتوزيع ميراثه",
    desc: "المفقود الذي انقطع خبره يُنتظر حتى يُحكم بموته من المحكمة (أو مضي مدة اجتهادية)، وحينئذ يُوزَّع ميراثه على ورثته الأحياء وقت الحكم بوفاته لا وقت فقدانه.",
    formula: "تاريخ الوفاة الحكمية ← يُعاد احتساب الورثة والحصص",
  },
  {
    title: "ميراث ما أُدلي بمحرومَين (ذوو الأرحام)",
    desc: "ذوو الأرحام هم القرابة الذين لا يرثون بفرض ولا تعصيب كابن البنت والخال وبنت الأخ. ورَّثهم الحنفية والحنابلة عند غياب أصحاب الفروض والعصبة، بخلاف المالكية والشافعية.",
    formula: "يرثون عند تعذر وجود صاحب فرض أو عصبة",
  },
  {
    title: "ميراث الحمل (الجنين في بطن أمه)",
    desc: "يُحجز للجنين نصيبه حتى يُولد، فإن وُلد حياً ورث، وإن ولد ميتاً أو أُسقط فلا إرث له. ويُعطى الورثةُ الآخرون أقلَّ الحظَّين احتياطاً: إذ يُفترض الجنين ذكراً أو أنثى أيهما أضرّ بالورثة.",
    formula: "تأجيل التقسيم أو منح الورثة أقل حصة محتملة حتى الولادة",
  },
  {
    title: "مسألة التخارج (الصلح على الميراث)",
    desc: "اتفاق بعض الورثة على أن يأخذ أحدهم مبلغاً معيناً من التركة مقابل تنازله عن حصته للباقين. جائز فقهياً وفق اتفاق الحنفية والمالكية والحنابلة بشروط السلامة من الغرر والجهالة.",
    formula: "الوارث المتنازل ← يأخذ بديلاً محدداً ← تُعاد القسمة بين الباقين على أنصبتهم المعدَّلة",
  },
  {
    title: "مسألة المناسَخة (وفاة وارث قبل القسمة)",
    desc: "يموت أحد الورثة قبل أن تُقسَّم التركة الأولى، فتُنقل حصته إلى ورثته — مما ينشئ مسألةً ثانية متشعبة من الأولى. تحلّ بدمج المسألتين في أصل مشترك.",
    formula: "أصل جديد = م.م.م (أصل الأولى × أصل الثانية ÷ الحصة المنقولة)",
  },
];

export default function MawarithPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/mawarith",
      title: "علم المواريث والفرائض، المجلس العلمي",
      description: "دليل شامل في علم الفرائض: الورثة وحصصهم وأسباب الإرث وموانعه وأحكام العَصَبة والحجب",
      keywords: ["المواريث", "الفرائض", "علم الإرث", "الورثة", "الحجب في الميراث"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "الورثة في الإسلام وأنصبتهم",
          description: "الورثة وأنصبتهم وشروط إرثهم في الفقه الإسلامي",
          numberOfItems: WARASA.length,
          itemListElement: WARASA.map((w, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: w.name,
            url: `https://majlisilm.com/mawarith#warith-${i + 1}`,
          })),
        },
      ],
    });
  }, []);

  const [tab, setTab] = useState<MawTab>("varasa");
  const [openWarith, setOpenWarith] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const filteredMasail = useMemo(() =>
    search.trim() ? MASAIL.filter(m => arabicMatchAny([m.title, m.desc, m.formula], search)) : MASAIL,
  [search]);

  return (
    <main className="mw-page" dir="rtl">
      {/* hero */}
      <section className="mw-hero">
        <div className="mw-hero__badge">الفقه والأحكام</div>
        <h1 className="mw-hero__title">علم المواريث والفرائض</h1>
        <p className="mw-hero__sub">
          الفرائض نصف العلم، دليل شامل في الورثة وحصصهم وأسباب الإرث وموانعه وأحكام العَصَبة
        </p>
        <div className="mw-ayah">
          <p className="mw-ayah__text">
            يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ
          </p>
          <cite className="mw-ayah__ref">النساء: 11</cite>
        </div>
      </section>

      {/* tabs */}
      <div className="mw-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`mw-tab${tab === t.id ? " mw-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
          >
            <span><SectionIcon name={t.icon} size={22} /></span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mw-body">

        {/* ── الورثة ── */}
        {tab === "varasa" && (
          <div className="mw-section">
            <p className="mw-lead">حصص الورثة المنصوص عليها في القرآن الكريم وسنة النبي ﷺ</p>

            <div className="mw-shares-legend">
              {["½ النصف", "⅓ الثلث", "¼ الربع", "⅙ السدس", "⅛ الثمن", "⅔ الثلثان", "عصبة"].map((s) => (
                <span key={s} className="mw-share-badge">{s}</span>
              ))}
            </div>

            <div className="mw-warasa-list">
              {WARASA.map((w) => {
                const isOpen = openWarith === w.name;
                return (
                  <article key={w.name} className={`mw-warith-card${isOpen ? " mw-warith-card--open" : ""}`}>
                    <button
                      type="button"
                      className="mw-warith-head"
                      onClick={() => setOpenWarith(isOpen ? null : w.name)}
                      aria-expanded={isOpen}
                    >
                      <span className={`mw-gender-badge mw-gender-badge--${w.gender === "ذكر" ? "m" : "f"}`}>
                        {w.gender === "ذكر" ? "♂" : "♀"}
                      </span>
                      <span className="mw-warith-name">{w.name}</span>
                      <div className="mw-warith-shares">
                        {w.subs.map((s) => (
                          <span key={s.share} className="mw-share-chip">{s.share.split("—")[0].trim()}</span>
                        ))}
                      </div>
                      <span className={`mw-chevron${isOpen ? " mw-chevron--open" : ""}`}>▾</span>
                    </button>

                    {isOpen && (
                      <div className="mw-warith-body">
                        <div className="mw-subs-list">
                          {w.subs.map((s, i) => (
                            <div key={i} className="mw-sub-row">
                              <span className="mw-sub-condition">{s.condition}</span>
                              <span className="mw-sub-share">{s.share}</span>
                            </div>
                          ))}
                        </div>
                        {w.dalil && (
                          <div className="mw-dalil">
                            <span className="mw-dalil__icon">📜</span>
                            <span>{w.dalil}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ── الحقوق ── */}
        {tab === "huquq" && (
          <div className="mw-section">
            <p className="mw-lead">قبل توزيع التركة تُؤدَّى أربعة حقوق بالترتيب التالي</p>
            <div className="mw-huquq-timeline">
              {HUQUQ.map((h) => (
                <div key={h.num} className="mw-haqq-item">
                  <div className="mw-haqq-num-wrap">
                    <span className="mw-haqq-num">{h.num}</span>
                    <span className="mw-haqq-priority">{h.priority}</span>
                  </div>
                  <div className="mw-haqq-content">
                    <h3 className="mw-haqq-title">{h.title}</h3>
                    <p className="mw-haqq-desc">{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mw-diptych">
              <div className="mw-diptych__half mw-diptych__half--green">
                <h3 className="mw-diptych__title">أسباب الإرث</h3>
                {ASBAB_MAWAANI.asbab.map((a) => (
                  <div key={a.title} className="mw-reason-item">
                    <span className="mw-reason-item__title">✓ {a.title}</span>
                    <span className="mw-reason-item__desc">{a.desc}</span>
                  </div>
                ))}
              </div>
              <div className="mw-diptych__half mw-diptych__half--red">
                <h3 className="mw-diptych__title">موانع الإرث</h3>
                {ASBAB_MAWAANI.mawaani.map((m) => (
                  <div key={m.title} className="mw-reason-item">
                    <span className="mw-reason-item__title">✕ {m.title}</span>
                    <span className="mw-reason-item__desc">{m.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── العصبة ── */}
        {tab === "asab" && (
          <div className="mw-section">
            <p className="mw-lead">العَصَبة: من يأخذ ما بقي من التركة بعد أصحاب الفروض، وثلاثة أنواع</p>
            <div className="mw-asab-list">
              {ASAB_TYPES.map((a, i) => (
                <div key={i} className="mw-asab-card">
                  <div className="mw-asab-num">{i + 1}</div>
                  <div>
                    <h3 className="mw-asab-type">{a.type}</h3>
                    <p className="mw-asab-desc">{a.desc}</p>
                    <div className="mw-asab-examples">
                      {a.ex.map((e) => (
                        <span key={e} className="mw-asab-ex">{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mw-note-box">
              <span>📌</span>
              <p>ترتيب العَصَبة بالنفس: الابن ثم ابن الابن ثم الأب ثم الجدّ ثم الأخ الشقيق ثم الأخ لأب ثم ابن الأخ ثم العمّ وهكذا، الأقرب يحجب الأبعد.</p>
            </div>
          </div>
        )}

        {/* ── الحجب ── */}
        {tab === "hajb" && (
          <div className="mw-section">
            <p className="mw-lead">الحجب: منع وارث من الميراث كله أو جزء منه بوجود وارث آخر</p>
            <div className="mw-hajb-list">
              {HAJB_TYPES.map((h, i) => (
                <div key={i} className="mw-hajb-card">
                  <h3 className="mw-hajb-type">{h.type}</h3>
                  <ul className="mw-hajb-cases">
                    {h.cases.map((c) => (
                      <li key={c} className="mw-hajb-case">{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mw-radd-box">
              <h3 className="mw-radd-box__title">الردّ (عكس العَوْل)</h3>
              <p className="mw-radd-box__text">
                إذا كانت التركة تزيد على مجموع الحصص (أي لا عَصَبة) فيُردّ الفاضل على أصحاب الفروض
                بنسبة حصصهم، ما عدا الزوجين فلا يُرَدّ عليهما في قول الجمهور.
              </p>
              <div className="mw-awl-box">
                <h3 className="mw-awl-box__title">العَوْل (عكس الردّ)</h3>
                <p className="mw-awl-box__text">
                  إذا زادت الحصص على التركة (أكثر من المئة بالمئة) فيُعال على الجميع بالتناسب، أي تُنقَص
                  حصة كل وارث بنفس النسبة. اتفق عليه الصحابة في عهد عمر ﵁.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── مسائل ── */}
        {tab === "masail" && (
          <div className="mw-section">
            <p className="mw-lead">مسائل فقهية مشهورة في علم الفرائض، تُبيّن دقة المنهج وعمق الفقه الإسلامي</p>
            <div className="mw-search-wrap">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في مسائل الفرائض..."
                className="page-search-input mw-search-input"
                aria-label="بحث في مسائل المواريث"
              />
            </div>
            <div className="mw-masail-list">
              {filteredMasail.map((m, i) => (
                <div key={i} className="mw-masala-card">
                  <div className="mw-masala-num">{i + 1}</div>
                  <div>
                    <h3 className="mw-masala-title">{m.title}</h3>
                    <p className="mw-masala-desc">{m.desc}</p>
                    <div className="mw-masala-formula">
                      <span className="mw-masala-formula__label">الصيغة:</span>
                      <code className="mw-masala-formula__code">{m.formula}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mw-hadith-box">
              <p className="mw-hadith-box__text">
                «تعلّموا الفرائض وعلّموها الناس فإنه نصف العلم وهو أول شيء يُنسى وأول شيء يُنزَع من أمتي»
              </p>
              <cite className="mw-hadith-box__ref">ابن ماجه، صحيح</cite>
            </div>
          </div>
        )}

        {/* related */}
        <div className="twh-share">
          <ShareButtons title="علم المواريث — المجلس العلمي" url="https://majlisilm.com/mawarith" />
        </div>

        <nav className="mw-related" aria-label="صفحات ذات صلة">
          <h2 className="mw-related__title">استكشف أيضاً</h2>
          <div className="mw-related__grid">
            {[
              { href: "/fiqh", label: "الفقه الإسلامي" },
              { href: "/zakat", label: "الزكاة وأحكامها" },
              { href: "/janaza", label: "أحكام الجنائز" },
              { href: "/madhahib", label: "المذاهب الفقهية" },
              { href: "/rulings", label: "الأحكام الشرعية" },
              { href: "/qa", label: "الأسئلة والأجوبة" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="mw-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في المواريث" count={4} />
      </div>
    </main>
  );
}
