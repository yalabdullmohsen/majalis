import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionIcon } from "@/components/ui/SectionIcon";


/* ────── types ────── */
type HajjTab = "overview" | "arkan" | "wajibat" | "mashaer" | "umra";

interface RuknHajj {
  id: string;
  num: string;
  icon: string;
  title: string;
  subtitle: string;
  dalil: string;
  dalilRef: string;
  details: string[];
}

interface WajibHajj {
  id: string;
  icon: string;
  title: string;
  description: string;
  penalty: string;
}

interface Mashar {
  id: string;
  name: string;
  icon: string;
  day: string;
  desc: string;
  dua?: string;
}

interface UmraStep {
  num: number;
  icon: string;
  title: string;
  desc: string;
}

/* ────── data ────── */
const ARKAN: RuknHajj[] = [
  {
    id: "ihram",
    num: "١",
    icon: "🕋",
    title: "الإحرام",
    subtitle: "النية للدخول في النسك",
    dalil: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    dalilRef: "متفق عليه",
    details: [
      "يُحرم من المواقيت المكانية المحددة شرعاً",
      "يُستحب الاغتسال والتطيب قبل الإحرام",
      "للرجل: لبس الإزار والرداء غير المخيطَين",
      "للمرأة: تلبس ما شاءت ما عدا القفاز والنقاب على الوجه",
      "التلبية: لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ...",
      "تكفي نية الإحرام في القلب، والتلفظ بها سنة على الراجح",
      "لا يجوز بعد الإحرام الجماع ولا مقدماته ولا الصيد ولا حلق الشعر",
    ],
  },
  {
    id: "wuquf",
    num: "٢",
    icon: "⛰️",
    title: "الوقوف بعرفة",
    subtitle: "ركن الحج الأعظم",
    dalil: "الحَجُّ عَرَفَةُ، مَنْ جَاءَ لَيْلَةَ جَمْعٍ قَبْلَ طُلُوعِ الفَجْرِ فَقَدْ أَدْرَكَ الحَجَّ",
    dalilRef: "سنن الترمذي، صحيح",
    details: [
      "وقته: من زوال الشمس يوم التاسع حتى فجر العاشر",
      "أفضله الوقوف إلى غروب الشمس ثم الإفاضة",
      "يستحب الإكثار من الدعاء والذكر والتلبية",
      "أفضل دعاء عرفة: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
      "من أدرك عرفة ولو لحظة قبل فجر العاشر صح حجّه",
      "يصح الوقوف في السيارة للمريض وصاحب العذر مادام داخل حدود عرفات",
    ],
  },
  {
    id: "tawaf",
    num: "٣",
    icon: "🌀",
    title: "طواف الإفاضة",
    subtitle: "طواف الزيارة، ركن لا يصح الحج بدونه",
    dalil: "وَلْيَطَّوَّفُوا بِالْبَيْتِ الْعَتِيقِ",
    dalilRef: "الحج: 29",
    details: [
      "يؤدَّى بعد الوقوف بعرفة ورمي جمرة العقبة",
      "سبعة أشواط حول الكعبة يبدأ من الحجر الأسود",
      "يشترط الطهارة من الحدثين الأكبر والأصغر",
      "يستحب الاضطباع والرمل للرجال في الأشواط الثلاثة الأولى",
      "يُستحب الدعاء بين الركن اليماني والحجر الأسود: ﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً...﴾",
      "لا يصح الطواف مع الحدث الأكبر (الجنابة)، ومن أحدث أثناءه ابتدأ من حيث انقطع على الراجح",
    ],
  },
  {
    id: "say",
    num: "٤",
    icon: "🏃",
    title: "السعي",
    subtitle: "بين الصفا والمروة",
    dalil: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ",
    dalilRef: "البقرة: 158",
    details: [
      "سبعة أشواط بين الصفا والمروة",
      "يبدأ من الصفا وينتهي بالمروة",
      "يُستحب الإسراع في الوادي بين العلمين الأخضرين للرجال",
      "يشترط أن يكون بعد طواف صحيح",
      "يصح السعي في جميع طوابق المسعى (الأرضي والعلوي)",
      "لا يشترط الطهارة للسعي وإن كانت مستحبة",
    ],
  },
];

