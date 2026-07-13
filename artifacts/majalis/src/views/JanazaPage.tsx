import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionIcon } from "@/components/ui/SectionIcon";


type JanazaTab = "ghusl" | "takfin" | "salah" | "dafn" | "aadab";

/* ─── data ─── */
const GHUSL_STEPS = [
  { num: "١", title: "النية والبسملة", desc: "يبدأ بالنية ثم التسمية، وينبغي ستر العورة طوال الغسل" },
  { num: "٢", title: "إزالة الأذى", desc: "يُغسَّل الفرج وتُزال القاذورات إن وُجدت" },
  { num: "٣", title: "الوضوء", desc: "يُوضَّأ كوضوء الصلاة تماماً دون إدخال الماء في الأنف والفم" },
  { num: "٤", title: "الغسل بالماء والسدر", desc: "يُغسَّل الرأس والوجه أولاً، ثم الشق الأيمن، ثم الأيسر ثلاثاً" },
  { num: "٥", title: "الغسلة الأخيرة بالكافور", desc: "تُختم الغسلة الأخيرة بكافور (إن وُجد) لحسن الرائحة وتجميد الجسد" },
  { num: "٦", title: "تجفيف الجسد", desc: "يُجفَّف الجسد ثم يُطيَّب ويُكفَّن" },
  { num: "٧", title: "إغماض عيني الميت وإغلاق فمه", desc: "يُستحب إغماض عيني الميت فور وفاته والدعاء له، ويُربَط الفك بعصابة إن لزم لمنع فتح الفم، ثم تُحلُّ بعد تيبُّس الجسد" },
  { num: "٨", title: "تمشيط شعر المرأة وضفره", desc: "تُمشَّط شعر المرأة الميتة وتُضفَر ثلاثة قرون وتُجعَل خلفها؛ قالت أم عطية: «فضفرنا شعرها ثلاثة قرون وألقيناه خلفها» — متفق عليه" },
];

const GHUSL_NOTES = [
  "يجب ستر الميت وعدم كشفه أمام غير المحارم",
  "لا يُقصُّ شعر الميت ولا أظفاره ولا يُحلق",
  "الشهيد في المعركة لا يُغسَّل ويُدفن بدمه وثيابه",
  "الطفل يُغسَّل كالبالغ ويُصلَّى عليه",
  "يُستحب أن يتولى الغسل أقارب الميت الثقات",
  "يُستحسن أن يغسل الرجلَ الرجالُ والمرأةَ النساءُ، ويجوز للزوج غسل زوجته والعكس عند جمهور العلماء",
  "لا بأس بالبكاء على الميت بكاءً هادئاً دون نياحة ولا لطم، فعله النبي ﷺ على ابنه إبراهيم",
  "إذا تعذَّر الغسل لجرح أو مرض أو غيره جُمِعَ معه التيمم عند جمع من الفقهاء",
  "يُستحب تطييب الميت بالمسك في مواضع السجود السبعة بعد الغسل الأخير",
  "من مات في الإحرام يُغسَّل بماء وسدر ولا يُطيَّب ولا يُغطى رأسه؛ يُبعث يوم القيامة ملبياً — متفق عليه",
];

