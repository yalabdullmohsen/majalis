import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, GraduationCap, Lightbulb, Scale, Star } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/elite-2026.css";

/* ══════════════════════════════════════════════════════════════════
   §243، آداب طالب العلم  (.atl-*)
   ══════════════════════════════════════════════════════════════════ */

type TabType = "fadl" | "adab-nafs" | "adab-sheikh" | "adab-ilm" | "marratib" | "kutub";

interface AdabItem {
  title: string;
  text: string;
  source?: string;
}

interface MurtabaKitab {
  level: string;
  desc: string;
  books: { name: string; author: string; note?: string }[];
}

const TABS: { id: TabType; label: string; Icon: typeof BookOpen }[] = [
  { id: "fadl",        label: "فضل العلم",           Icon: Star },
  { id: "adab-nafs",  label: "آداب مع النفس",        Icon: Scale },
  { id: "adab-sheikh", label: "آداب مع الشيخ",       Icon: GraduationCap },
  { id: "adab-ilm",   label: "آداب في الدرس",        Icon: BookOpen },
  { id: "marratib",   label: "مراتب طالب العلم",     Icon: Lightbulb },
  { id: "kutub",      label: "الكتب المقررة",         Icon: BookOpen },
];

/* ══ فضل العلم ══ */
const FADL_ITEMS: AdabItem[] = [
  {
    title: "العلم فريضة",
    text: "قال ﷺ: «طلبُ العلمِ فريضةٌ على كلِّ مسلمٍ».",
    source: "رواه ابن ماجه، وحسّنه الألباني",
  },
  {
    title: "خيرية العالم على العابد",
    text: "قال ﷺ: «فضلُ العالِمِ على العابدِ كفضلِ القمرِ ليلةَ البدرِ على سائرِ الكواكبِ».",
    source: "رواه أبو داود والترمذي",
  },
  {
    title: "العلماء ورثة الأنبياء",
    text: "قال ﷺ: «العلماءُ وَرَثةُ الأنبياءِ، إنَّ الأنبياءَ لم يُوَرِّثوا ديناراً ولا درهماً، وإنَّما وَرَّثوا العلمَ، فمَن أخذَه أخذَ بحظٍّ وافرٍ».",
    source: "رواه أبو داود والترمذي",
  },
  {
    title: "الدعاء للعالم",
    text: "قال ﷺ: «إنَّ اللهَ وملائكتَه وأهلَ السمواتِ والأرضِ، حتى النملةَ في جُحْرِها وحتى الحوتَ، لَيُصَلُّونَ على مُعَلِّمِ الناسِ الخيرَ».",
    source: "رواه الترمذي",
  },
  {
    title: "الخير الباقي بعد الموت",
    text: "«إذا ماتَ ابنُ آدمَ انقطعَ عملُه إلَّا من ثلاثٍ: صدقةٌ جاريةٌ، أو علمٌ يُنتَفَعُ به، أو ولدٌ صالحٌ يدعو له».",
    source: "رواه مسلم",
  },
  {
    title: "طريق الجنة",
    text: "قال ﷺ: «مَن سلكَ طريقاً يلتمسُ فيه علماً سَهَّلَ اللهُ له به طريقاً إلى الجنةِ».",
    source: "رواه مسلم",
  },
];