const WAJIBAT: WajibHajj[] = [
  {
    id: "miqat",
    icon: "📍",
    title: "الإحرام من الميقات",
    description: "الإحرام من أحد المواقيت المكانية المحددة، ومن جاوزها بلا إحرام وجب عليه الدم.",
    penalty: "دم (ذبح شاة)",
  },
  {
    id: "muzdalifa",
    icon: "🌙",
    title: "المبيت بمزدلفة",
    description: "المبيت بمزدلفة ليلة العاشر، والوقوف بها حتى بعد منتصف الليل على الأقل.",
    penalty: "دم",
  },
  {
    id: "rami",
    icon: "🪨",
    title: "رمي الجمرات",
    description: "رمي جمرة العقبة يوم العيد، ورمي الجمرات الثلاث في أيام التشريق.",
    penalty: "دم عن كل جمرة أهمل رميها",
  },
  {
    id: "halq",
    icon: "✂️",
    title: "الحلق أو التقصير",
    description: "حلق الرأس أو تقصيره بعد رمي جمرة العقبة، والحلق أفضل للرجال.",
    penalty: "دم",
  },
  {
    id: "mabeet-mina",
    icon: "⛺",
    title: "المبيت بمنى",
    description: "المبيت بمنى ليالي أيام التشريق (11، 12، وللمتعجل، 13 للمتأخر).",
    penalty: "دم",
  },
  {
    id: "tawaf-wada",
    icon: "👋",
    title: "طواف الوداع",
    description: "آخر عمل يفعله الحاج قبل مغادرة مكة، ويُعفى عنه الحائض والنفساء.",
    penalty: "دم",
  },
  {
    id: "tartib-rami",
    icon: "📋",
    title: "الترتيب في رمي الجمرات",
    description: "يجب في أيام التشريق البداءة بالجمرة الصغرى ثم الوسطى ثم الكبرى، ولا يجوز عكس الترتيب.",
    penalty: "يُعيد الرمي إن عكس، وإن لم يُعد فعليه دم عند الجمهور",
  },
  {
    id: "hadi-tamattua",
    icon: "🐑",
    title: "ذبح هدي التمتع والقِران",
    description: "يجب على المتمتع والقارن ذبح هدي: شاة، أو سُبع بدنة أو بقرة. يُذبح في أيام النحر (10-13) ويوزَّع على فقراء الحرم. من عجز صام ثلاثة أيام في الحج وسبعة إذا رجع لأهله.",
    penalty: "صيام ثلاثة أيام في الحج وسبعة بعد الرجوع إن لم يجد الهدي",
  },
  {
    id: "rami-baad-zawaal",
    icon: "⏰",
    title: "رمي الجمرات بعد الزوال",
    description: "يجب أن يكون رمي الجمرات في أيام التشريق (11، 12، 13) بعد زوال الشمس ولا يجوز قبله. أما جمرة العقبة يوم النحر فيجوز رميها من منتصف الليل.",
    penalty: "دم إن رمى قبل الزوال ولم يُعِد الرمي",
  },
  {
    id: "ifada-baad-maghrib",
    icon: "🌅",
    title: "الإفاضة من عرفة بعد الغروب",
    description: "يجب على الحاج ألا يُفيض من عرفة إلا بعد غروب الشمس يوم التاسع؛ فمن انصرف قبل الغروب ولم يعد إلى عرفة قبل طلوع فجر العاشر وجب عليه دم عند جمهور العلماء.",
    penalty: "دم (شاة) إن أفاض قبل الغروب ولم يعد إلى عرفة قبل الفجر",
  },
  {
    id: "salat-muzdalifa",
    icon: "🌙",
    title: "الجمع بين المغرب والعشاء بمزدلفة",
    description: "يجب أداء صلاتَي المغرب والعشاء جمعاً تأخيراً بمزدلفة؛ ولا يُصلَّيان قبل الوصول إليها إلا لمن يخشى خروج الوقت. جمهور الفقهاء على أنه واجب.",
    penalty: "إثم وعليه دم عند بعض الفقهاء إن تعمّد تركه",
  },
];