const TAKFIN_ITEMS = [
  {
    title: "تكفين الرجل",
    icon: "👨",
    desc: "السنة: ثلاثة أثواب بيض تُلفُّ لفاً. الواجب: ثوب واحد يستر جميع بدنه. لا عمامة ولا قميص",
    dalil: "كُفِّنَ النَّبِيُّ ﷺ فِي ثَلَاثَةِ أَثْوَابٍ يَمَانِيَّةٍ بِيضٍ",
    ref: "متفق عليه",
  },
  {
    title: "تكفين المرأة",
    icon: "👩",
    desc: "السنة: خمسة أثواب (إزار، خمار، قميص، ولفافتان). والواجب: ثوب يستر جميع بدنها",
    dalil: "كَفِّنُوا نِسَاءَكُمْ فِي خَمْسَةِ أَثْوَابٍ",
    ref: "المغني لابن قدامة",
  },
  {
    title: "التحنيط",
    icon: "🌿",
    desc: "يُوضَع الطيب (الكافور وما أشبهه) على مواضع السجود: الجبهة والأنف واليدين والركبتين وأطراف القدمين",
    dalil: "اجْعَلُوا فِي كَفَنِهِ شَيْئًا مِنَ الْكَافُورِ",
    ref: "سنن النسائي، صحيح",
  },
  {
    title: "لون الكفن وجودته",
    icon: "⚪",
    desc: "يُستحب أن يكون الكفن أبيضاً نظيفاً وسطاً غير مسرف ولا مبخوس، ويؤخذ من مال الميت قبل الديون والميراث",
    dalil: "البسوا من ثيابكم البياض فإنها من خير ثيابكم وكفِّنوا فيها موتاكم",
    ref: "رواه أبو داود والترمذي، صحيح",
  },
  {
    title: "ترتيب لف الكفن",
    icon: "🔄",
    desc: "تُبسط اللفائف بعضها فوق بعض ثم يُوضَع الميت عليها على ظهره ثم تُلفُّ اللفافة اليسرى على اليمنى ثم اليمنى على اليسرى",
    dalil: "كُفِّنَ رسول الله ﷺ في ثلاثة أثواب سحولية بيض لم يكن فيها قميص ولا عمامة",
    ref: "رواه البخاري ومسلم",
  },
  {
    title: "تكفين الطفل والرضيع",
    icon: "👶",
    desc: "يُكفَّن الطفل في ثوب واحد يستره، ويُستحب الثلاثة كالبالغ. والرضيع يكفي فيه ثوب يستره. ويُصلَّى عليه إن وُلد حياً وإن لم يستهل.",
    dalil: "كُلُّ مَوْلُودٍ يُولَدُ عَلَى الْفِطْرَةِ",
    ref: "البخاري: ١٣٥٨",
  },
  {
    title: "أحكام تكفين الشهيد",
    icon: "⚔️",
    desc: "الشهيد في المعركة لا يُغسَّل ولا يُكفَّن بل يُدفَن في ثيابه التي قُتل فيها. ويُنزَع عنه الجلد والسلاح ونحو ذلك، لأن النبي ﷺ أمر بدفن شهداء أحد في ثيابهم.",
    dalil: "«زمِّلوهم في كلومهم ودمائهم ودُفنوا في ثيابهم»",
    ref: "البخاري: ١٣٤٦، أبو داود: ٣١٣٤",
  },
  {
    title: "تطييب الكفن وتبخيره",
    icon: "🕯️",
    desc: "يُستحب تطييب ثياب الكفن بالبخور قبل لفّ الميت، وكذلك تطييب الميت بالمسك في مواضع السجود بعد الغسل الأخير، وهذا من إكرام الميت.",
    dalil: "«إذا أجمرتم الميت فأجمِروه ثلاثاً»",
    ref: "رواه أحمد: ٨٤٩٣، صحيح",
  },
  {
    title: "الكفن من التركة وترتيبه",
    icon: "📜",
    desc: "يُؤخذ الكفن من مال الميت مقدَّماً على الديون والميراث، فإن لم يكن له مال فعلى من تلزمه نفقته، فإن لم يكن فمن بيت المال أو الجماعة. ولا يجوز تكفينه في ثوب حرير.",
    dalil: "«ابدؤوا بالكفن من رأس ماله»",
    ref: "رواه البيهقي، وأصله في الصحيحين",
  },
];

const SALAH_ARKAN = [
  { num: "١", title: "النية", desc: "نية الصلاة على الميت في القلب، ولا يُشترط التلفظ بها" },
  { num: "٢", title: "القيام", desc: "الصلاة واقفاً قادراً ولا قعود فيها ولا ركوع ولا سجود" },
  { num: "٣", title: "التكبيرات الأربع", desc: "أربع تكبيرات، يرفع يديه مع كل تكبيرة إلى حذو المنكبين أو شحمتَي الأذنين" },
  { num: "٤", title: "الفاتحة", desc: "قراءة فاتحة الكتاب سراً بعد التكبيرة الأولى، ويُستحب التعوذ قبلها" },
  { num: "٥", title: "الصلاة على النبي", desc: "الصلاة الإبراهيمية كاملة بعد التكبيرة الثانية كما في التشهد" },
  { num: "٦", title: "الدعاء للميت", desc: "الدعاء المأثور للميت بعد التكبيرة الثالثة، ثم يدعو لنفسه وللمسلمين بعد الرابعة" },
  { num: "٧", title: "التسليم", desc: "تسليمة واحدة عن اليمين عند جمهور العلماء، أو تسليمتان عند بعضهم" },
  { num: "٨", title: "ترتيب الإمام", desc: "يقف الإمام عند رأس الرجل ووسط المرأة. وأفضل الصفوف الأول فالأول كالصلاة المعتادة" },
];

