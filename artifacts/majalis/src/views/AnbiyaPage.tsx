import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/elite-2026.css";

/* ══════════════════════════════════════════════════════════════════
   §244 — صفحة الأنبياء والرسل  (.nb-*)
   ══════════════════════════════════════════════════════════════════ */

type NabiTab = "list" | "compare" | "ulul-azm" | "miracles";

interface Nabi {
  id: number;
  name: string;
  nameAlt?: string;
  era: string;
  quranic: boolean;
  mentioned: number;
  people: string;
  miracle?: string;
  book?: string;
  story: string;
  lessons: string[];
  quranRef?: string;
}

const ANBIYA: Nabi[] = [
  {
    id: 1, name: "آدم", nameAlt: "أبو البشر", era: "بداية الخليقة",
    quranic: true, mentioned: 25, people: "جميع البشرية",
    miracle: "خُلق من طين، وعُلِّم الأسماء كلها", book: undefined,
    story: "خُلق أبونا آدم ﷺ من طين وأُسجد له الملائكة. سكن الجنة مع حواء، ثم نزلا إلى الأرض بعد الابتلاء بالشجرة. تاب الله عليه وجعله أول خليفة في الأرض.",
    lessons: ["التوبة والرجوع إلى الله", "خطر الاغترار بالعدو الشيطان", "شرف العلم على العبادة"],
    quranRef: "البقرة: ٣٠-٣٩، طه: ١١٥-١٢٣",
  },
  {
    id: 2, name: "إدريس", nameAlt: "أخنوخ", era: "قبل نوح",
    quranic: true, mentioned: 2, people: "قوم من المشرق",
    miracle: "رُفع إلى السماء", book: undefined,
    story: "قال الله فيه: ﴿وَرَفَعْنَاهُ مَكَانًا عَلِيًّا﴾. كان أول من خطَّ بالقلم وخاط الثياب. أُوتي الحكمة وعلم الفلك.",
    lessons: ["الاجتهاد في العمل الصالح", "فضل العلم والتعليم"],
    quranRef: "مريم: ٥٦-٥٧، الأنبياء: ٨٥",
  },
  {
    id: 3, name: "نوح", nameAlt: "شيخ المرسلين", era: "١٠ قرون بعد آدم",
    quranic: true, mentioned: 43, people: "قوم نوح",
    miracle: "السفينة والطوفان — أنجاه الله والمؤمنين",
    story: "مكث نوح ﷺ في قومه ٩٥٠ سنة يدعوهم، فلم يؤمن منهم إلا القليل. أمره الله بصناعة السفينة، فأغرق الله الكافرين وأنجى المؤمنين.",
    lessons: ["الصبر على الأذى في الدعوة", "ثمرة التوكل على الله", "خطر عقوق الولد"],
    quranRef: "هود: ٢٥-٤٨، نوح: ١-٢٨",
  },
  {
    id: 4, name: "هود", nameAlt: undefined, era: "بعد نوح",
    quranic: true, mentioned: 7, people: "عاد (الأحقاف)",
    miracle: "نجاه الله من الريح العقيم التي أهلكت قومه",
    story: "أُرسل إلى عاد أهل الأحقاف — قوم أصحاب قوة وأبراج. كذَّبوه فأهلكهم الله بريح صرصر عاتية سبع ليالٍ وثمانية أيام.",
    lessons: ["الغرور بالقوة والثروة يُهلك", "نعمة المطر واستغفار الله"],
    quranRef: "هود: ٥٠-٦٠، الأحقاف: ٢١-٢٦",
  },
  {
    id: 5, name: "صالح", nameAlt: undefined, era: "بعد هود",
    quranic: true, mentioned: 9, people: "ثمود (الحِجر)",
    miracle: "ناقة الله — خرجت من صخرة صمّاء",
    story: "أرسله الله إلى ثمود في الحِجر. أخرج الله له الناقة من الصخرة آية، لكنهم عقروها فأهلكهم الله بالصيحة بعد ثلاثة أيام.",
    lessons: ["احترام آيات الله ومحارمه", "العاقبة للمتقين"],
    quranRef: "الأعراف: ٧٣-٧٩، هود: ٦١-٦٨",
  },
  {
    id: 6, name: "إبراهيم", nameAlt: "خليل الله، أبو الأنبياء", era: "٢١٠٠ ق.م تقريباً",
    quranic: true, mentioned: 69, people: "أهل بابل والشام ومصر",
    miracle: "لم تحرقه نار نمرود — ﴿كُونِي بَرْدًا وَسَلَامًا﴾",
    book: "الصحف",
    story: "أبو الأنبياء وخليل الرحمن. كسر أصنام قومه ثم أُلقي في النار فأنجاه الله. هاجر إلى الشام ومصر. ذبح ابنه إسماعيل امتثالاً ثم فداه الله. بنى الكعبة مع إسماعيل.",
    lessons: ["التوحيد الخالص منهج الأنبياء", "الاستسلام لأوامر الله", "بناء الأمة على التضحية"],
    quranRef: "البقرة: ١٢٤-١٣٢، الأنبياء: ٥١-٧١، الصافات: ٩٩-١١١",
  },
  {
    id: 7, name: "لوط", nameAlt: undefined, era: "معاصر لإبراهيم",
    quranic: true, mentioned: 27, people: "سدوم وقوم لوط",
    miracle: "نجاه الله وقلب الله المدينة على أهلها",
    story: "أُرسل إلى قوم يمارسون الفاحشة. جاءت الملائكة على هيئة شباب فأراد قومه الفاحشة بهم. أُنجي لوط وابنتاه وأُهلك الباقون بالحجارة.",
    lessons: ["خطورة الفاحشة والشذوذ", "امرأة لوط — الخيانة في الأسرة"],
    quranRef: "هود: ٧٧-٨٣، الحجر: ٥٨-٧٧",
  },
  {
    id: 8, name: "إسماعيل", nameAlt: "الذبيح", era: "ابن إبراهيم",
    quranic: true, mentioned: 12, people: "العرب",
    miracle: "الذبح العظيم — فداه الله بكبش",
    story: "تُرك رضيعاً في مكة مع أمه هاجر. نبع زمزم لأمه. شبَّ وبنى مع أبيه الكعبة. كان الذبيح الصابر. أجداد العرب وأسلاف النبي ﷺ.",
    lessons: ["الطاعة والتسليم لأمر الله", "فضل الصبر والامتثال"],
    quranRef: "الصافات: ١٠١-١١١، إبراهيم: ٣٧",
  },
  {
    id: 9, name: "إسحاق", nameAlt: undefined, era: "ابن إبراهيم",
    quranic: true, mentioned: 17, people: "الشام",
    story: "البشارة التي فاجأت إبراهيم وسارة العجوز. ولد إسحاق وباركه الله. أبو يعقوب والأسباط.",
    lessons: ["فرج الله يأتي في أحلك الأوقات", "بركة النسل الصالح"],
    quranRef: "هود: ٧١، الصافات: ١١٢-١١٣",
  },
  {
    id: 10, name: "يعقوب", nameAlt: "إسرائيل", era: "ابن إسحاق",
    quranic: true, mentioned: 16, people: "الشام",
    story: "أبو الأسباط الاثني عشر. ابتُلي بفقد يوسف سنين. بكى حتى ابيضَّت عيناه حزناً. ثم جمعه الله بيوسف في مصر.",
    lessons: ["الصبر الجميل", "لا تيأس من روح الله"],
    quranRef: "يوسف: ٤-٨٣",
  },
  {
    id: 11, name: "يوسف", nameAlt: "الصدّيق", era: "ابن يعقوب",
    quranic: true, mentioned: 27, people: "مصر",
    miracle: "أُوتي تأويل الأحاديث وحسن الخُلق",
    story: "أحسن القصص. ألقاه إخوته في البئر غيرةً. بيع عبداً في مصر. راودته امرأة العزيز فاستعصم. سُجن سبع سنين. أوّل رؤيا الملك فأُعتق وولِّي خزائن مصر.",
    lessons: ["العفة والاستعصام من أعظم الفضائل", "ثمرة الصبر", "غيرة الإخوة ودواؤها العفو"],
    quranRef: "سورة يوسف كاملة",
  },
  {
    id: 12, name: "أيوب", nameAlt: "الصابر", era: "غير معلومة بدقة",
    quranic: true, mentioned: 4, people: "أرض حوران أو العراق",
    miracle: "شُفي بعد ١٨ سنة من البلاء الشديد",
    story: "ابتُلي بفقد المال والولد وبلاء في جسده. ظل يصبر ويحمد الله. دعا ربه: ﴿مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ﴾ فكشف الله ضره وأعطاه مثل ما كان له.",
    lessons: ["الصبر على البلاء ومدحه في القرآن", "الدعاء في الشدة"],
    quranRef: "الأنبياء: ٨٣-٨٤، ص: ٤١-٤٤",
  },
  {
    id: 13, name: "شعيب", nameAlt: "خطيب الأنبياء", era: "غير معلوم",
    quranic: true, mentioned: 9, people: "مدين",
    story: "أُرسل إلى أهل مدين الذين طفَّفوا الكيل والميزان. دعاهم للتوحيد والعدل في المعاملات. كذَّبوه فأهلكهم الله بالظلة.",
    lessons: ["العدل في المعاملات فريضة", "تحريم الغش والتطفيف"],
    quranRef: "الأعراف: ٨٥-٩٣، هود: ٨٤-٩٥",
  },
  {
    id: 14, name: "موسى", nameAlt: "كليم الله", era: "١٣٠٠ ق.م تقريباً",
    quranic: true, mentioned: 136, people: "بني إسرائيل ومصر",
    miracle: "العصا، يده البيضاء، انفلاق البحر، التوراة",
    book: "التوراة",
    story: "أكثر الأنبياء ذكراً في القرآن. نشأ في بيت فرعون. كلَّمه الله في الطور. أُرسل إلى فرعون بآيات بيّنة. انفلق البحر لبني إسرائيل. تاه قومه في التيه أربعين سنة.",
    lessons: ["التوحيد في مواجهة الطاغوت", "الثبات في الدعوة", "تعامل الله مع المستضعفين"],
    quranRef: "القصص: ٣-٤٠، طه: ٩-٩٨، البقرة: ٥١-٦١",
  },
  {
    id: 15, name: "هارون", nameAlt: undefined, era: "أخو موسى",
    quranic: true, mentioned: 20, people: "بني إسرائيل",
    story: "أخو موسى وعونه في الدعوة. استخلفه موسى حين ذهب للطور. لم يستطع منع قومه من عبادة العجل.",
    lessons: ["أهمية العون والمساندة في الدعوة"],
    quranRef: "طه: ٢٩-٣٦، الأعراف: ١٤٢",
  },
  {
    id: 16, name: "داود", nameAlt: undefined, era: "١٠٠٠ ق.م تقريباً",
    quranic: true, mentioned: 16, people: "بني إسرائيل",
    miracle: "أُلين له الحديد، سبَّح معه الجبال والطير",
    book: "الزبور",
    story: "ملك نبي. قتل جالوت وهو فتى. ملَّكه الله وآتاه الزبور. كان يصوم يوماً ويفطر يوماً ويقوم نصف الليل.",
    lessons: ["الجمع بين الملك والنبوة والعبادة", "أحكم الله بالحق"],
    quranRef: "البقرة: ٢٥١، سبأ: ١٠-١١، ص: ١٧-٢٦",
  },
  {
    id: 17, name: "سليمان", nameAlt: "ملك الأنبياء", era: "٩٧٠ ق.م تقريباً",
    quranic: true, mentioned: 17, people: "بني إسرائيل والجن",
    miracle: "تسخير الريح والجن وفهم لغة الطير والحيوان",
    story: "أُوتي ملكاً لم يؤت أحد قبله ولا بعده. سخَّر الله له الجن والريح والطير. محاورته الهدهد وقصة بلقيس ملكة سبأ.",
    lessons: ["الشكر على النعمة العظيمة", "الحكمة في القيادة"],
    quranRef: "النمل: ١٥-٤٤، سبأ: ١٢-١٤، الأنبياء: ٧٨-٨٢",
  },
  {
    id: 18, name: "يونس", nameAlt: "ذو النون", era: "٨ق.م تقريباً",
    quranic: true, mentioned: 4, people: "نينوى (العراق)",
    miracle: "بقاؤه حياً في بطن الحوت",
    story: "غضب من قومه وغادرهم دون إذن الله فابتلع الحوت سفينته. دعا في الظلمات: ﴿لَا إِلَهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ﴾ فأنجاه الله وآمن قومه.",
    lessons: ["الدعاء في الشدة", "لا يُغادَر موقع المسؤولية دون أمر"],
    quranRef: "يونس: ٩٨، الأنبياء: ٨٧-٨٨، الصافات: ١٣٩-١٤٨",
  },
  {
    id: 19, name: "إلياس", nameAlt: "إلياسين", era: "٩ق.م",
    quranic: true, mentioned: 2, people: "بعلبك في الشام",
    story: "أُرسل إلى قوم يعبدون البعل. دعاهم للتوحيد فكذَّبوه. أُنجي ورُفع.",
    lessons: ["دعوة التوحيد في كل جيل"],
    quranRef: "الصافات: ١٢٣-١٣٢، الأنعام: ٨٥",
  },
  {
    id: 20, name: "اليسع", nameAlt: undefined, era: "بعد إلياس",
    quranic: true, mentioned: 2, people: "بني إسرائيل",
    story: "خليفة إلياس. ذكره الله في القرآن بالخيرية.",
    lessons: ["المداومة على الخير"],
    quranRef: "الأنعام: ٨٦، ص: ٤٨",
  },
  {
    id: 21, name: "ذو الكفل", nameAlt: undefined, era: "غير محدد",
    quranic: true, mentioned: 2, people: "غير معلوم",
    story: "ذكره الله مع الصابرين. قيل إنه كفل بأمر نبي قبله في قضاء حوائج الناس والصبر على الأذى.",
    lessons: ["الوفاء بالعهد والصبر"],
    quranRef: "الأنبياء: ٨٥، ص: ٤٨",
  },
  {
    id: 22, name: "زكريا", nameAlt: undefined, era: "قبيل عيسى",
    quranic: true, mentioned: 7, people: "بني إسرائيل",
    miracle: "وُهب له يحيى وهو شيخ وامرأته عاقر",
    story: "كان يكفل مريم في المحراب. دعا ربه في السر أن يهب له ولداً يرثه. بشَّره الله بيحيى على الكِبَر.",
    lessons: ["الدعاء في السر", "لا ييأس من الله كبار السن"],
    quranRef: "آل عمران: ٣٧-٤١، مريم: ١-١١",
  },
  {
    id: 23, name: "يحيى", nameAlt: "يوحنا المعمدان", era: "معاصر لعيسى",
    quranic: true, mentioned: 2, people: "بني إسرائيل",
    story: "أُوتي الحكم صبياً. كان حصوراً تقياً برّاً بوالديه. استُشهد بيد جبار من الجبابرة.",
    lessons: ["الحلم والبِرّ في الصغر", "الشهادة في سبيل الحق"],
    quranRef: "مريم: ١٢-١٥، آل عمران: ٣٩",
  },
  {
    id: 24, name: "عيسى", nameAlt: "روح الله، المسيح", era: "٤ق.م — ٣٠م تقريباً",
    quranic: true, mentioned: 25, people: "بني إسرائيل",
    miracle: "إبراء الأكمه والأبرص وإحياء الموتى، الكلام في المهد",
    book: "الإنجيل",
    story: "وُلد بغير أب من مريم العذراء البتول. تكلَّم في المهد. أُوتي الإنجيل. دعا بني إسرائيل. رُفع إلى السماء ولم يُصلَب. ينزل آخر الزمان.",
    lessons: ["القرآن ينفي الألوهية عن عيسى", "مريم أفضل نساء العالمين", "عيسى عبد الله ورسوله"],
    quranRef: "آل عمران: ٤٥-٥٩، مريم: ١٦-٣٤، النساء: ١٥٧",
  },
  {
    id: 25, name: "محمد", nameAlt: "أحمد، خاتم الأنبياء", era: "٥٧١م — ٦٣٢م",
    quranic: true, mentioned: 4,
    people: "جميع البشرية إلى يوم القيامة",
    miracle: "القرآن الكريم — معجزة دائمة لا تنقطع",
    book: "القرآن الكريم",
    story: "خاتم الأنبياء والمرسلين. ولد في مكة يتيماً. بُعث في الأربعين بالقرآن. هاجر إلى المدينة وأسَّس الدولة الإسلامية. فتح مكة سنة ٨هـ. وُدِّع الناس في حجة الوداع.",
    lessons: ["خاتمية النبوة", "شمولية الإسلام لكل زمان ومكان", "الأسوة الحسنة في كل شأن"],
    quranRef: "الأحزاب: ٤٠، الأنبياء: ١٠٧",
  },
];