/* ══ آداب النفس ══ */
const ADAB_NAFS: AdabItem[] = [
  {
    title: "الإخلاص لله",
    text: "أن يُخلصَ النية في طلب العلم لوجه الله تعالى لا للتفاخر أو المال أو الجاه. قال ابن الجوزي: «ما أفلح طالبُ علمٍ وضعَ الدنيا نُصبَ عينَيه».",
  },
  {
    title: "الاستعداد بالعمل",
    text: "قال الخطيب البغدادي: «أوَّلُ ما يجبُ على طالبِ الحديثِ أن يُصحِّحَ نيَّتَه ثم يعمل بما تعلَّم». فالعمل بالعلم شرطٌ في بركته.",
  },
  {
    title: "التواضع",
    text: "قال الشافعي رحمه الله: «تعلَّمتُ التواضعَ من أبي يوسف». والتكبر يُغلق باب الفهم. وكان مالك يقول: «التواضعُ من أخلاقِ العلماء».",
  },
  {
    title: "الورع والزهد",
    text: "قال يحيى بن معين: «من استوت عنده المدحةُ والذمةُ فهو العالم حقاً». والورع عن الشبهات يُنوِّر القلب ويُفتح به باب الحفظ والفهم.",
  },
  {
    title: "المداومة والصبر",
    text: "قال ابن الجوزي: «العلم لا يُؤخذ بالاستعجال، ومن أراد أن يختصر زمن الطلب فسيُضيِّع كثيراً». والصبر على المشايخ وعلى مشاقّ الطلب أساس.",
  },
  {
    title: "حفظ الوقت",
    text: "كان ابن عقيل الحنبلي يقول: «إني لا يحِلُّ لي أن أُضيِّعَ ساعةً». وكان يأكل من الخبز المبلَّل ليوفِّر وقت المضغ للقراءة.",
  },
  {
    title: "التدرّج ولا قفز",
    text: "قال ابن خلدون: «العلومُ متراتبةٌ لا ينتقلُ من المبتدئ إلى المنتهى دفعةً واحدة». من بدأ بالمتون الكبار قبل أوانه أضاع وقته.",
  },
];

/* ══ آداب مع الشيخ ══ */
const ADAB_SHEIKH: AdabItem[] = [
  {
    title: "اختيار الشيخ",
    text: "قال ابن سيرين: «إن هذا العلم دين فانظروا عمَّن تأخذون دينكم». ويُختار الشيخ المتقن العارف بالسنة الموثوق في دينه وعلمه.",
  },
  {
    title: "التأدب في الحضور",
    text: "لا يُكثر الكلام بين يدي الشيخ دون حاجة، ولا يتقدم عليه بالكلام. قال أحمد: «ما مددتُ رجليَّ نحو دار ابن سيرين قط وبيني وبينه فرلسخ».",
  },
  {
    title: "قبول العتاب",
    text: "قال يحيى بن معين: «من لم يصبر على ذُلِّ التعلم بقي في جهل»، ومن الأدب مع الشيخ أن يصبر على تنبيهاته وتصحيحاته.",
  },
  {
    title: "عدم التعجّل بالخلاف",
    text: "لا يُبادر الطالب المبتدئ بمخالفة الشيخ أو رده علناً دون أدلة واضحة ونضوج علمي كافٍ. وإن رأى خطأً فيُنبِّه سراً بأدب.",
  },
  {
    title: "الدعاء للشيخ",
    text: "من حقوق الشيخ الدعاء له في حياته وبعد مماته، والإشادة بفضله وعلمه. قال الشافعي: «كنت أُصفِّح الورق بين يدي مالك رفقاً به لئلا يسمع صوتاً».",
  },
  {
    title: "خدمة الشيخ",
    text: "كانت العلماء تخدم مشايخها تأدباً لا تكليفاً. قال الربيع المرادي: «لو كان في إمكاني أن أجعل للشافعي الأرضَ ذهباً لفعلتُ».",
  },
];

/* ══ آداب الدرس ══ */
const ADAB_DARS: AdabItem[] = [
  {
    title: "الحضور على طهارة",
    text: "يُستحب للطالب أن يحضر مجلس العلم على طهارة مستاكاً متعطراً لأن ملائكة الرحمة تحضر مجالس العلم.",
  },
  {
    title: "سؤال ما أُشكِل",
    text: "قال مجاهد: «لا ينال العلمَ مستحيٍ ولا متكبِّر». ومن الأدب ألا يسكت على إشكال بل يسأل. غير أن يُراعى الوقت والمحلّ.",
  },
  {
    title: "التركيز والإنصات",
    text: "قال الخطيب في «الفقيه والمتفقه»: «ينبغي لمن يحضر مجلس العلم ألا يشتغل قلبه بشيء آخر». والشرود يُذهب البركة.",
  },
  {
    title: "تقييد العلم بالكتابة",
    text: "قال ﷺ: «قيِّدوا العلمَ بالكتابة». والحفظ وحده لا يغني عن التدوين لمن يريد الإتقان.",
  },
  {
    title: "المراجعة والتكرار",
    text: "قال ابن مسعود: «إن هذا العلم ينفر، فاستتبعوه بالمذاكرة». والعلم كالبستان لا يُثمر بلا سقي.",
  },
  {
    title: "ترتيب الأولويات",
    text: "قال بعض العلماء: «تعلَّم ما لا يسعك جهله قبل ما يحسن بك علمه». فالفروض العينية أولاً ثم الكفائية.",
  },
];