const MASHAER: Mashar[] = [
  {
    id: "miqaat",
    name: "المواقيت",
    icon: "📍",
    day: "قبل الإحرام",
    desc: "المواقيت المكانية هي الحدود التي يُحرم منها الحاج والمعتمر. للمدينة: ذو الحليفة. للشام: الجحفة. لليمن: يلملم. لنجد: قرن المنازل. للمشرق: ذات عِرق.",
  },
  {
    id: "mina",
    name: "منى",
    icon: "⛺",
    day: "8، 12 ذو الحجة",
    desc: "وادٍ قريب من مكة يمكث فيه الحجاج ليلة الثامن ويرمون فيه الجمرات في أيام التشريق.",
    dua: "اللهم هذه منى وأنا عبدك جئت أبتغي مرضاتك",
  },
  {
    id: "arafa",
    name: "عرفات",
    icon: "⛰️",
    day: "9 ذو الحجة",
    desc: "الوقوف بعرفة ركن الحج الأعظم. تقع على بعد 20 كم من مكة. يمتد وقت الوقوف من زوال الشمس يوم 9 إلى فجر 10.",
    dua: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير",
  },
  {
    id: "muzdalifa",
    name: "مزدلفة",
    icon: "🌙",
    day: "ليلة 10 ذو الحجة",
    desc: "منطقة بين عرفات ومنى. يُبيت بها الحاج ويُصلي المغرب والعشاء جمعاً وقصراً ويجمع حصى الجمرات.",
    dua: "اللهم إنك قلت ادعوني أستجب لكم، اللهم إني أدعوك فاستجب",
  },
  {
    id: "kaaba",
    name: "الكعبة المشرفة",
    icon: "🕋",
    day: "طوال الحج",
    desc: "بيت الله الحرام في مكة، تتجه إليه القلوب في الصلاة، ويطاف بها في مناسك الحج والعمرة.",
    dua: "اللهم أنت السلام ومنك السلام، حيّنا ربنا بالسلام",
  },
  {
    id: "jamarat",
    name: "الجمرات",
    icon: "🪨",
    day: "10، 11، 12، 13 ذو الحجة",
    desc: "ثلاث جمرات في منى تُرمى في أيام التشريق: الجمرة الصغرى، الوسطى، والكبرى (العقبة). يُبدأ بالصغرى في أيام التشريق.",
    dua: "بسم الله والله أكبر، مع كل حصاة",
  },
  {
    id: "safa-marwa",
    name: "الصفا والمروة",
    icon: "🏃",
    day: "أيام الحج والعمرة",
    desc: "جبلان صغيران داخل المسجد الحرام يُسعى بينهما سبعة أشواط في الحج والعمرة. ذكرهما الله في القرآن: ﴿إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ﴾ (البقرة: ١٥٨). يبدأ السعي من الصفا وينتهي عند المروة.",
    dua: "أبدأ بما بدأ الله به — اللهم لك الحمد وإليك المصير ولا حول ولا قوة إلا بالله",
  },
  {
    id: "masjid-haram",
    name: "المسجد الحرام",
    icon: "🕌",
    day: "طوال مدة الإقامة",
    desc: "أشرف المساجد وأعظمها، تُضاعف فيه الصلاة بمئة ألف صلاة. يحيط بالكعبة المشرفة ويضم الحجر الأسود ومقام إبراهيم وبئر زمزم والملتزم.",
    dua: "اللهم أنت السلام ومنك السلام، حيّنا ربنا بالسلام وأدخلنا دار السلام",
  },
  {
    id: "hajr-aswad",
    name: "الحجر الأسود",
    icon: "⚫",
    day: "في كل شوط من الطواف",
    desc: "حجر كريم نزل من الجنة أبيض فاسودَّ بذنوب بني آدم. يُستلَم أو يُقبَّل أو يُشار إليه عند بدء كل شوط في الطواف. قال ﷺ: «الحجر الأسود من الجنة» (الترمذي، صحيح). يقع في الركن الجنوبي الشرقي من الكعبة.",
    dua: "بسم الله والله أكبر — اللهم إيماناً بك وتصديقاً بكتابك ووفاءً بعهدك واتّباعاً لسنة نبيّك ﷺ",
  },
  {
    id: "maqam-ibrahim",
    name: "مقام إبراهيم",
    icon: "🪨",
    day: "بعد طواف الإفاضة وطواف العمرة",
    desc: "الحجر الذي وقف عليه إبراهيم عليه السلام حين بنى الكعبة وقد أثّر فيه قدمه الشريفة. يُصلّى خلفه ركعتان سنةً مؤكدة بعد كل طواف. ﴿وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى﴾ (البقرة: ١٢٥).",
    dua: "ربنا تقبّل منا إنك أنت السميع العليم — ربنا واجعلنا مسلمَين لك",
  },
  {
    id: "zamzam",
    name: "بئر زمزم",
    icon: "💧",
    day: "في أي وقت داخل المسجد الحرام",
    desc: "البئر المباركة التي فجَّرها الله لهاجر عليها السلام حين بحثت عن الماء لابنها إسماعيل. ماؤها شراب وطعام ودواء. قال ﷺ: «ماء زمزم لما شُرب له» (ابن ماجه، صحيح).",
    dua: "اللهم إني أسألك علماً نافعاً ورزقاً واسعاً وشفاءً من كل داء",
  },
  {
    id: "multazam",
    name: "الملتزَم",
    icon: "🤲",
    day: "بعد الطواف",
    desc: "المسافة بين الحجر الأسود وباب الكعبة المشرفة (نحو مترَين). يتعلق به الحاج داعياً ويلصق صدره وخده وذراعيه بجدار الكعبة. سُمِّي بالملتزم لأن الناس يلتزمون به ويتشبثون به دعاءً وتضرعاً.",
    dua: "اللهم لك الحمد حمداً يليق بجلالك وعظيم سلطانك — اللهم اغفر لي وارحمني وتب علي",
  },
  {
    id: "nour-hira",
    name: "جبل النور وغار حراء",
    icon: "⛰️",
    day: "يُزار تاريخياً (غير واجب)",
    desc: "جبل يقع شمال شرق مكة على بُعد نحو 4 كم. في غاره نزل أول الوحي على النبي ﷺ: ﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ﴾ (العلق: 1). وزيارته لا تُعدّ من مناسك الحج، غير أن كثيراً من الحجاج يتوجهون إليه تبرُّكاً بالذكريات.",
    dua: "لا إله إلا الله — سبحانك اللهم وبحمدك أشهد أن لا إله إلا أنت",
  },
];