const DUA_MAYYIT =
  "اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ، وَاغْسِلْهُ بِالْمَاءِ وَالثَّلْجِ وَالْبَرَدِ";

const DAFN_ITEMS = [
  { icon: "⛏️", title: "حفر القبر", desc: "يُحفَر القبر ذراعاً ونصفاً في العمق تقريباً، ويُلحَد له في جانبه (اللحد أفضل من الشق)" },
  { icon: "🌙", title: "الاتجاه", desc: "يُدفَن الميت على جنبه الأيمن متجهاً نحو القبلة، فيُستحسن أن تكون رأسه جهة الشمال" },
  { icon: "🌿", title: "وضع الجريدة", desc: "يُستحب وضع جريدتين رطبتين على القبر اقتداءً بفعل النبي ﷺ" },
  { icon: "📿", title: "الدعاء عند الدفن", desc: "يُقال: بسم الله وعلى سنة رسول الله ﷺ، ويُنثَر التراب بيده ثلاثاً من جهة الرأس" },
  { icon: "🗿", title: "العلامة على القبر", desc: "يُجعَل على القبر حجر أو ما يشبهه علامةً لمعرفته، ويُكره تجصيصه والبناء عليه" },
  { icon: "🙏", title: "الدعاء بعد الدفن", desc: "يُستحب أن يقف المشيِّعون ويدعوا للميت بالثبات عند السؤال، ويقرؤوا له الفاتحة" },
  { icon: "🗣️", title: "التلقين بعد الدفن", desc: "يُستحب عند جماعة من العلماء تلقين الميت بعد الدفن: يا عبد الله يا ابن أمة الله، اذكر العهد الذي خرجت عليه من الدنيا..." },
  { icon: "🌺", title: "فضل تشييع الجنازة", desc: "قال ﷺ: من تبع جنازة مسلم إيماناً واحتساباً وكان معه حتى يُصلَّى عليها ويُفرغ من دفنها فإنه يرجع من الأجر بقيراطين. البخاري: ١٣٢٣" },
];

const TAAZIYA_AADAB = [
  { icon: "🤲", title: "تعجيل التعزية", desc: "يُستحب تعجيل التعزية قبل الدفن وبعده ما لم يمض ثلاثة أيام في الغالب" },
  { icon: "🍽️", title: "إعداد الطعام لأهل الميت", desc: "يُستحب أن يُعِدَّ جيران الميت وأقاربه طعاماً لأهل الميت لأنهم مشغولون عن أنفسهم" },
  { icon: "🕌", title: "ألفاظ التعزية", desc: "يُقال: إن لله ما أخذ وله ما أعطى وكل شيء عنده بأجل مسمى فاصبر واحتسب" },
  { icon: "🚫", title: "المنهيات", desc: "يُكره البكاء بصوت عال والنياحة وشق الجيوب ولطم الخدود والدعاء بالويل والثبور" },
  { icon: "📅", title: "زيارة القبور", desc: "زيارة القبور مشروعة للرجال بإجماع، وللنساء خلاف، والغاية التذكر والدعاء للأموات" },
  { icon: "📖", title: "قراءة القرآن عند القبر", desc: "يُستحب قراءة شيء من القرآن عند القبر إحساناً بالميت، ويُختلف في بلوغ الثواب" },
  { icon: "💔", title: "الصبر والاحتساب", desc: "الصبر عند المصيبة فريضة، والاحتساب بقول: إنا لله وإنا إليه راجعون يمحو ذنوباً ويرفع درجات" },
  { icon: "🌹", title: "الدعاء للميت بعد الدفن", desc: "يُستحب أن يقول المشيِّعون بعد الدفن: اللهم اغفر له، اللهم ثبِّته. قال ﷺ: استغفروا لأخيكم وسلوا له التثبيت فإنه الآن يُسأَل" },
  { icon: "🤍", title: "ذكر الميت بخير", desc: "قال ﷺ: اذكروا محاسن موتاكم وكُفُّوا عن مساوئهم، رواه أبو داود. ومن مات على الإسلام فله الترحم والاستغفار" },
  { icon: "⏱️", title: "الإسراع بتجهيز الجنازة", desc: "قال ﷺ: أسرعوا بالجنازة فإن تكُ صالحة فخيرٌ تُقدِّمونها إليه، وإن تكُ سوى ذلك فشرٌّ تضعونه عن رقابكم. متفق عليه: البخاري: ١٣١٥" },
  { icon: "👶", title: "الصلاة على الطفل والسقط", desc: "يُصلَّى على من وُلد حياً ولو لحظةً. أما السقط فيُصلَّى عليه عند كثير من العلماء إذا تمَّ أربعة أشهر ونُفخت فيه الروح" },
  { icon: "🌙", title: "الدعاء عند زيارة القبور", desc: "السلام عليكم دار قوم مؤمنين وإنا إن شاء الله بكم لاحقون، نسأل الله لنا ولكم العافية. رواه مسلم: ٩٧٥" },
];

