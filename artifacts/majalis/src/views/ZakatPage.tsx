import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { Calculator, ChevronDown, ChevronUp, Info } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

/* ─── بيانات الأصناف ─── */
type ZakatKind = {
  id: string;
  icon: string;
  title: string;
  nisab: string;
  rate: string;
  condition: string;
  detail: string;
  dalil: string;
  dalilRef: string;
  mustahiq: string[];
  hasCalc?: boolean;
};

const KINDS: ZakatKind[] = [
  {
    id: "gold",
    icon: "💍",
    title: "زكاة الذهب والفضة",
    nisab: "نصاب الذهب: 85 غراماً. نصاب الفضة: 595 غراماً",
    rate: "2.5% (ربع العشر) من قيمة ما تملكه",
    condition: "أن يبلغ النصاب، وأن يمر عليه حول هجري كامل",
    detail: "تجب الزكاة في الذهب والفضة سواء كانا مدَّخرَين أو حلياً للاستخدام (عند جمهور العلماء). أما الفضة فنصابها أقل قيمةً من الذهب، والعبرة بالأقل في مصلحة الفقراء.",
    dalil: "وَالَّذِينَ يَكْنِزُونَ الذَّهَبَ وَالْفِضَّةَ وَلَا يُنفِقُونَهَا فِي سَبِيلِ اللَّهِ فَبَشِّرْهُم بِعَذَابٍ أَلِيمٍ",
    dalilRef: "التوبة: 34",
    mustahiq: ["الفقراء", "المساكين", "العاملون عليها", "المؤلفة قلوبهم", "في الرقاب", "الغارمون", "في سبيل الله", "ابن السبيل"],
    hasCalc: true,
  },
  {
    id: "money",
    icon: "💵",
    title: "زكاة المال النقدي",
    nisab: "ما يعادل قيمة 85 غرام ذهب (أو 595 غرام فضة)",
    rate: "2.5% من المبلغ الكلي",
    condition: "حولان الحول الهجري على المبلغ وهو بالغ النصاب",
    detail: "تشمل النقود في المصارف والمحافظ والودائع الادخارية. يُخرَج منها ربع العشر إذا بلغت النصاب ومضى عليها حول. الديون المستحقة يُزكَّى عنها على الصحيح.",
    dalil: "خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا",
    dalilRef: "التوبة: 103",
    mustahiq: ["الفقراء", "المساكين", "الغارمون", "ابن السبيل"],
    hasCalc: true,
  },
  {
    id: "trade",
    icon: "🏪",
    title: "زكاة عروض التجارة",
    nisab: "ما يعادل 85 غرام ذهب من قيمة البضاعة",
    rate: "2.5% من إجمالي قيمة المخزون",
    condition: "نية التجارة + بلوغ النصاب + حولان الحول",
    detail: "تشمل جميع البضائع المعدة للبيع. يُقوِّم التاجر بضاعته في نهاية الحول بسعر السوق ثم يُخرج 2.5%. ويجمع معها النقد والديون المرجوة، ويطرح الديون عليه.",
    dalil: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَنفِقُوا مِن طَيِّبَاتِ مَا كَسَبْتُمْ وَمِمَّا أَخْرَجْنَا لَكُم مِّنَ الْأَرْضِ",
    dalilRef: "البقرة: 267",
    mustahiq: ["الفقراء", "المساكين", "العاملون على الزكاة"],
  },
  {
    id: "crops",
    icon: "🌾",
    title: "زكاة الزروع والثمار",
    nisab: "5 أوسق = 653 كيلوغراماً",
    rate: "10% إن سُقيت بمطر أو نهر، و5% إن سُقيت بآلة",
    condition: "بلوغ النصاب، ولا يُشترط الحول، تُخرَج عند الحصاد",
    detail: "تجب في الحبوب المقتاتة: القمح والشعير والأرز والتمر والزبيب. أما الخضار والفواكه فلا زكاة فيها إلا إذا اتُّجر بها (زكاة تجارة). وتُخرَج فور الحصاد.",
    dalil: "وَآتُوا حَقَّهُ يَوْمَ حَصَادِهِ",
    dalilRef: "الأنعام: 141",
    mustahiq: ["الفقراء والمساكين في البلد"],
  },
  {
    id: "livestock",
    icon: "🐄",
    title: "زكاة الأنعام",
    nisab: "5 إبل · 30 بقرة · 40 شاة",
    rate: "تتفاوت حسب العدد وفق جداول شرعية مفصلة",
    condition: "أن ترعى الحول، وأن تبلغ النصاب، وأن لا تكون عوامل (مستخدمة في الحرث)",
    detail: "الإبل: من 5 شياه حتى 25 ففيها بنت مخاض... البقر: من 30 تبيع حتى 60 مسنة... الغنم: من 40 واحدة حتى 120 شاة... وتختلف التفاصيل بحسب أعداد القطيع.",
    dalil: "وَفِي كُلِّ سَائِمَةِ إبِلٍ في كُلِّ خَمْسٍ شَاةٌ",
    dalilRef: "حديث أنس في صحيح البخاري",
    mustahiq: ["الفقراء والمساكين"],
  },
  {
    id: "rikaz",
    icon: "⚗️",
    title: "الركاز والمعادن",
    nisab: "لا يُشترط له نصاب",
    rate: "الخمس (20%) فوراً",
    condition: "وجود كنز جاهلي مدفون في الأرض",
    detail: "الركاز: الكنوز المدفونة من الجاهلية، ففيه الخمس يُخرَج فوراً دون اشتراط حول. أما المعادن المستخرجة فعند جمهور الفقهاء فيها ربع العشر بعد بلوغ النصاب.",
    dalil: "«وفي الركاز الخمس»",
    dalilRef: "رواه البخاري ومسلم",
    mustahiq: ["مصارف الزكاة الثمانية"],
  },
  {
    id: "stocks",
    icon: "📈",
    title: "زكاة الأسهم والاستثمارات",
    nisab: "ما يعادل قيمة 85 غرام ذهب من إجمالي الأصول الزكوية",
    rate: "2.5% على قيمة الأسهم التجارية أو الأصول الزكوية في المحفظة",
    condition: "حولان الحول على الاستثمار وهو بالغ النصاب",
    detail: "للأسهم ثلاثة أحوال: (أ) إن اشتراها للبيع والشراء: زكّاها كعروض التجارة بسعرها الحالي. (ب) إن اشتراها لأرباح التوزيع: زكّى الأرباح المتراكمة والنقد. (ج) صناديق الاستثمار: يزكّى نصيبه من أصولها الزكوية بإخطار من الصندوق. وهذه من المسائل التي يُرجع فيها للعلماء المختصين.",
    dalil: "خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا",
    dalilRef: "التوبة: 103",
    mustahiq: ["الفقراء", "المساكين", "الغارمون"],
  },
  {
    id: "fitar",
    icon: "🌙",
    title: "زكاة الفطر",
    nisab: "تجب على كل مسلم قادر",
    rate: "صاع من غالب قوت البلد ≈ 2.5 كغ أو ما يعادله نقداً",
    condition: "أن يُدرك آخر رمضان وأول شوال، وأن يكون قادراً",
    detail: "تُخرَج قبل صلاة عيد الفطر، وتجوز من أول رمضان. يُخرجها عن نفسه ومن يعول. مصرفها الفقراء تحديداً، والحكمة طُهرة للصائم وإغناء الفقراء عن السؤال يوم العيد.",
    dalil: "«فرض رسول الله ﷺ زكاة الفطر صاعاً من تمر أو صاعاً من شعير على العبد والحر والذكر والأنثى والصغير والكبير من المسلمين»",
    dalilRef: "رواه البخاري ومسلم",
    mustahiq: ["الفقراء", "المساكين"],
  },
  {
    id: "realestate",
    icon: "🏠",
    title: "زكاة العقارات المؤجَّرة",
    nisab: "ما يعادل 85 غرام ذهب من صافي الأجرة المتراكمة",
    rate: "2.5% من صافي الأجرة عند حولان الحول",
    condition: "بلوغ الأجرة النصاب وحولان الحول الهجري عليها",
    detail: "العقار المُسكَن لا زكاة في رقبته. أما المؤجَّر فيُزكَّى في أجرته لا في قيمته: يجمع المالك ما تراكم من أجرة مع ما ادَّخره، فإذا بلغت النصاب ومضى عليها حول أخرج 2.5%. وهذا قول جمهور الفقهاء المعاصرين.",
    dalil: "خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا",
    dalilRef: "التوبة: 103",
    mustahiq: ["الفقراء", "المساكين", "الغارمون", "في سبيل الله"],
  },
  {
    id: "debts",
    icon: "📋",
    title: "زكاة الديون",
    nisab: "ما يعادل 85 غرام ذهب بمجموع الديون مع سائر المال",
    rate: "2.5% من الدين الراجح استيفاؤه",
    condition: "بلوغ النصاب مع سائر المال وحولان الحول",
    detail: "الديون على نوعين: (أ) دين على مليء مُقرٍّ به يُزكَّى كل حول مع سائر ماله. (ب) دين مماطل أو مجحود أو على مُعسِر: يُزكَّى بعد قبضه عن سنة واحدة فقط على الراجح. ويُضاف الدين المرجو إلى سائر المال عند احتساب النصاب.",
    dalil: "خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا",
    dalilRef: "التوبة: 103",
    mustahiq: ["الفقراء", "المساكين", "الغارمون"],
  },
];