const UMRA_STEPS: UmraStep[] = [
  { num: 1, icon: "🕌", title: "الإحرام من الميقات", desc: "الاغتسال ولبس ثياب الإحرام (للرجال) والنية من الميقات مع التلبية" },
  { num: 2, icon: "🌀", title: "الطواف", desc: "سبعة أشواط حول الكعبة تبدأ من الحجر الأسود مع الذكر والدعاء" },
  { num: 3, icon: "🙏", title: "صلاة ركعتين", desc: "ركعتان خلف مقام إبراهيم إن تيسّر، أو في أي مكان بالمسجد" },
  { num: 4, icon: "💧", title: "الشرب من زمزم", desc: "الشرب من ماء زمزم مع الدعاء (اللهم إني أسألك علماً نافعاً ورزقاً واسعاً وشفاءً من كل داء)" },
  { num: 5, icon: "🏃", title: "السعي", desc: "سبعة أشواط بين الصفا والمروة يبدأ من الصفا وينتهي بالمروة مع الدعاء" },
  { num: 6, icon: "✂️", title: "الحلق أو التقصير", desc: "حلق الرأس أو تقصيره للرجال، وتقصر المرأة بمقدار أنملة" },
];

const TALBIYA =
  "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ";

const TABS: { id: HajjTab; label: string; icon: string }[] = [
  { id: "overview", label: "نظرة عامة", icon: "📋" },
  { id: "arkan", label: "الأركان", icon: "🕋" },
  { id: "wajibat", label: "الواجبات", icon: "✅" },
  { id: "mashaer", label: "المشاعر", icon: "⛰️" },
  { id: "umra", label: "العمرة", icon: "🌙" },
];