/* ══ مراتب طالب العلم ══ */
const MARRATIB: { stage: string; years: string; focus: string; sign: string }[] = [
  {
    stage: "المبتدئ",
    years: "١-٣ سنوات",
    focus: "الأصول والمتون المختصرة في العقيدة والفقه والنحو والحديث الأربعيني",
    sign: "يُفرِّق بين الفرض والسنة، ويعرف أصول العقيدة، ويضبط الآجرومية.",
  },
  {
    stage: "المتوسط",
    years: "٤-٧ سنوات",
    focus: "الشروح المتوسطة، علوم الحديث، التفسير، الأصول، الفقه المذهبي المعمَّق",
    sign: "يستطيع التخريج الأوَّلي، ويُميِّز الصحيح من الضعيف، ويستدل بالأدلة.",
  },
  {
    stage: "المتقدم",
    years: "٨-١٥ سنة",
    focus: "الكتب الأمهات في كل فن، نقد الرجال، الاجتهاد، مقارنة المذاهب",
    sign: "له نظر في الدليل، ويُفتي في المسائل المعيَّنة باستئناس الشيوخ.",
  },
  {
    stage: "المتأهل للإفتاء",
    years: "١٥+ سنة",
    focus: "الجمع بين الرواية والدراية، الفقه المقارن، أصول الفقه تطبيقاً",
    sign: "يستطيع ترجيح الأقوال بدليلها وإصدار الفتوى في المسائل المستجدة.",
  },
];

/* ══ الكتب المقررة ══ */
const KUTUB: MurtabaKitab[] = [
  {
    level: "مستوى مبتدئ",
    desc: "كتب مختصرة في أصول العلوم، قابلة للحفظ والفهم بلا عناء",
    books: [
      { name: "الأربعون النووية", author: "النووي", note: "حفظ وشرح" },
      { name: "لمعة الاعتقاد", author: "ابن قدامة", note: "في العقيدة" },
      { name: "الآجرومية", author: "ابن آجروم", note: "في النحو" },
      { name: "متن ابن عاشر", author: "ابن عاشر", note: "في الفقه المالكي" },
      { name: "متن أبي شجاع", author: "الغزي", note: "في الفقه الشافعي" },
      { name: "زاد المستقنع", author: "الحجاوي", note: "في الفقه الحنبلي" },
    ],
  },
  {
    level: "مستوى متوسط",
    desc: "شروح وكتب مستقلة تُعمِّق الفهم وتُرسِّخ الأصول",
    books: [
      { name: "نخبة الفكر", author: "ابن حجر", note: "في مصطلح الحديث" },
      { name: "الورقات", author: "الجويني", note: "في أصول الفقه" },
      { name: "الجزرية", author: "ابن الجزري", note: "في التجويد" },
      { name: "رياض الصالحين", author: "النووي", note: "جامع أحاديث" },
      { name: "التدمرية", author: "ابن تيمية", note: "في توحيد الأسماء والصفات" },
      { name: "أصول التفسير", author: "ابن عثيمين", note: "مدخل علوم القرآن" },
    ],
  },
  {
    level: "مستوى متقدم",
    desc: "الكتب الأمهات في كل علم، مفردةً أو بشروحها",
    books: [
      { name: "صحيح البخاري", author: "البخاري", note: "مع فتح الباري" },
      { name: "المغني", author: "ابن قدامة", note: "موسوعة فقهية حنبلية" },
      { name: "المحلى", author: "ابن حزم", note: "فقه مقارن بالأدلة" },
      { name: "إرشاد الفحول", author: "الشوكاني", note: "أصول الفقه" },
      { name: "تاريخ الإسلام", author: "الذهبي", note: "تاريخ وتراجم" },
      { name: "الاعتصام", author: "الشاطبي", note: "في البدعة والسنة" },
    ],
  },
];