/* ─── فضائل الزكاة ─── */
const ZAKAT_FADAIL = [
  {
    title: "تطهير المال وتزكية النفس",
    text: "قال تعالى: ﴿خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا﴾. الزكاة طهارة للمال من الشُّح والتعلق، وتزكية للنفس من البخل.",
    ref: "التوبة: ١٠٣",
  },
  {
    title: "ضمان البركة في الباقي",
    text: "قال ﷺ: «ما نقصت صدقة من مال». المال المُزكَّى يبارك الله فيه ويُنمِّيه. وقال: «ما فتح رجل باب عطية يريد بها صلة إلا زاده الله بها كثرة».",
    ref: "مسلم: ٢٥٨٨",
  },
  {
    title: "الأجر المضاعف يوم القيامة",
    text: "قال تعالى: ﴿مَثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنبُلَةٍ مِّائَةُ حَبَّةٍ وَاللَّهُ يُضَاعِفُ لِمَن يَشَاءُ﴾.",
    ref: "البقرة: ٢٦١",
  },
  {
    title: "وقاية من النار",
    text: "قال ﷺ: «اتقوا النار ولو بشق تمرة». والزكاة الواجبة حاجز يحمي صاحبها من النار يوم القيامة، ومن حُرمَ أجرها عُذِّب بماله.",
    ref: "البخاري: ١٤١٣، مسلم: ١٠١٦",
  },
  {
    title: "الزكاة عنوان صحة الإسلام",
    text: "ارتبطت الزكاة بالصلاة في القرآن في أكثر من ثمانية وعشرين موضعاً، مما يدل على أنها من علامات صحة الإسلام. وقاتل أبو بكر مانعيها لأنها فريضة لا تُهاوَن.",
    ref: "البخاري: ١٣٩٩",
  },
  {
    title: "الزكاة رابط الأمة وعمارة المجتمع",
    text: "أمر الله بالزكاة لسد حاجة الفقراء وتحقيق التكافل في المجتمع. ومن ثَمَّ ارتبطت بالصلاة في ثمانية وعشرين موضعاً قرآنياً. فلا صلاح مجتمع إلا بأداء حق المال لأصحابه.",
    ref: "البخاري: ١٣٩٩",
  },
  {
    title: "الزكاة وقاية المال من الآفات",
    text: "قال ﷺ: «حصّنوا أموالكم بالزكاة، وداووا مرضاكم بالصدقة، وأعدوا للبلاء الدعاء». الزكاة حصن يحمي المال من الآفات ويُنجي صاحبه من مصائب الدنيا والآخرة.",
    ref: "الطبراني، حسن بشواهده",
  },
  {
    title: "الزكاة برهان صادق على الإيمان",
    text: "قال ﷺ: «والصدقة برهان». فبذل المال الذي تُحبه النفس طاعةً لله أصدق برهان على صحة الإيمان. ولذا ارتبطت الزكاة بالصلاة في ثمانية وعشرين موضعاً من القرآن الكريم شعاراً جامعاً للمؤمنين.",
    ref: "مسلم: ٢٢٣",
  },
  {
    title: "عذاب مانع الزكاة يوم القيامة",
    text: "قال تعالى: ﴿وَالَّذِينَ يَكْنِزُونَ الذَّهَبَ وَالْفِضَّةَ وَلَا يُنفِقُونَهَا فِي سَبِيلِ اللَّهِ فَبَشِّرْهُم بِعَذَابٍ أَلِيمٍ﴾. وقال ﷺ في الذي لا يُؤدي الزكاة: «يُمثَّل له ماله شجاعاً أقرع له زبيبتان يُطوِّقه يوم القيامة».",
    ref: "التوبة: ٣٤، البخاري: ١٤٠٣",
  },
  {
    title: "الزكاة سبب لنزول الرزق ودفع البلاء",
    text: "قال ﷺ: «ما منع قوم الزكاة إلا حُبسوا المطر من السماء». والزكاة المُؤدَّاة طيباً بها النفس تستجلب بركة السماء وتدفع البلاء؛ لأن صاحبها يتعاون مع إرادة الله في توزيع الرزق.",
    ref: "ابن ماجه: ٤٠١٩، حسن بشواهده",
  },
];