/* ────── component ────── */
export default function HajjPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hajj",
      title: "الحج والعمرة، المجلس العلمي",
      description: "دليل شامل لأحكام الحج والعمرة: الأركان والواجبات والسنن والمشاعر والدعاء",
      keywords: ["الحج", "العمرة", "أركان الحج", "مناسك الحج", "أحكام الحج", "الإحرام"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أركان الحج",
          description: "أركان الحج وأحكامه وخطواته التفصيلية",
          numberOfItems: ARKAN.length,
          itemListElement: ARKAN.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: r.title,
            url: `https://majlisilm.com/hajj#${r.id}`,
          })),
        },
      ],
    });
  }, []);

  const todayRukn = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return ARKAN[(day - 1 + ARKAN.length) % ARKAN.length];
  }, []);
  const [tab, setTab] = useState<HajjTab>("overview");
  const [openRukn, setOpenRukn] = useState<string | null>("ihram");
  const [search, setSearch] = useState("");

  const filteredArkan = useMemo(() =>
    search.trim() ? ARKAN.filter(r => arabicMatchAny([r.title, r.subtitle, r.dalil], search)) : ARKAN,
  [search]);
  const filteredWajibat = useMemo(() =>
    search.trim() ? WAJIBAT.filter(w => arabicMatchAny([w.title, w.description, w.penalty], search)) : WAJIBAT,
  [search]);
  const filteredMashaer = useMemo(() =>
    search.trim() ? MASHAER.filter(m => arabicMatchAny([m.name, m.desc, m.dua ?? ""], search)) : MASHAER,
  [search]);
  const filteredUmraSteps = useMemo(() =>
    search.trim() ? UMRA_STEPS.filter(s => arabicMatchAny([s.title, s.desc], search)) : UMRA_STEPS,
  [search]);

  return (
    <main className="hj-page" dir="rtl">
      {/* hero */}
      <section className="hj-hero">
        <div className="hj-hero__badge">أركان الإسلام</div>
        <div className="hj-hero__kaaba">🕋</div>
        <h1 className="hj-hero__title">الحج والعمرة</h1>
        <p className="hj-hero__sub">
          الركن الخامس من أركان الإسلام، دليل شامل للمناسك والمشاعر والأحكام
        </p>

        {/* talbiya */}
        <div className="hj-talbiya">
          <span className="hj-talbiya__label">التلبية</span>
          <p className="hj-talbiya__text">{TALBIYA}</p>
        </div>

        {/* tabs */}
        <nav className="hj-tabs" aria-label="أقسام الحج">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`hj-tab${tab === t.id ? " hj-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
            >
              <span className="hj-tab__icon"><SectionIcon name={t.icon} size={24} /></span>
              <span className="hj-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </section>

      {/* ركن الحج اليوم */}
      <div className="hjod-card">
        <div className="hjod-card__badge"><Sparkles size={11} aria-hidden="true" /> ركن الحج اليوم</div>
        <span className="hjod-card__icon">{todayRukn.icon}</span>
        <div className="hjod-card__num">الركن {todayRukn.num}</div>
        <h2 className="hjod-card__title">{todayRukn.title}</h2>
        <p className="hjod-card__sub">{todayRukn.subtitle}</p>
        <p className="hjod-card__dalil">«{todayRukn.dalil}»<span className="hjod-card__ref"> — {todayRukn.dalilRef}</span></p>
      </div>

      {tab !== "overview" && (
        <div className="hj-search-wrap">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في مناسك الحج..." className="page-search-input hj-search-input"
            aria-label="بحث في أحكام الحج" />
        </div>
      )}

      <div className="hj-body">
        {/* ── نظرة عامة ── */}
        {tab === "overview" && (
          <section className="hj-section">
            <div className="hj-overview-grid">
              {[
                { icon: "☪️", label: "الفريضة", value: "مرة في العمر لمن استطاع" },
                { icon: "📅", label: "وقت الحج", value: "شوال، ذو القعدة، ذو الحجة" },
                { icon: "🕋", label: "الموسم", value: "8–12 ذو الحجة كل عام" },
                { icon: "📖", label: "الدليل", value: "وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ (آل عمران: 97)" },
              ].map((item) => (
                <div key={item.label} className="hj-stat-card">
                  <span className="hj-stat-card__icon"><SectionIcon name={item.icon} size={24} /></span>
                  <span className="hj-stat-card__label">{item.label}</span>
                  <span className="hj-stat-card__value">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="hj-hadith-box">
              <blockquote className="hj-hadith-box__text">
                بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ،
                وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ، وَصَوْمِ رَمَضَانَ، وَحَجِّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا
              </blockquote>
              <cite className="hj-hadith-box__ref">متفق عليه</cite>
            </div>

            <h2 className="hj-section__title">فضل الحج</h2>
            <div className="hj-fadl-grid">
              {[
                { icon: "🏆", text: "الحج المبرور ليس له جزاء إلا الجنة", ref: "متفق عليه" },
                { icon: "✨", text: "من حج فلم يرفث ولم يفسق رجع كيوم ولدته أمه", ref: "متفق عليه" },
                { icon: "💰", text: "تابعوا بين الحج والعمرة فإنهما ينفيان الفقر والذنوب", ref: "سنن الترمذي، صحيح" },
                { icon: "📿", text: "العمرة إلى العمرة كفارة لما بينهما", ref: "متفق عليه" },
                { icon: "🌍", text: "وفد الله ثلاثة: الحاج والمعتمر والغازي", ref: "النسائي، صحيح" },
                { icon: "🤲", text: "دعاء الحاج مستجاب، والحاج يشفع لسبعمئة من أهله", ref: "ابن ماجه، حسن" },
              ].map((f) => (
                <div key={f.text} className="hj-fadl-card">
                  <span className="hj-fadl-card__icon"><SectionIcon name={f.icon} size={24} /></span>
                  <p className="hj-fadl-card__text">{f.text}</p>
                  <cite className="hj-fadl-card__ref">{f.ref}</cite>
                </div>
              ))}
            </div>

            <h2 className="hj-section__title">أنواع الحج</h2>
            <div className="hj-types-grid">
              {[
                { name: "الإفراد", desc: "الإحرام بالحج وحده، ولا هدي واجب عليه، وهو أفضل أنواع الحج عند الشافعية وبعض العلماء" },
                { name: "القِران", desc: "الإحرام بالحج والعمرة معاً بنية واحدة، ويلزمه هدي التمتع، وهو أفضل عند الأحناف" },
                { name: "التمتع", desc: "الإحرام بالعمرة أولاً ثم يتحلل ثم يُحرم بالحج في أشهره، ويلزمه الهدي، وهو أفضل عند أحمد وكثير من المحدثين" },
              ].map((t) => (
                <div key={t.name} className="hj-type-card">
                  <strong className="hj-type-card__name">{t.name}</strong>
                  <p className="hj-type-card__desc">{t.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── الأركان ── */}
        {tab === "arkan" && (
          <section className="hj-section">
            <p className="hj-section__intro">
              أركان الحج هي ما لا يصح الحج بدونها ولا تجبر بالدم. من ترك ركناً لم يتم حجّه.
            </p>
            {filteredArkan.map((rk) => {
              const isOpen = openRukn === rk.id;
              return (
                <article key={rk.id} className={`hj-card${isOpen ? " hj-card--open" : ""}`}>
                  <button
                    type="button"
                    className="hj-card__head"
                    onClick={() => setOpenRukn(isOpen ? null : rk.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="hj-card__num">{rk.num}</span>
                    <span className="hj-card__icon"><SectionIcon name={rk.icon} size={24} /></span>
                    <div className="hj-card__info">
                      <span className="hj-card__title">{rk.title}</span>
                      <span className="hj-card__sub">{rk.subtitle}</span>
                    </div>
                    <span className="hj-card__badge">ركن</span>
                    <span className={`hj-card__chevron${isOpen ? " hj-card__chevron--open" : ""}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="hj-card__body">
                      <blockquote className="hj-dalil">
                        <p className="hj-dalil__text">{rk.dalil}</p>
                        <cite className="hj-dalil__ref">{rk.dalilRef}</cite>
                      </blockquote>
                      <ul className="hj-detail-list">
                        {rk.details.map((d, i) => (
                          <li key={i} className="hj-detail-item">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {/* ── الواجبات ── */}
        {tab === "wajibat" && (
          <section className="hj-section">
            <p className="hj-section__intro">
              واجبات الحج هي ما يلزم فعله، ومن تركه أثم ويجبره بدم (ذبح شاة)، لكن حجّه صحيح.
            </p>
            {filteredWajibat.map((w) => (
              <div key={w.id} className="hj-wajib-card">
                <span className="hj-wajib-card__icon"><SectionIcon name={w.icon} size={24} /></span>
                <div className="hj-wajib-card__content">
                  <strong className="hj-wajib-card__title">{w.title}</strong>
                  <p className="hj-wajib-card__desc">{w.description}</p>
                  <span className="hj-wajib-card__penalty">عقوبة تركه: {w.penalty}</span>
                </div>
              </div>
            ))}
            <div className="hj-info-box">
              <span className="hj-info-box__icon">💡</span>
              <p>الدم في الفقه يعني ذبح شاة وتوزيع لحمها على فقراء الحرم. لا يجوز أكلها للحاج وإن كان مضطراً.</p>
            </div>
          </section>
        )}

        {/* ── المشاعر ── */}
        {tab === "mashaer" && (
          <section className="hj-section">
            {filteredMashaer.map((m) => (
              <div key={m.id} className="hj-mashar-card">
                <div className="hj-mashar-card__head">
                  <span className="hj-mashar-card__icon"><SectionIcon name={m.icon} size={24} /></span>
                  <div>
                    <strong className="hj-mashar-card__name">{m.name}</strong>
                    <span className="hj-mashar-card__day">{m.day}</span>
                  </div>
                </div>
                <p className="hj-mashar-card__desc">{m.desc}</p>
                {m.dua && (
                  <div className="hj-mashar-dua">
                    <span className="hj-mashar-dua__label">دعاء مقترح</span>
                    <p className="hj-mashar-dua__text">{m.dua}</p>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── العمرة ── */}
        {tab === "umra" && (
          <section className="hj-section">
            <p className="hj-section__intro">
              العمرة سنة مؤكدة يمكن أداؤها في أي وقت من السنة ما عدا أيام الحج عند بعض العلماء.
              تتكون من أربعة خطوات أساسية.
            </p>

            <div className="hj-umra-steps">
              {filteredUmraSteps.map((s) => (
                <div key={s.num} className="hj-umra-step">
                  <div className="hj-umra-step__num">{s.num}</div>
                  <div className="hj-umra-step__icon"><SectionIcon name={s.icon} size={24} /></div>
                  <div className="hj-umra-step__content">
                    <strong className="hj-umra-step__title">{s.title}</strong>
                    <p className="hj-umra-step__desc">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hj-info-box hj-info-box--mt">
              <span className="hj-info-box__icon">📌</span>
              <p>
                <strong>العمرة في رمضان:</strong> «عمرة في رمضان تعدل حجة، أو حجة معي»
                (متفق عليه)، أجرها كأجر الحج لا أنها تُسقطه.
              </p>
            </div>

            <h2 className="hj-section__title hj-section__title--mt">محظورات الإحرام</h2>
            <div className="hj-mahzurat-grid">
              {[
                { icon: "✂️", text: "حلق الشعر أو قصّه" },
                { icon: "💅", text: "قص الأظافر" },
                { icon: "🌹", text: "التطيب بعد الإحرام" },
                { icon: "🧥", text: "لبس المخيط للرجال" },
                { icon: "💍", text: "لبس القفاز للمرأة" },
                { icon: "🦁", text: "الصيد البري" },
                { icon: "💑", text: "الجماع أو مقدماته" },
                { icon: "💒", text: "عقد النكاح" },
              ].map((item) => (
                <div key={item.text} className="hj-mahzur-item">
                  <span className="hj-mahzur-item__icon"><SectionIcon name={item.icon} size={24} /></span>
                  <span className="hj-mahzur-item__text">{item.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="twh-share">
          <ShareButtons title="الحج والعمرة — المجلس العلمي" url="https://majlisilm.com/hajj" />
        </div>

        {/* related */}
        <nav className="hj-related" aria-label="صفحات ذات صلة">
          <h2 className="hj-related__title">استكشف أيضاً</h2>
          <div className="hj-related__grid">
            {[
              { href: "/arkan", label: "أركان الإسلام" },
              { href: "/arkan-iman", label: "أركان الإيمان" },
              { href: "/zakat", label: "الزكاة وأحكامها" },
              { href: "/sawm", label: "الصيام وأحكامه" },
              { href: "/duas", label: "الأدعية الشرعية" },
              { href: "/prayer-times", label: "مواقيت الصلاة" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="hj-related__link">
                {r.label}
              </a>
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