export default function AdabTalabIlmPage() {
  const [activeTab, setActiveTab] = useState<TabType>("fadl");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/adab-talab-ilm",
      title: "آداب طالب العلم | المجلس العلمي",
      description: "دليل طالب العلم الشرعي، فضل العلم وآداب التعلم ومراتب طالب العلم والكتب المقررة في كل مستوى.",
      keywords: ["آداب طالب العلم", "فضل العلم", "طلب العلم", "الطريق إلى العلم", "كتب العلم"],
    });
    setOpenIdx(null);
  }, [activeTab]);

  return (
    <div className="atl-page" dir="rtl">
      {/* Hero */}
      <section className="atl-hero">
        <div className="atl-hero__inner">
          <div className="atl-hero__badge">دليل طالب العلم</div>
          <h1 className="atl-hero__title">آداب طالب العلم</h1>
          <p className="atl-hero__sub">
            من فضل العلم وشرف أهله، إلى آداب التعلم ومراتب الطلب وكتب كل مرحلة، مرجع شامل لمن يسلك طريق الوحي
          </p>
          <div className="atl-hero__quote">
            «مَن سلكَ طريقاً يلتمسُ فيه علماً سَهَّلَ اللهُ له به طريقاً إلى الجنةِ»، رواه مسلم
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="atl-tabs-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`atl-tab${activeTab === id ? " atl-tab--active" : ""}`}
            onClick={() => setActiveTab(id)}
            aria-selected={activeTab === id}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div className="atl-container">
        {/* فضل العلم */}
        {activeTab === "fadl" && (
          <div className="atl-section">
            <div className="atl-section-intro">
              <p>
                العلم الشرعي أشرف العلوم لأنه يُوصل إلى معرفة الله ومراضيه. وقد حثَّ القرآن على التعلم في أكثر من
                سبعمائة آية، وحثَّ النبي ﷺ عليه في أحاديث كثيرة متواترة المعنى.
              </p>
            </div>
            <div className="atl-cards">
              {FADL_ITEMS.map((item, i) => (
                <div key={i} className="atl-card atl-card--hadith">
                  <h3 className="atl-card__title">{item.title}</h3>
                  <p className="atl-card__text">{item.text}</p>
                  {item.source && <p className="atl-card__source">{item.source}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* آداب النفس */}
        {activeTab === "adab-nafs" && (
          <div className="atl-section">
            <div className="atl-section-intro">
              <p>
                آداب النفس هي الأساس، بلا إخلاص وتواضع وورع لن تُفتح لك أبواب العلم ولو أمضيت العمر في القراءة.
                قال ابن عباس: «ذللتُ طالباً فعززتُ مطلوباً».
              </p>
            </div>
            <div className="atl-accordion">
              {ADAB_NAFS.map((item, i) => (
                <div key={i} className={`atl-acc-item${openIdx === i ? " atl-acc-item--open" : ""}`}>
                  <button
                    type="button"
                    className="atl-acc-head"
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    aria-expanded={openIdx === i}
                  >
                    <span className="atl-acc-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="atl-acc-title">{item.title}</span>
                    {openIdx === i ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {openIdx === i && (
                    <div className="atl-acc-body">
                      <p>{item.text}</p>
                      {item.source && <p className="atl-card__source">{item.source}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* آداب مع الشيخ */}
        {activeTab === "adab-sheikh" && (
          <div className="atl-section">
            <div className="atl-section-intro">
              <p>
                الشيخ المعلم له حق الأبوة في الدين. قال الغزالي: «حق المعلم على المتعلم أعظم من حق الوالد». وقد
                كانت العلماء تضرب أمثالاً في توقير الأئمة ومعلميهم.
              </p>
            </div>
            <div className="atl-accordion">
              {ADAB_SHEIKH.map((item, i) => (
                <div key={i} className={`atl-acc-item${openIdx === i ? " atl-acc-item--open" : ""}`}>
                  <button
                    type="button"
                    className="atl-acc-head"
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    aria-expanded={openIdx === i}
                  >
                    <span className="atl-acc-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="atl-acc-title">{item.title}</span>
                    {openIdx === i ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {openIdx === i && (
                    <div className="atl-acc-body">
                      <p>{item.text}</p>
                      {item.source && <p className="atl-card__source">{item.source}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* آداب الدرس */}
        {activeTab === "adab-ilm" && (
          <div className="atl-section">
            <div className="atl-section-intro">
              <p>
                آداب الجلوس في مجلس العلم تُجسِّد تعظيم العلم ذاته. وهي سنة العلماء في جميع الطبقات من الصحابة
                فمن بعدهم. قال الشافعي: «كنت أُصفِّح الورق بين يدي مالك خِفيةً لئلا يؤذيَه الصوت».
              </p>
            </div>
            <div className="atl-accordion">
              {ADAB_DARS.map((item, i) => (
                <div key={i} className={`atl-acc-item${openIdx === i ? " atl-acc-item--open" : ""}`}>
                  <button
                    type="button"
                    className="atl-acc-head"
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    aria-expanded={openIdx === i}
                  >
                    <span className="atl-acc-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="atl-acc-title">{item.title}</span>
                    {openIdx === i ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {openIdx === i && (
                    <div className="atl-acc-body">
                      <p>{item.text}</p>
                      {item.source && <p className="atl-card__source">{item.source}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* مراتب طالب العلم */}
        {activeTab === "marratib" && (
          <div className="atl-section">
            <div className="atl-section-intro">
              <p>
                مراتب الطلب ليست تعسفاً بل هي سُنَّة العلماء الذين جعلوا للعلم أبواباً متدرجة. من تجاوز مرحلته
                دون استيعابها بنى على غير أساس.
              </p>
            </div>
            <div className="atl-stages">
              {MARRATIB.map((m, i) => (
                <div key={i} className="atl-stage">
                  <div className="atl-stage__num">{i + 1}</div>
                  <div className="atl-stage__body">
                    <div className="atl-stage__head">
                      <h3 className="atl-stage__title">{m.stage}</h3>
                      <span className="atl-stage__years">{m.years}</span>
                    </div>
                    <p className="atl-stage__focus"><strong>التركيز:</strong> {m.focus}</p>
                    <div className="atl-stage__sign">
                      <span className="atl-label">علامة الانتقال</span>
                      <p>{m.sign}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الكتب المقررة */}
        {activeTab === "kutub" && (
          <div className="atl-section">
            <div className="atl-section-intro">
              <p>
                هذه الكتب اختيارات العلماء المعاصرين لمناهج الطالب في كل مرحلة. وتختلف المناهج باختلاف
                المدارس والمناطق. الأهم هو التزام منهج واحد والإتمام قبل التشعب.
              </p>
            </div>
            <div className="atl-kutub-levels">
              {KUTUB.map((level, i) => (
                <div key={i} className="atl-kutub-level">
                  <div className="atl-kutub-level__head">
                    <h3 className="atl-kutub-level__title">{level.level}</h3>
                    <p className="atl-kutub-level__desc">{level.desc}</p>
                  </div>
                  <div className="atl-kutub-grid">
                    {level.books.map((b, j) => (
                      <div key={j} className="atl-kitab">
                        <div className="atl-kitab__name">{b.name}</div>
                        <div className="atl-kitab__author">{b.author}</div>
                        {b.note && <div className="atl-kitab__note">{b.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="atl-note-box">
              <strong>تنبيه مهم:</strong> لا تأخذ هذه القوائم بدون مشورة شيخ يعرف مستواك. الكتاب المناسب في الوقت
              المناسب خيرٌ من عشرة كتب في غير موضعها.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