/* ─── شروط وجوب الزكاة ─── */
const ZAKAT_SHURUT = [
  { num: "١", shart: "الإسلام", detail: "لا تجب الزكاة على غير المسلم." },
  { num: "٢", shart: "الحرية", detail: "لا زكاة على المملوك عند الجمهور لأنه لا يملك." },
  { num: "٣", shart: "ملك النصاب", detail: "أن يملك مالاً بالغاً الحدَّ الأدنى المُقرَّر شرعاً." },
  { num: "٤", shart: "حولان الحول", detail: "مرور سنة هجرية كاملة على المال — إلا في الزروع والمعادن." },
  { num: "٥", shart: "الملك التام", detail: "أن يكون المال ملكاً خالصاً للمزكِّي يتصرف فيه كيف شاء." },
  { num: "٦", shart: "النماء الفعلي أو التقديري", detail: "أن يكون المال ناميًا بذاته أو قابلاً للنماء كالأموال والمواشي والتجارة. أما الأشياء المستعملة للحاجة الشخصية فلا زكاة فيها." },
  { num: "٧", shart: "الخلوّ من الدين المستغرق", detail: "اشترط بعض الفقهاء (الحنفية والحنابلة) أن لا يكون على المزكِّي دينٌ يستغرق النصاب أو ينقصه، لأن الدين يُضعف الملك." },
  { num: "٨", shart: "فراغ المال عن الحاجة الأصلية", detail: "الأموال المصروفة لسد الحاجات الأصلية كالسكن والملبس وأدوات الحِرفة لا زكاة فيها؛ لأن الزكاة تجب في المال الفاضل عن الكفاية الحقيقية." },
];