const ULUL_AZM = ANBIYA.filter(n =>
  ["نوح", "إبراهيم", "موسى", "عيسى", "محمد"].includes(n.name)
);

interface Miracle {
  nabi: string;
  miracle: string;
  ayah: string;
}
const MIRACLES_LIST: Miracle[] = [
  { nabi: "محمد ﷺ", miracle: "القرآن الكريم — المعجزة الخالدة", ayah: "البقرة: ٢٣" },
  { nabi: "موسى ﷺ", miracle: "انفلاق البحر الأحمر", ayah: "الشعراء: ٦٣" },
  { nabi: "عيسى ﷺ", miracle: "إحياء الموتى بإذن الله", ayah: "آل عمران: ٤٩" },
  { nabi: "إبراهيم ﷺ", miracle: "النار لم تحرقه", ayah: "الأنبياء: ٦٩" },
  { nabi: "صالح ﷺ", miracle: "الناقة من الصخرة", ayah: "الأعراف: ٧٣" },
  { nabi: "سليمان ﷺ", miracle: "تسخير الجن والريح", ayah: "الأنبياء: ٨١" },
  { nabi: "يونس ﷺ", miracle: "الحياة في بطن الحوت", ayah: "الأنبياء: ٨٧" },
  { nabi: "داود ﷺ", miracle: "تليين الحديد بيديه", ayah: "سبأ: ١٠" },
  { nabi: "زكريا ﷺ", miracle: "الولد من زوجة عاقر", ayah: "مريم: ٨" },
  { nabi: "يعقوب ﷺ", miracle: "عودة بصره من قميص يوسف", ayah: "يوسف: ٩٦" },
];