const TABS: { id: JanazaTab; label: string; icon: string }[] = [
  { id: "ghusl", label: "الغسل", icon: "💧" },
  { id: "takfin", label: "التكفين", icon: "🌿" },
  { id: "salah", label: "الصلاة", icon: "🕌" },
  { id: "dafn", label: "الدفن", icon: "⛏️" },
  { id: "aadab", label: "التعزية والآداب", icon: "🤲" },
];

export default function JanazaPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/janaza",
      title: "أحكام الجنائز، المجلس العلمي",
      description: "دليل شامل لأحكام الجنائز: الغسل والتكفين والصلاة والدفن والتعزية والزيارة",
      keywords: ["الجنائز", "أحكام الجنازة", "صلاة الجنازة", "التكفين", "الدفن", "التعزية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "خطوات غسل الميت وتجهيزه",
          description: "خطوات غسل الميت والتكفين والصلاة والدفن وفق أحكام الشريعة",
          numberOfItems: GHUSL_STEPS.length,
          itemListElement: GHUSL_STEPS.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${s.num}: ${s.title} — ${s.desc}`,
            url: `https://majlisilm.com/janaza#step-${i + 1}`,
          })),
        },
      ],
    });
  }, []);

  const todayTakfin = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return TAKFIN_ITEMS[(day - 1 + TAKFIN_ITEMS.length) % TAKFIN_ITEMS.length];
  }, []);
  const [tab, setTab] = useState<JanazaTab>("ghusl");
  const [search, setSearch] = useState("");
  const filteredGhusulSteps = useMemo(() =>
    search.trim() ? GHUSL_STEPS.filter(s => arabicMatchAny([s.title, s.desc], search)) : GHUSL_STEPS,
  [search]);
  const filteredTakfin = useMemo(() =>
    search.trim() ? TAKFIN_ITEMS.filter(i => arabicMatchAny([i.title, i.desc, i.dalil], search)) : TAKFIN_ITEMS,
  [search]);
  const filteredSalahArkan = useMemo(() =>
    search.trim() ? SALAH_ARKAN.filter(r => arabicMatchAny([r.title, r.desc], search)) : SALAH_ARKAN,
  [search]);
  const filteredDafn = useMemo(() =>
    search.trim() ? DAFN_ITEMS.filter(d => arabicMatchAny([d.title, d.desc], search)) : DAFN_ITEMS,
  [search]);
  const filteredAadab = useMemo(() =>
    search.trim() ? TAAZIYA_AADAB.filter(a => arabicMatchAny([a.title, a.desc], search)) : TAAZIYA_AADAB,
  [search]);

  return (
    <main className="jn-page" dir="rtl">
      {/* hero */}
      <section className="jn-hero">
        <div className="jn-hero__badge">الفقه الإسلامي</div>
        <h1 className="jn-hero__title">أحكام الجنائز</h1>
        <p className="jn-hero__sub">
          دليل شامل لما يجب على المسلمين تجاه موتاهم من الغسل والتكفين والصلاة والدفن والتعزية
        </p>

        <div className="jn-ayah">
          <p className="jn-ayah__text">
            كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ ثُمَّ إِلَيْنَا تُرْجَعُونَ
          </p>
          <cite className="jn-ayah__ref">العنكبوت: 57</cite>
        </div>

        <nav className="jn-tabs" aria-label="أقسام الجنائز" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`jnz-tab-${t.id}`}
              type="button"
              role="tab"
              className={`jn-tab${tab === t.id ? " jn-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-selected={tab === t.id}
              aria-controls={`jnz-panel-${t.id}`}
            >
              <span className="jn-tab__icon"><SectionIcon name={t.icon} size={24} /></span>
              <span className="jn-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </section>

      {/* حكم التكفين اليوم */}
      <div className="jnod-card">
        <div className="jnod-card__badge"><Sparkles size={11} aria-hidden="true" /> حكم التكفين اليوم</div>
        <span className="jnod-card__icon">{todayTakfin.icon}</span>
        <h2 className="jnod-card__title">{todayTakfin.title}</h2>
        <p className="jnod-card__desc">{todayTakfin.desc}</p>
        <p className="jnod-card__dalil">«{todayTakfin.dalil}»<span className="jnod-card__ref"> — {todayTakfin.ref}</span></p>
      </div>

      <div className="jn-body">

        <div className="jnz-search-wrap">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في أحكام الجنائز..."
            className="page-search-input jnz-search-input"
            aria-label="بحث في أحكام الجنائز"
          />
        </div>

        {/* ── الغسل ── */}
        {tab === "ghusl" && (
          <section role="tabpanel" id="jnz-panel-ghusl" aria-labelledby="jnz-tab-ghusl" className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>حكم غسل الميت:</strong> فرض كفاية على المسلمين إذا قام به بعضهم سقط عن الباقين.
                ويُشترط أن يكون الغاسل مسلماً بالغاً عاقلاً.
              </p>
            </div>

            <div className="jn-steps">
              {filteredGhusulSteps.map((s) => (
                <div key={s.num} className="jn-step">
                  <div className="jn-step__num">{s.num}</div>
                  <div className="jn-step__content">
                    <strong className="jn-step__title">{s.title}</strong>
                    <p className="jn-step__desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="jn-subtitle">تنبيهات مهمة</h2>
            <ul className="jn-notes">
              {GHUSL_NOTES.map((n) => (
                <li key={n} className="jn-note">{n}</li>
              ))}
            </ul>
          </section>
        )}

        {/* ── التكفين ── */}
        {tab === "takfin" && (
          <section role="tabpanel" id="jnz-panel-takfin" aria-labelledby="jnz-tab-takfin" className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>حكم التكفين:</strong> فرض كفاية. يُؤخذ كفن الميت من ماله قبل قسمة التركة،
                ويُستحب أن يكون أبيض نظيفاً.
              </p>
            </div>
            {filteredTakfin.map((item) => (
              <div key={item.title} className="jn-takfin-card">
                <div className="jn-takfin-card__head">
                  <span className="jn-takfin-card__icon"><SectionIcon name={item.icon} size={24} /></span>
                  <strong className="jn-takfin-card__title">{item.title}</strong>
                </div>
                <p className="jn-takfin-card__desc">{item.desc}</p>
                <blockquote className="jn-dalil">
                  <p className="jn-dalil__text">{item.dalil}</p>
                  <cite className="jn-dalil__ref">{item.ref}</cite>
                </blockquote>
              </div>
            ))}
          </section>
        )}

        {/* ── الصلاة ── */}
        {tab === "salah" && (
          <section role="tabpanel" id="jnz-panel-salah" aria-labelledby="jnz-tab-salah" className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>حكم صلاة الجنازة:</strong> فرض كفاية. تصح منفردة وفي جماعة، وتُؤدَّى بعد الغسل
                والتكفين قبل الدفن. لا سجود فيها ولا ركوع.
              </p>
            </div>

            <h2 className="jn-subtitle">أركان صلاة الجنازة</h2>
            <div className="jn-arkan-grid">
              {filteredSalahArkan.map((rk) => (
                <div key={rk.num} className="jn-rukn-card">
                  <span className="jn-rukn-card__num">{rk.num}</span>
                  <div>
                    <strong className="jn-rukn-card__title">{rk.title}</strong>
                    <p className="jn-rukn-card__desc">{rk.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="jn-subtitle">دعاء الميت</h2>
            <div className="jn-dua-box">
              <span className="jn-dua-box__label">يُقال بعد التكبيرة الثالثة</span>
              <p className="jn-dua-box__text">{DUA_MAYYIT}</p>
              <cite className="jn-dua-box__ref">متفق عليه</cite>
            </div>

            <div className="jn-info jn-info--mt">
              <span className="jn-info__icon">💡</span>
              <p>
                من فاتته التكبيرة الأولى يدخل مع الإمام ثم يقضي ما فاته بعد التسليم.
                ويُستحب أن يكون الإمام أمام صدر الرجل ووسط المرأة.
              </p>
            </div>
          </section>
        )}

        {/* ── الدفن ── */}
        {tab === "dafn" && (
          <section role="tabpanel" id="jnz-panel-dafn" aria-labelledby="jnz-tab-dafn" className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>حكم الدفن:</strong> فرض كفاية، ويُستحب الإسراع به. ولا يجوز حرق الميت المسلم
                ولا دفنه في البحر إلا لضرورة. ولا يُدفن في تابوت إلا لرطوبة الأرض.
              </p>
            </div>
            <div className="jn-dafn-grid">
              {filteredDafn.map((d) => (
                <div key={d.title} className="jn-dafn-card">
                  <span className="jn-dafn-card__icon"><SectionIcon name={d.icon} size={24} /></span>
                  <div>
                    <strong className="jn-dafn-card__title">{d.title}</strong>
                    <p className="jn-dafn-card__desc">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── التعزية والآداب ── */}
        {tab === "aadab" && (
          <section role="tabpanel" id="jnz-panel-aadab" aria-labelledby="jnz-tab-aadab" className="jn-section">
            <div className="jn-info">
              <span className="jn-info__icon">📌</span>
              <p>
                <strong>التعزية:</strong> سنة مؤكدة، وهي مواساة أهل الميت وتخفيف حزنهم.
                قال النبي ﷺ: «مَا مِنْ مُؤْمِنٍ يُعَزِّي أَخَاهُ بِمُصِيبَةٍ إِلَّا كَسَاهُ اللَّهُ مِنْ حُلَلِ الْكَرَامَةِ يَوْمَ الْقِيَامَةِ». (سنن ابن ماجه، صحيح)
              </p>
            </div>
            {filteredAadab.map((a) => (
              <div key={a.title} className="jn-adab-card">
                <span className="jn-adab-card__icon"><SectionIcon name={a.icon} size={24} /></span>
                <div>
                  <strong className="jn-adab-card__title">{a.title}</strong>
                  <p className="jn-adab-card__desc">{a.desc}</p>
                </div>
              </div>
            ))}

            <div className="jn-hadith-box">
              <blockquote className="jn-hadith-box__text">
                أَكْثِرُوا ذِكْرَ هَاذِمِ اللَّذَّاتِ
              </blockquote>
              <cite className="jn-hadith-box__ref">سنن الترمذي، صحيح | المعنى: الموت</cite>
            </div>
          </section>
        )}

        <div className="twh-share">
          <ShareButtons title="أحكام الجنازة — المجلس العلمي" url="https://majlisilm.com/janaza" />
        </div>

        {/* related */}
        <nav className="jn-related" aria-label="صفحات ذات صلة">
          <h2 className="jn-related__title">استكشف أيضاً</h2>
          <div className="jn-related__grid">
            {[
              { href: "/tahara", label: "الطهارة وأحكامها" },
              { href: "/sawm", label: "الصيام وأحكامه" },
              { href: "/fiqh", label: "الفقه الإسلامي" },
              { href: "/adhkar", label: "الأذكار" },
              { href: "/duas", label: "الأدعية الشرعية" },
              { href: "/arkan", label: "أركان الإسلام" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="jn-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه" count={4} />
      </div>
    </main>
  );
}