/* ─── حاسبة مبسطة ─── */
function ZakatCalc() {
  const [gold, setGold] = useState("");
  const [silver, setSilver] = useState("");
  const [cash, setCash] = useState("");
  const [result, setResult] = useState<number | null>(null);

  /* سعر تقريبي: 1 غرام ذهب ≈ 220 دينار كويتي (يتغير) */
  const GOLD_PRICE_PER_GRAM = 220;
  const NISAB_GOLD_GRAMS = 85;
  const NISAB_VALUE = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM;

  function calculate() {
    const g = parseFloat(gold) || 0;
    const s = parseFloat(silver) || 0;
    const c = parseFloat(cash) || 0;
    const goldValue = g * GOLD_PRICE_PER_GRAM;
    const silverValue = s * 0.9; /* سعر تقريبي للجرام فضة */
    const total = goldValue + silverValue + c;
    if (total < NISAB_VALUE) { setResult(0); return; }
    setResult(Math.round(total * 0.025 * 100) / 100);
  }

  return (
    <div className="zk-calc">
      <div className="zk-calc__head">
        <Calculator size={18} aria-hidden="true" />
        <span>حاسبة الزكاة التقريبية</span>
      </div>
      <p className="zk-calc__note">
        <Info size={13} aria-hidden="true" />
        الأسعار تقريبية. راجع العالم الشرعي لدقة الحساب.
      </p>
      <div className="zk-calc__fields">
        <label className="zk-calc__field">
          <span>الذهب (غرام)</span>
          <input type="number" min="0" value={gold} onChange={(e) => setGold(e.target.value)} placeholder="0" className="zk-calc__input" />
        </label>
        <label className="zk-calc__field">
          <span>الفضة (غرام)</span>
          <input type="number" min="0" value={silver} onChange={(e) => setSilver(e.target.value)} placeholder="0" className="zk-calc__input" />
        </label>
        <label className="zk-calc__field">
          <span>النقود (دينار كويتي)</span>
          <input type="number" min="0" value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0" className="zk-calc__input" />
        </label>
      </div>
      <button type="button" className="zk-calc__btn" onClick={calculate}>احسب الزكاة</button>
      {result !== null && (
        <div className={`zk-calc__result${result === 0 ? " zk-calc__result--no" : ""}`}>
          {result === 0
            ? "المجموع لم يبلغ النصاب، لا زكاة"
            : `الزكاة المستحقة ≈ ${result.toFixed(2)} دينار كويتي`}
        </div>
      )}
    </div>
  );
}