export default function AnbiyaPage() {
  const [activeTab, setActiveTab] = useState<NabiTab>("list");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/anbiya",
      title: "قصص الأنبياء والرسل | المجلس العلمي",
      description: "قصص ٢٥ نبياً ورسولاً مذكورين في القرآن الكريم — سيرة كل نبي، معجزته، قومه، والدروس المستفادة.",
      keywords: ["قصص الأنبياء", "الأنبياء في القرآن", "معجزات الأنبياء", "أولو العزم"],
    });
  }, []);

  const filteredAnbiya = useMemo(() => {
    if (!search.trim()) return ANBIYA;
    const q = search.toLowerCase();
    return ANBIYA.filter(n =>
      n.name.includes(q) || (n.nameAlt ?? "").includes(q) ||
      n.people.includes(q) || (n.miracle ?? "").includes(q)
    );
  }, [search]);

  return (
    <div className="nb-page" dir="rtl">
      {/* Hero */}
      <section className="nb-hero">
        <div className="nb-hero__inner">
          <div className="nb-hero__badge">أحسن القصص</div>
          <h1 className="nb-hero__title">الأنبياء والرسل</h1>
          <p className="nb-hero__sub">
            ٢٥ نبياً مذكوراً في القرآن الكريم — سِيَرهم ومعجزاتهم وأقوامهم والدروس المستفادة
          </p>
          <div className="nb-hero__stats">
            <span>٢٥ نبياً</span>
            <span>·</span>
            <span>٥ أولو العزم</span>
            <span>·</span>
            <span>١٢٤٫٠٠٠ نبي (حديث)</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="nb-tabs">
        {([
          { id: "list", label: "قائمة الأنبياء" },
          { id: "ulul-azm", label: "أولو العزم" },
          { id: "miracles", label: "المعجزات" },
          { id: "compare", label: "مقارنة سريعة" },
        ] as { id: NabiTab; label: string }[]).map(t => (
          <button
            key={t.id}
            type="button"
            className={`nb-tab${activeTab === t.id ? " nb-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
            aria-pressed={activeTab === t.id}
          >{t.label}</button>
        ))}
      </div>

      <div className="nb-container">
        {/* القائمة الرئيسية */}
        {activeTab === "list" && (
          <div>
            {/* Search */}
            <div className="nb-search">
              <Search size={15} aria-hidden="true" />
              <input
                className="nb-search__input"
                placeholder="ابحث عن نبي…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="nb-search__clear" aria-label="مسح">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="nb-list">
              {filteredAnbiya.map(nabi => (
                <div key={nabi.id} className={`nb-card${openId === nabi.id ? " nb-card--open" : ""}`}>
                  <div
                    className="nb-card__head"
                    onClick={() => setOpenId(openId === nabi.id ? null : nabi.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenId(openId === nabi.id ? null : nabi.id)}
                    aria-expanded={openId === nabi.id}
                  >
                    <div className="nb-card__num">{nabi.id}</div>
                    <div className="nb-card__info">
                      <div className="nb-card__name">
                        {nabi.name}
                        {nabi.nameAlt && <span className="nb-card__alt"> — {nabi.nameAlt}</span>}
                        {["نوح","إبراهيم","موسى","عيسى","محمد"].includes(nabi.name) && (
                          <span className="nb-badge nb-badge--azm">أولو العزم</span>
                        )}
                      </div>
                      <div className="nb-card__meta">
                        <span>{nabi.people}</span>
                        <span>·</span>
                        <span>ذُكر {nabi.mentioned} مرة</span>
                        {nabi.era && <><span>·</span><span>{nabi.era}</span></>}
                      </div>
                    </div>
                    <span className="nb-card__chevron" aria-hidden="true">
                      {openId === nabi.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>

                  {openId === nabi.id && (
                    <div className="nb-card__body">
                      <p className="nb-card__story">{nabi.story}</p>
                      {nabi.miracle && (
                        <div className="nb-card__miracle">
                          <span className="nb-mini-label">المعجزة</span>
                          <p>{nabi.miracle}</p>
                        </div>
                      )}
                      {nabi.book && (
                        <div className="nb-card__book">
                          <span className="nb-mini-label">الكتاب</span>
                          <p>{nabi.book}</p>
                        </div>
                      )}
                      {nabi.quranRef && (
                        <div className="nb-card__ref">
                          <span className="nb-mini-label">مواضع في القرآن</span>
                          <p>{nabi.quranRef}</p>
                        </div>
                      )}
                      <div className="nb-card__lessons">
                        <span className="nb-mini-label">دروس وعِبَر</span>
                        <ul>
                          {nabi.lessons.map((l, i) => <li key={i}>{l}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أولو العزم */}
        {activeTab === "ulul-azm" && (
          <div>
            <div className="nb-intro-box">
              <p>أولو العزم من الرسل أصحاب الشريعة والكتاب المستقل. ذكرهم الله في قوله: ﴿فَاصْبِرْ كَمَا صَبَرَ أُولُو الْعَزْمِ مِنَ الرُّسُلِ﴾ (الأحقاف: ٣٥).</p>
            </div>
            <div className="nb-azm-grid">
              {ULUL_AZM.map((nabi, i) => (
                <div key={nabi.id} className="nb-azm-card">
                  <div className="nb-azm-rank">{i + 1}</div>
                  <h3 className="nb-azm-name">{nabi.name} ﷺ</h3>
                  <div className="nb-azm-book">{nabi.book ? `كتابه: ${nabi.book}` : "لا كتاب مستقل"}</div>
                  <p className="nb-azm-story">{nabi.story.slice(0, 140)}…</p>
                  <div className="nb-azm-miracle">
                    <strong>معجزته:</strong> {nabi.miracle}
                  </div>
                  <div className="nb-azm-mentions">ذُكر في القرآن {nabi.mentioned} مرة</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* المعجزات */}
        {activeTab === "miracles" && (
          <div>
            <div className="nb-intro-box">
              <p>المعجزة: أمر خارق للعادة يُجريه الله على يد النبي تحدياً للمكذِّبين وتأييداً للداعية. وأعظم المعجزات وأخلدها القرآن الكريم.</p>
            </div>
            <div className="nb-miracles-grid">
              {MIRACLES_LIST.map((m, i) => (
                <div key={i} className="nb-miracle-card">
                  <div className="nb-miracle-nabi">{m.nabi}</div>
                  <p className="nb-miracle-text">{m.miracle}</p>
                  <div className="nb-miracle-ref">{m.ayah}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* مقارنة سريعة */}
        {activeTab === "compare" && (
          <div className="nb-compare-wrap">
            <div className="nb-intro-box">
              <p>جدول مقارنة بين أنبياء القرآن من حيث الذكر والقوم والكتاب.</p>
            </div>
            <div className="nb-table-scroll">
              <table className="nb-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>القوم</th>
                    <th>عدد الذِّكر</th>
                    <th>الكتاب</th>
                    <th>الحقبة</th>
                  </tr>
                </thead>
                <tbody>
                  {ANBIYA.map(n => (
                    <tr key={n.id}>
                      <td>{n.id}</td>
                      <td className="nb-table__name">
                        {n.name}
                        {["نوح","إبراهيم","موسى","عيسى","محمد"].includes(n.name) && <span className="nb-table__azm"> ★</span>}
                      </td>
                      <td>{n.people}</td>
                      <td className="nb-table__count">{n.mentioned}</td>
                      <td>{n.book ?? "—"}</td>
                      <td>{n.era}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="nb-table-note">★ = من أولي العزم</p>
          </div>
        )}
      </div>
    </div>
  );
}