export default function ZakatPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredKinds = useMemo(() =>
    search.trim() ? KINDS.filter(k => arabicMatchAny([k.title, k.detail, k.nisab, k.condition], search)) : KINDS,
  [search]);

  useEffect(() => {
    applyPageSeo({
      path: "/zakat",
      title: "الزكاة وأحكامها | المجلس العلمي",
      description: "دليل شامل لأحكام الزكاة: أنواعها وشروطها ونصابها ومصارفها، مع حاسبة مبسطة وأدلة من القرآن والسنة.",
      keywords: ["زكاة", "أحكام الزكاة", "نصاب الزكاة", "زكاة المال", "زكاة الفطر", "حاسبة زكاة"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أنواع الزكاة وأحكامها",
          description: "أنواع الزكاة المختلفة مع النصاب والشروط والأدلة الشرعية",
          numberOfItems: KINDS.length,
          itemListElement: KINDS.map((k, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: k.title,
            url: `https://majlisilm.com/zakat#${k.id}`,
          })),
        },
      ],
    });
  }, []);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <main className="zk-page" dir="rtl">
      {/* هيرو */}
      <section className="zk-hero">
        <div className="zk-hero__badge">الركن الثالث</div>
        <h1 className="zk-hero__title">الزكاة وأحكامها</h1>
        <p className="zk-hero__sub">
          الزكاة ركن من أركان الإسلام الخمسة، فريضة واجبة طُهرةً للمال وعطاءً للمحتاجين
        </p>
        <div className="zk-hero__stats">
          <div className="zk-hero__stat"><strong>8</strong><span>مصارف شرعية</span></div>
          <div className="zk-hero__stat"><strong>7</strong><span>أنواع الزكاة</span></div>
          <div className="zk-hero__stat"><strong>2.5%</strong><span>المال والذهب</span></div>
        </div>
      </section>

      {/* المصارف الثمانية */}
      <section className="zk-mustahiq">
        <h2 className="zk-mustahiq__title">مصارف الزكاة الثمانية</h2>
        <p className="zk-mustahiq__dalil">
          ﴿إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ وَالْعَامِلِينَ عَلَيْهَا وَالْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِي الرِّقَابِ وَالْغَارِمِينَ وَفِي سَبِيلِ اللَّهِ وَابْنِ السَّبِيلِ﴾، التوبة: 60
        </p>
        <div className="zk-mustahiq__grid">
          {["الفقراء", "المساكين", "العاملون عليها", "المؤلفة قلوبهم", "في الرقاب", "الغارمون", "في سبيل الله", "ابن السبيل"].map((m, i) => (
            <div key={m} className="zk-mustahiq__item">
              <span className="zk-mustahiq__num">{i + 1}</span>
              <span>{m}</span>
            </div>
          ))}
        </div>
      </section>

      {/* فضائل الزكاة */}
      <section className="zk-fadail">
        <h2 className="zk-fadail__title">فضائل الزكاة</h2>
        <div className="zk-fadail__grid">
          {ZAKAT_FADAIL.map((f, i) => (
            <div key={i} className="zk-fadl-card">
              <h3 className="zk-fadl-card__title">{f.title}</h3>
              <p className="zk-fadl-card__text">{f.text}</p>
              <p className="zk-fadl-card__ref">{f.ref}</p>
            </div>
          ))}
        </div>
      </section>

      {/* شروط وجوب الزكاة */}
      <section className="zk-shurut">
        <h2 className="zk-shurut__title">شروط وجوب الزكاة</h2>
        <div className="zk-shurut__list">
          {ZAKAT_SHURUT.map((s) => (
            <div key={s.num} className="zk-shart-item">
              <span className="zk-shart-num">{s.num}</span>
              <div>
                <strong className="zk-shart-name">{s.shart}</strong>
                <p className="zk-shart-detail">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* حاسبة الزكاة */}
      <ZakatCalc />

      {/* أنواع الزكاة */}
      <section className="zk-kinds">
        <h2 className="zk-kinds__title">أنواع الزكاة وأحكامها</h2>
        <div className="zk-search-wrap">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في أنواع الزكاة..." className="page-search-input zk-search-input"
            aria-label="بحث في أنواع الزكاة" />
        </div>
        <div className="zk-list">
          {filteredKinds.map((k) => {
            const isOpen = openId === k.id;
            return (
              <article key={k.id} className={`zk-card${isOpen ? " zk-card--open" : ""}`}>
                <button
                  type="button"
                  className="zk-card__header"
                  onClick={() => toggle(k.id)}
                  aria-expanded={isOpen}
                >
                  <span className="zk-card__icon"><SectionIcon name={k.icon} size={24} /></span>
                  <div className="zk-card__header-text">
                    <div className="zk-card__title">{k.title}</div>
                    <div className="zk-card__rate">{k.rate}</div>
                  </div>
                  {isOpen ? <ChevronUp size={18} className="zk-card__chevron" /> : <ChevronDown size={18} className="zk-card__chevron" />}
                </button>
                {isOpen && (
                  <div className="zk-card__body">
                    <div className="zk-row"><span className="zk-label">النصاب:</span><span>{k.nisab}</span></div>
                    <div className="zk-row"><span className="zk-label">الشرط:</span><span>{k.condition}</span></div>
                    <p className="zk-detail">{k.detail}</p>
                    <div className="zk-dalil">
                      <div className="zk-dalil__text">﴿{k.dalil}﴾</div>
                      <div className="zk-dalil__ref">{k.dalilRef}</div>
                    </div>
                    <div className="zk-mustahiq-inline">
                      <span className="zk-label">المستحقون:</span>
                      {k.mustahiq.map((m) => <span key={m} className="zk-chip">{m}</span>)}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* مشاركة */}
      <div className="zk-share">
        <ShareButtons title="الزكاة وأحكامها — المجلس العلمي" url="https://majlisilm.com/zakat" />
      </div>

      {/* ذات صلة */}
      <section className="zk-related">
        <h2 className="zk-related__title">استكشف أيضاً</h2>
        <div className="zk-related__grid">
          {[
            { href: "/arkan",          label: "أركان الإسلام" },
            { href: "/prayer-ranks",   label: "فضائل الصلاة" },
            { href: "/fiqh",           label: "الفقه الإسلامي" },
            { href: "/rulings",        label: "الأحكام الشرعية" },
            { href: "/sunan-yawmiyya", label: "السنن اليومية" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} className="zk-related__link">{label}</Link>
          ))}
        </div>
      </section>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه" count={4} />
      </div>
    </main>
  );
}
