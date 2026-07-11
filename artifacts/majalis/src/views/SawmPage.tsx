import { useEffect, useState, useMemo } from "react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";


/* ───────── types ───────── */
type SawmTab = "types" | "conditions" | "muftirat" | "exemptions" | "virtues";

interface FastType {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  kind: "fard" | "wajib" | "nafl";
  description: string;
  dalil: string;
  dalilRef: string;
  notes?: string[];
}

interface Muftar {
  id: string;
  title: string;
  icon: string;
  type: "major" | "detail";
  description: string;
  dalil?: string;
}

interface Exemption {
  id: string;
  icon: string;
  title: string;
  ruling: string;
  details: string;
}

interface Virtue {
  id: string;
  icon: string;
  title: string;
  text: string;
  source: string;
}

/* ───────── data ───────── */
const FAST_TYPES: FastType[] = [
  {
    id: "ramadan",
    title: "صيام رمضان",
    subtitle: "فرض عين على كل مسلم",
    icon: "🌙",
    kind: "fard",
    description:
      "صيام شهر رمضان المبارك كاملاً، وهو ركن من أركان الإسلام الخمسة، فُرض في السنة الثانية من الهجرة النبوية.",
    dalil:
      "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ",
    dalilRef: "البقرة: 183",
    notes: [
      "يثبت دخوله برؤية الهلال أو إتمام شعبان ثلاثين يوماً",
      "يجب النية من الليل لصيام رمضان",
      "يبدأ من طلوع الفجر الصادق حتى غروب الشمس",
    ],
  },
  {
    id: "qada",
    title: "صيام القضاء",
    subtitle: "واجب على من أفطر بعذر",
    icon: "📅",
    kind: "wajib",
    description:
      "قضاء الأيام التي أفطرها المسلم من رمضان بعذر شرعي كمرض أو سفر أو حيض أو نفاس، ويجب قضاؤها قبل رمضان التالي.",
    dalil:
      "فَمَن كَانَ مِنكُم مَّرِيضًا أَوْ عَلَىٰ سَفَرٍ فَعِدَّةٌ مِّنْ أَيَّامٍ أُخَرَ",
    dalilRef: "البقرة: 184",
    notes: [
      "التأخير عن رمضان التالي بلا عذر يوجب الفدية مع القضاء عند الجمهور",
      "يجوز قضاؤها متفرقة أو متتابعة",
    ],
  },
  {
    id: "kafara",
    title: "صيام الكفارة",
    subtitle: "واجب لكفارة ذنب معين",
    icon: "⚖️",
    kind: "wajib",
    description:
      "صيام مقرر لكفارة ذنوب بعينها كالجماع في نهار رمضان، أو اليمين، أو الظهار، أو قتل الخطأ.",
    dalil: "فَمَن لَّمْ يَجِدْ فَصِيَامُ شَهْرَيْنِ مُتَتَابِعَيْنِ",
    dalilRef: "المجادلة: 4",
    notes: [
      "كفارة الجماع في رمضان: عتق رقبة، فإن لم يجد فصيام شهرين متتابعين",
      "كفارة اليمين: إطعام أو كسوة أو تحرير رقبة، فإن لم يجد فصيام ثلاثة أيام",
    ],
  },
  {
    id: "arafa",
    title: "صيام يوم عرفة",
    subtitle: "سنة مؤكدة لغير الحاج",
    icon: "⛰️",
    kind: "nafl",
    description:
      "صيام التاسع من ذي الحجة، وهو من أفضل صيام النوافل، يكفّر ذنوب سنتين.",
    dalil: "صِيَامُ يَوْمِ عَرَفَةَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ وَالسَّنَةَ الَّتِي بَعْدَهُ",
    dalilRef: "صحيح مسلم",
    notes: ["لا يُشرع للحاج صيامه لأنه يحتاج القوة لأداء مناسك الحج"],
  },
  {
    id: "ashura",
    title: "صيام عاشوراء",
    subtitle: "العاشر من محرم وتاسوعاء",
    icon: "🕌",
    kind: "nafl",
    description:
      "صيام العاشر من المحرم، ويُستحب إضافة التاسع إليه مخالفةً لليهود، يكفّر ذنوب السنة الماضية.",
    dalil: "صِيَامُ يَوْمِ عَاشُورَاءَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ",
    dalilRef: "صحيح مسلم",
    notes: ["يُسن صيام التاسع معه: «لئن بقيت إلى قابل لأصومن التاسع»"],
  },
  {
    id: "sitta-shawwal",
    title: "صيام ست من شوال",
    subtitle: "بعد رمضان مباشرة",
    icon: "✨",
    kind: "nafl",
    description:
      "صيام ستة أيام من شوال بعد عيد الفطر، ويكون أجره كصيام الدهر كله.",
    dalil: "مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ",
    dalilRef: "صحيح مسلم",
    notes: [
      "يجوز صيامها متتابعة أو متفرقة في أي أيام شوال",
      "من عليه قضاء يبدأ بالقضاء أولاً عند الجمهور",
    ],
  },
  {
    id: "bidh",
    title: "صيام الأيام البِيض",
    subtitle: "13 و14 و15 من كل شهر",
    icon: "🌕",
    kind: "nafl",
    description:
      "صيام الأيام البيض وهي الثالث عشر والرابع عشر والخامس عشر من كل شهر قمري.",
    dalil: "كَانَ رَسُولُ اللَّهِ ﷺ يَصُومُ مِنَ الشَّهْرِ ثَلَاثَةَ أَيَّامٍ: يَوْمَ الِاثْنَيْنِ وَالخَمِيسَيْنِ، وَأَوَّلَ خَمِيسٍ مِنَ الشَّهْرِ",
    dalilRef: "سنن أبي داود",
    notes: ["من صامها كأنما صام الدهر"],
  },
  {
    id: "ithnayn-khamees",
    title: "صيام الإثنين والخميس",
    subtitle: "أسبوعياً",
    icon: "📆",
    kind: "nafl",
    description:
      "صيام يومَي الإثنين والخميس من كل أسبوع، وهما يومان تُعرض فيهما الأعمال على الله.",
    dalil: "تُعْرَضُ الأَعْمَالُ يَوْمَ الِاثْنَيْنِ وَالخَمِيسِ، فَأُحِبُّ أَنْ يُعْرَضَ عَمَلِي وَأَنَا صَائِمٌ",
    dalilRef: "سنن الترمذي، حسن",
    notes: [],
  },
  {
    id: "dawood",
    title: "صيام داود",
    subtitle: "يوم ويوم لا — أفضل الصيام",
    icon: "⚖️",
    kind: "nafl",
    description:
      "صيام يوم وإفطار يوم، وهو أفضل الصيام عند الله وأحبه إليه، وكان صيام النبي داود عليه السلام.",
    dalil: "أَحَبُّ الصِّيَامِ إِلَى اللَّهِ صِيَامُ دَاوُدَ: كَانَ يَصُومُ يَوْمًا وَيُفْطِرُ يَوْمًا",
    dalilRef: "متفق عليه",
    notes: ["يحتاج استمراراً وعزيمة، وصاحبه لم يفرَّ إذا لاقى"],
  },
  {
    id: "muharram",
    title: "صيام المحرم",
    subtitle: "أفضل الصيام بعد رمضان",
    icon: "🌟",
    kind: "nafl",
    description:
      "صيام شهر المحرم من أفضل الصيام بعد رمضان، وأفضله العاشر منه (عاشوراء) ثم التاسع.",
    dalil: "أَفْضَلُ الصِّيَامِ بَعْدَ رَمَضَانَ شَهْرُ اللَّهِ الْمُحَرَّمُ",
    dalilRef: "صحيح مسلم",
    notes: ["الإكثار من الصيام في محرم يُعدّ من أبواب اغتنام الأشهر الحرم"],
  },
  {
    id: "dhul-hijja",
    title: "صيام التسع من ذي الحجة",
    subtitle: "أفضل أيام العمل الصالح",
    icon: "📅",
    kind: "nafl",
    description:
      "صيام الأيام التسعة الأولى من ذي الحجة من أفضل الأعمال الصالحة في أفضل أيام السنة. ويوم عرفة (التاسع) أعظمها وأجلّها فضلاً.",
    dalil: "مَا مِنْ أَيَّامٍ الْعَمَلُ الصَّالِحُ فِيهَا أَحَبُّ إِلَى اللَّهِ مِنْ هَذِهِ الأَيَّامِ الْعَشْرِ",
    dalilRef: "صحيح البخاري",
    notes: [
      "أفضلها يوم عرفة (التاسع) ويكفّر ذنوب سنتين",
      "يُسن صيام الأيام التسعة كلها اقتداءً بالنبي ﷺ",
    ],
  },
  {
    id: "shaban",
    title: "صيام شعبان",
    subtitle: "شهر رفع الأعمال",
    icon: "🌙",
    kind: "nafl",
    description:
      "شهر شعبان يغفل عنه كثير من الناس، وكان النبي ﷺ يصوم أكثره. وهو شهر تُرفع فيه الأعمال إلى الله تعالى.",
    dalil: "ذَلِكَ شَهْرٌ يَغْفُلُ النَّاسُ عَنْهُ بَيْنَ رَجَبٍ وَرَمَضَانَ، وَهُوَ شَهْرٌ تُرْفَعُ فِيهِ الأَعْمَالُ إِلَى رَبِّ الْعَالَمِينَ، فَأُحِبُّ أَنْ يُرْفَعَ عَمَلِي وَأَنَا صَائِمٌ",
    dalilRef: "سنن النسائي، صحيح",
    notes: [
      "يُكره إفراد النصف الأخير بالصيام لمن لم تكن له عادة",
      "من كان له عادة صيام مستمرة فلا كراهة في استمراره",
    ],
  },
  {
    id: "nazr",
    title: "صيام النذر",
    subtitle: "واجب لازم بحسب النذر",
    icon: "🔔",
    kind: "wajib",
    description:
      "من نذر صيام أيام بعينها وجب عليه الوفاء بنذره. النذر عقد بين العبد وربه يلتزم فيه بطاعة إضافية.",
    dalil: "يُوفُونَ بِالنَّذْرِ وَيَخَافُونَ يَوْمًا كَانَ شَرُّهُ مُسْتَطِيرًا",
    dalilRef: "الإنسان: 7",
    notes: [
      "لا يجوز نذر صيام يوم العيد أو أيام التشريق لأنها أيام أكل وشرب",
      "من نذر صيام يوم معين فصادف عيداً انتقل صيامه إلى اليوم الذي يليه",
    ],
  },
  {
    id: "ashhur-hurum",
    title: "صيام الأشهر الحرم",
    subtitle: "ذو القعدة وذو الحجة والمحرم ورجب",
    icon: "🕌",
    kind: "nafl",
    description:
      "يُستحب الإكثار من الصيام في الأشهر الحرم الأربعة لعظم حرمتها عند الله، والسيئات تُضاعَف فيها والحسنات كذلك.",
    dalil: "إِنَّ عِدَّةَ الشُّهُورِ عِندَ اللَّهِ اثْنَا عَشَرَ شَهْرًا ... مِنْهَا أَرْبَعَةٌ حُرُمٌ",
    dalilRef: "التوبة: 36",
    notes: [
      "أفضل الأشهر الحرم المحرم لقوله ﷺ: «أفضل الصيام بعد رمضان شهر الله المحرم»",
      "لم يثبت فضل مخصوص لرجب بحديث صحيح، لكن يُسن فيه الصيام كسائر الأشهر الحرم",
    ],
  },
];

const SAWM_CONDITIONS = [
  { icon: "☪️", title: "الإسلام", body: "لا يصح الصيام من الكافر" },
  { icon: "🧠", title: "العقل", body: "لا يجب على المجنون، ولا يصح منه" },
  { icon: "📏", title: "البلوغ", body: "الصيام واجب على البالغ، ومستحب للمميز" },
  { icon: "💪", title: "القدرة", body: "لا يجب على العاجز لمرض أو كِبر بلا رجاء شفاء" },
  { icon: "🚿", title: "الطهارة", body: "يجب أن يكون المرء طاهراً من الحيض والنفاس" },
  { icon: "🌅", title: "النية", body: "شرط لصحة الصيام، تُبيَّت من الليل لصيام رمضان" },
  { icon: "🕌", title: "الوقت", body: "من طلوع الفجر الصادق إلى غروب الشمس" },
  { icon: "🏠", title: "الإقامة", body: "يصح للمسافر الإفطار وعليه القضاء" },
];

const SAWM_ARKAAN = [
  {
    icon: "💭",
    title: "النية",
    body: "تعيين نية الصيام، وتُبيَّت من الليل في صيام رمضان والفرض",
  },
  {
    icon: "🚫",
    title: "الإمساك",
    body: "الكف عن المفطرات من طلوع الفجر الصادق إلى غروب الشمس",
  },
];

const MUFTIRAT: Muftar[] = [
  {
    id: "akl",
    title: "الأكل والشرب",
    icon: "🍽️",
    type: "major",
    description: "تناول أي طعام أو شراب عمداً يُفطر الصائم ويُوجب القضاء.",
    dalil: "وَكُلُوا وَاشْرَبُوا حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ مِنَ الْخَيْطِ الْأَسْوَدِ مِنَ الْفَجْرِ",
  },
  {
    id: "jima",
    title: "الجماع",
    icon: "🔒",
    type: "major",
    description: "الجماع في نهار رمضان يُفطر ويُوجب الكفارة الكبرى (عتق رقبة، فإن لم يجد فصيام شهرين متتابعين، فإن لم يستطع فإطعام 60 مسكيناً) إضافة للقضاء.",
  },
  {
    id: "istimna",
    title: "الاستمناء",
    icon: "⚠️",
    type: "major",
    description: "إنزال المني بقصد يُفطر ويُوجب القضاء عند الجمهور.",
  },
  {
    id: "qai",
    title: "القيء العمد",
    icon: "🤢",
    type: "major",
    description: "من تعمّد إخراج القيء فإنه يُفطر ويلزمه القضاء. أما من غلبه القيء فلا قضاء عليه.",
    dalil: "مَنِ اسْتَقَاءَ عَمْدًا فَلْيَقْضِ، وَمَنْ ذَرَعَهُ الْقَيْءُ فَلَا قَضَاءَ عَلَيْهِ",
  },
  {
    id: "hijama",
    title: "الحجامة",
    icon: "💉",
    type: "detail",
    description: "الحجامة تُفطر عند الحنابلة لحديث «أفطر الحاجم والمحجوم»، ولا تُفطر عند الجمهور.",
  },
  {
    id: "haid",
    title: "الحيض والنفاس",
    icon: "🌸",
    type: "major",
    description: "إن جاء الحيض أو النفاس في أثناء الصيام أفطرت المرأة وقضت الأيام التي أفطرتها.",
  },
  {
    id: "ridda",
    title: "الردة",
    icon: "❌",
    type: "major",
    description: "من ارتد عن الإسلام في أثناء الصيام بطل صومه وصيام يومه كله.",
  },
  {
    id: "niyya",
    title: "قطع النية",
    icon: "💭",
    type: "detail",
    description: "من عزم على الفطر في نهار رمضان انقطعت نيته وبطل صيامه عند الجمهور.",
  },
  {
    id: "ibr-mughadhiya",
    title: "الإبر المغذِّية",
    icon: "💊",
    type: "detail",
    description: "الإبر الوريدية المغذِّية التي تنوب عن الطعام تُفطر عند جمهور المعاصرين لأنها تُحقق مقصود الأكل. أما الإبر العلاجية (كالمضادات الحيوية والمسكنات) فلا تُفطر على الراجح.",
  },
  {
    id: "mazmaza",
    title: "سبق الماء للجوف",
    icon: "💧",
    type: "detail",
    description: "إن نزل ماء المضمضة أو الاستنشاق إلى الجوف بغير قصد فلا يُفطر، وإن كان بإسراف أفطر. لذا وردت السنة بعدم المبالغة في المضمضة للصائم.",
    dalil: "وَبَالِغْ فِي الاسْتِنْشَاقِ إِلَّا أَنْ تَكُونَ صَائِمًا",
  },
  {
    id: "qutrat",
    title: "قطرات العين والأذن والأنف",
    icon: "👁️",
    type: "detail",
    description: "قطرة العين والأذن لا تُفطر على الراجح عند الجمهور لأنهما ليستا منفذاً طبيعياً. أما قطرة الأنف فإن تجاوزت الحلق أفطرت عند الحنفية والحنابلة، لذا يُستحسن تأجيلها حتى الإفطار احتياطاً.",
  },
  {
    id: "ihtilamlah",
    title: "الاحتلام نهاراً",
    icon: "💤",
    type: "detail",
    description: "الاحتلام أثناء النوم في نهار رمضان لا يُفطر ولا قضاء على من احتلم، إذ لا إرادة له فيه. يجب عليه الغسل قبل الصلاة، ويُكمل صيامه.",
  },
];

const EXEMPTIONS: Exemption[] = [
  {
    id: "mareed",
    icon: "🏥",
    title: "المريض",
    ruling: "يُباح له الفطر ويجب القضاء",
    details: "من يضره الصيام ضرراً ظاهراً أو يزيد مرضه أو يؤخر شفاءه. أما العاجز عجزاً دائماً فيُطعم عن كل يوم مسكيناً.",
  },
  {
    id: "musafir",
    icon: "✈️",
    title: "المسافر",
    ruling: "يُباح له الفطر ويجب القضاء",
    details: "من سافر سفراً مباحاً تُقصر فيه الصلاة، وله الفطر وإن لم يشق عليه السفر.",
  },
  {
    id: "hamil",
    icon: "🤰",
    title: "الحامل والمرضع",
    ruling: "يُباحان الفطر ويجب القضاء",
    details: "إن خافتا على أنفسهما أو على الجنين/الرضيع. واختلف العلماء في هل تلزمهما الفدية مع القضاء.",
  },
  {
    id: "kibr",
    icon: "👴",
    title: "الشيخ الكبير",
    ruling: "يُباح له الفطر والفدية بلا قضاء",
    details: "العاجز عن الصيام لكبر السن أو مرض لا يُرجى برؤه يُطعم عن كل يوم مسكيناً.",
  },
  {
    id: "haid2",
    icon: "🌸",
    title: "الحائض والنفساء",
    ruling: "يجب عليهما الفطر ويقضيان",
    details: "لا يحل لهما الصيام، ويجب القضاء بعد الطهر، وصومهما باطل حتى وإن صاما.",
  },
  {
    id: "ikrah",
    icon: "😨",
    title: "المُكرَه",
    ruling: "لا إثم ولا قضاء في بعض الصور",
    details: "من أُكره على الفطر إكراهاً شديداً فلا إثم عليه، ويلزمه القضاء فقط.",
  },
  {
    id: "naasi",
    icon: "😴",
    title: "الناسي",
    ruling: "لا يُفطر ولا قضاء عليه",
    details: "من أكل أو شرب ناسياً فصيامه صحيح ولا قضاء عليه. قال ﷺ: «من أكل في صيامه ناسياً فليتم صومه فإنما أطعمه الله وسقاه» (متفق عليه). وكذلك من جامع ناسياً عند كثير من أهل العلم.",
  },
  {
    id: "murid-awwal",
    icon: "🌊",
    title: "المجهود بالجوع والعطش الشديد",
    ruling: "يُباح له الفطر ويقضي",
    details: "من أصابه جوع أو عطش شديد خاف على نفسه الهلاك جاز له الفطر ضرورةً ويقضي يوماً بدله. وهذا من رفع الإسلام للحرج: ﴿وَمَا جَعَلَ عَلَيْكُمْ فِي الدِّينِ مِنْ حَرَجٍ﴾ [الحج: ٧٨].",
  },
];

const VIRTUES: Virtue[] = [
  {
    id: "v1",
    icon: "🏆",
    title: "الصيام جُنّة",
    text: "الصِّيَامُ جُنَّةٌ، فَإِذَا كَانَ يَوْمُ صَوْمِ أَحَدِكُمْ فَلَا يَرْفُثْ وَلَا يَصْخَبْ",
    source: "متفق عليه",
  },
  {
    id: "v2",
    icon: "🚪",
    title: "باب الريّان",
    text: "إِنَّ فِي الْجَنَّةِ بَابًا يُقَالُ لَهُ الرَّيَّانُ، يَدْخُلُ مِنْهُ الصَّائِمُونَ يَوْمَ الْقِيَامَةِ",
    source: "متفق عليه",
  },
  {
    id: "v3",
    icon: "😊",
    title: "فرحتان للصائم",
    text: "لِلصَّائِمِ فَرْحَتَانِ: فَرْحَةٌ عِنْدَ فِطْرِهِ، وَفَرْحَةٌ عِنْدَ لِقَاءِ رَبِّهِ",
    source: "متفق عليه",
  },
  {
    id: "v4",
    icon: "🌟",
    title: "تُفتح أبواب الجنة",
    text: "إِذَا جَاءَ رَمَضَانُ فُتِّحَتْ أَبْوَابُ الْجَنَّةِ، وَغُلِّقَتْ أَبْوَابُ النَّارِ، وَصُفِّدَتِ الشَّيَاطِينُ",
    source: "متفق عليه",
  },
  {
    id: "v5",
    icon: "💎",
    title: "ليلة القدر",
    text: "مَنْ قَامَ لَيْلَةَ الْقَدْرِ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ",
    source: "متفق عليه",
  },
  {
    id: "v6",
    icon: "🙏",
    title: "دعاء الصائم مستجاب",
    text: "ثَلَاثَةٌ لَا تُرَدُّ دَعْوَتُهُمْ: الصَّائِمُ حَتَّى يُفْطِرَ، وَالْإِمَامُ الْعَادِلُ، وَدَعْوَةُ الْمَظْلُومِ",
    source: "سنن الترمذي، صحيح",
  },
  {
    id: "v7",
    icon: "🛡️",
    title: "الصيام يبعد النار",
    text: "مَنْ صَامَ يَوْمًا فِي سَبِيلِ اللَّهِ بَاعَدَ اللَّهُ وَجْهَهُ عَنِ النَّارِ سَبْعِينَ خَرِيفًا",
    source: "متفق عليه",
  },
  {
    id: "v8",
    icon: "🌙",
    title: "العشر الأواخر",
    text: "كَانَ النَّبِيُّ ﷺ إِذَا دَخَلَ الْعَشْرُ شَدَّ مِئْزَرَهُ، وَأَحْيَا لَيْلَهُ، وَأَيْقَظَ أَهْلَهُ",
    source: "متفق عليه",
  },
  {
    id: "v9",
    icon: "🌿",
    title: "الصيام يكفّر ذنوب السنة",
    text: "صِيَامُ يَوْمِ عَرَفَةَ أَحْتَسِبُ عَلَى اللَّهِ أَنْ يُكَفِّرَ السَّنَةَ الَّتِي قَبْلَهُ وَالسَّنَةَ الَّتِي بَعْدَهُ، وصيام عاشوراء يكفر السنة الماضية",
    source: "صحيح مسلم",
  },
  {
    id: "v10",
    icon: "📖",
    title: "الصيام والقرآن يشفعان",
    text: "الصِّيَامُ وَالْقُرْآنُ يَشْفَعَانِ لِلْعَبْدِ يَوْمَ الْقِيَامَةِ: يَقُولُ الصِّيَامُ: أَيْ رَبِّ، مَنَعْتُهُ الطَّعَامَ وَالشَّهَوَاتِ بِالنَّهَارِ، وَيَقُولُ الْقُرْآنُ: مَنَعْتُهُ النَّوْمَ بِاللَّيْلِ، فَشَفِّعْنَا فِيهِ فَيُشَفَّعَانِ",
    source: "رواه أحمد، صحيح",
  },
  {
    id: "v11",
    icon: "🌙",
    title: "من صام رمضان إيماناً",
    text: "مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ",
    source: "متفق عليه",
  },
  {
    id: "v12",
    icon: "🤲",
    title: "الصيام لله وهو يجزي به",
    text: "كُلُّ عَمَلِ ابْنِ آدَمَ لَهُ إِلَّا الصِّيَامَ فَإِنَّهُ لِي وَأَنَا أَجْزِي بِهِ؛ يَدَعُ طَعَامَهُ وَشَرَابَهُ وَشَهْوَتَهُ مِنْ أَجْلِي",
    source: "متفق عليه",
  },
  {
    id: "v13",
    icon: "⭐",
    title: "رمضان إلى رمضان مكفِّر",
    text: "الصَّلَوَاتُ الْخَمْسُ، وَالْجُمُعَةُ إِلَى الْجُمُعَةِ، وَرَمَضَانُ إِلَى رَمَضَانَ، مُكَفِّرَاتٌ لِمَا بَيْنَهُنَّ إِذَا اجْتُنِبَتِ الْكَبَائِرُ",
    source: "صحيح مسلم",
  },
  {
    id: "v14",
    icon: "🌈",
    title: "الصيام يورث خشية الله",
    text: "يَا مَعْشَرَ الشَّبَابِ، مَنِ اسْتَطَاعَ مِنْكُمُ الْبَاءَةَ فَلْيَتَزَوَّجْ، فَإِنَّهُ أَغَضُّ لِلْبَصَرِ وَأَحْصَنُ لِلْفَرْجِ، وَمَنْ لَمْ يَسْتَطِعْ فَعَلَيْهِ بِالصَّوْمِ فَإِنَّهُ لَهُ وِجَاءٌ",
    source: "متفق عليه",
  },
  {
    id: "v15",
    icon: "🌟",
    title: "خُلوف فم الصائم عند الله",
    text: "وَالَّذِي نَفْسُ مُحَمَّدٍ بِيَدِهِ لَخُلُوفُ فَمِ الصَّائِمِ أَطْيَبُ عِنْدَ اللَّهِ مِنْ رِيحِ الْمِسْكِ",
    source: "متفق عليه",
  },
];

const TABS: { id: SawmTab; label: string; icon: string }[] = [
  { id: "types", label: "أنواع الصيام", icon: "📋" },
  { id: "conditions", label: "الشروط والأركان", icon: "✅" },
  { id: "muftirat", label: "المفطرات", icon: "⚠️" },
  { id: "exemptions", label: "المعذورون", icon: "🏥" },
  { id: "virtues", label: "الفضائل", icon: "🌟" },
];

const KIND_LABEL: Record<string, string> = {
  fard: "فرض",
  wajib: "واجب",
  nafl: "نافلة",
};
const KIND_CLASS: Record<string, string> = {
  fard: "sw-badge sw-badge--fard",
  wajib: "sw-badge sw-badge--wajib",
  nafl: "sw-badge sw-badge--nafl",
};

/* ───────── component ───────── */
export default function SawmPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/sawm",
      title: "الصيام وأحكامه، المجلس العلمي",
      description: "دليل شامل لأحكام الصيام: أنواعه وشروطه ومفطراته والمعذورين وفضائل رمضان",
      keywords: ["الصيام", "رمضان", "أحكام الصيام", "مفطرات", "شروط الصيام", "فضل الصيام"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أنواع الصيام في الإسلام",
          description: "أنواع الصيام: الفرض والواجب والمستحب مع الأدلة والأحكام",
          numberOfItems: FAST_TYPES.length,
          itemListElement: FAST_TYPES.map((f, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: f.title,
            url: `https://majlisilm.com/sawm#${f.id}`,
          })),
        },
      ],
    });
  }, []);

  const [tab, setTab] = useState<SawmTab>("types");
  const [openType, setOpenType] = useState<string | null>("ramadan");
  const [search, setSearch] = useState("");

  const filteredFastTypes = useMemo(() =>
    search.trim() ? FAST_TYPES.filter(f => arabicMatchAny([f.title, f.subtitle, f.description], search)) : FAST_TYPES,
  [search]);
  const filteredMuftirat = useMemo(() =>
    search.trim() ? MUFTIRAT.filter(m => arabicMatchAny([m.title, m.description, m.dalil ?? ""], search)) : MUFTIRAT,
  [search]);
  const filteredExemptions = useMemo(() =>
    search.trim() ? EXEMPTIONS.filter(e => arabicMatchAny([e.title, e.ruling, e.details], search)) : EXEMPTIONS,
  [search]);
  const filteredVirtues = useMemo(() =>
    search.trim() ? VIRTUES.filter(v => arabicMatchAny([v.title, v.text, v.source], search)) : VIRTUES,
  [search]);

  return (
    <main className="sw-page" dir="rtl">
      {/* hero */}
      <section className="sw-hero">
        <div className="sw-hero__badge">الفقه والعبادة</div>
        <h1 className="sw-hero__title">الصيام وأحكامه</h1>
        <p className="sw-hero__sub">
          دليل شامل لأنواع الصيام وشروطه ومفطراته وفضائله ومن يُعذر في الفطر
        </p>

        {/* dua iftaar */}
        <div className="sw-dua">
          <span className="sw-dua__label">دعاء الإفطار</span>
          <p className="sw-dua__text">
            ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ
          </p>
          <span className="sw-dua__ref">سنن أبي داود، حسن</span>
        </div>

        {/* tabs */}
        <nav className="sw-tabs" aria-label="أقسام الصيام">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`sw-tab${tab === t.id ? " sw-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
            >
              <span className="sw-tab__icon">{t.icon}</span>
              <span className="sw-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </section>

      {tab !== "conditions" && (
        <div className="sw-search-wrap">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في أحكام الصيام..." className="page-search-input sw-search-input"
            aria-label="بحث في أحكام الصيام" />
        </div>
      )}

      <div className="sw-body">
        {/* ── أنواع الصيام ── */}
        {tab === "types" && (
          <section className="sw-section">
            {filteredFastTypes.map((ft) => {
              const isOpen = openType === ft.id;
              return (
                <article key={ft.id} className={`sw-card${isOpen ? " sw-card--open" : ""}`}>
                  <button
                    type="button"
                    className="sw-card__head"
                    onClick={() => setOpenType(isOpen ? null : ft.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="sw-card__icon">{ft.icon}</span>
                    <div className="sw-card__info">
                      <span className="sw-card__title">{ft.title}</span>
                      <span className="sw-card__sub">{ft.subtitle}</span>
                    </div>
                    <span className={KIND_CLASS[ft.kind]}>{KIND_LABEL[ft.kind]}</span>
                    <span className={`sw-card__chevron${isOpen ? " sw-card__chevron--open" : ""}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="sw-card__body">
                      <p className="sw-card__desc">{ft.description}</p>
                      <blockquote className="sw-dalil">
                        <p className="sw-dalil__text">{ft.dalil}</p>
                        <cite className="sw-dalil__ref">{ft.dalilRef}</cite>
                      </blockquote>
                      {ft.notes && ft.notes.length > 0 && (
                        <ul className="sw-notes">
                          {ft.notes.map((n, i) => (
                            <li key={i} className="sw-note">{n}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {/* ── الشروط والأركان ── */}
        {tab === "conditions" && (
          <section className="sw-section">
            <h2 className="sw-section__title">شروط صحة الصيام</h2>
            <div className="sw-grid-2">
              {SAWM_CONDITIONS.map((c) => (
                <div key={c.title} className="sw-cond-card">
                  <span className="sw-cond-card__icon">{c.icon}</span>
                  <div>
                    <strong className="sw-cond-card__title">{c.title}</strong>
                    <p className="sw-cond-card__body">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="sw-section__title sw-section__title--mt">أركان الصيام</h2>
            <div className="sw-grid-2">
              {SAWM_ARKAAN.map((a) => (
                <div key={a.title} className="sw-cond-card sw-cond-card--rukn">
                  <span className="sw-cond-card__icon">{a.icon}</span>
                  <div>
                    <strong className="sw-cond-card__title">{a.title}</strong>
                    <p className="sw-cond-card__body">{a.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="sw-info-box">
              <span className="sw-info-box__icon">💡</span>
              <p>
                <strong>الفرق بين الشرط والركن:</strong> الشرط ما يجب تحققه قبل العبادة وخارجها،
                أما الركن فما يكون جزءاً من العبادة ذاتها لا تتحقق إلا به.
              </p>
            </div>
          </section>
        )}

        {/* ── المفطرات ── */}
        {tab === "muftirat" && (
          <section className="sw-section">
            <p className="sw-section__intro">
              المفطرات هي الأشياء التي تُبطل الصيام إذا فُعلت في نهار رمضان عمداً
              مع العلم والإرادة. أما الجاهل والناسي والمُكرَه فلا يُفطر بها في الجملة.
            </p>
            {filteredMuftirat.map((m) => (
              <div key={m.id} className={`sw-muf-card sw-muf-card--${m.type}`}>
                <span className="sw-muf-card__icon">{m.icon}</span>
                <div className="sw-muf-card__content">
                  <strong className="sw-muf-card__title">{m.title}</strong>
                  <p className="sw-muf-card__desc">{m.description}</p>
                  {m.dalil && (
                    <blockquote className="sw-dalil sw-dalil--sm">
                      <p className="sw-dalil__text">{m.dalil}</p>
                    </blockquote>
                  )}
                </div>
              </div>
            ))}
            <div className="sw-info-box">
              <span className="sw-info-box__icon">📌</span>
              <p>
                <strong>تنبيه:</strong> النسيان لا يُفطر. من أكل أو شرب ناسياً فليُتمّ صومه
                فإنما أطعمه الله وسقاه. (متفق عليه)
              </p>
            </div>
          </section>
        )}

        {/* ── المعذورون ── */}
        {tab === "exemptions" && (
          <section className="sw-section">
            <p className="sw-section__intro">
              رفع الإسلام الحرج عن أصحاب الأعذار، وأباح لهم الفطر مع وجوب القضاء أو الفدية
              حسب كل حالة.
            </p>
            {filteredExemptions.map((ex) => (
              <div key={ex.id} className="sw-ex-card">
                <span className="sw-ex-card__icon">{ex.icon}</span>
                <div className="sw-ex-card__content">
                  <div className="sw-ex-card__head">
                    <strong className="sw-ex-card__title">{ex.title}</strong>
                    <span className="sw-ex-card__ruling">{ex.ruling}</span>
                  </div>
                  <p className="sw-ex-card__details">{ex.details}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── الفضائل ── */}
        {tab === "virtues" && (
          <section className="sw-section">
            <p className="sw-section__intro">
              حثّ النبي ﷺ على الصيام وبيّن عظيم أجره وفضله، وفيما يلي جملة من الأحاديث الصحيحة.
            </p>
            <div className="sw-virtues-grid">
              {filteredVirtues.map((v) => (
                <div key={v.id} className="sw-virtue-card">
                  <span className="sw-virtue-card__icon">{v.icon}</span>
                  <h3 className="sw-virtue-card__title">{v.title}</h3>
                  <blockquote className="sw-virtue-card__text">{v.text}</blockquote>
                  <cite className="sw-virtue-card__source">{v.source}</cite>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="twh-share">
          <ShareButtons title="الصيام وأحكامه — المجلس العلمي" url="https://majlisilm.com/sawm" />
        </div>

        {/* related */}
        <nav className="sw-related" aria-label="صفحات ذات صلة">
          <h2 className="sw-related__title">استكشف أيضاً</h2>
          <div className="sw-related__grid">
            {[
              { href: "/zakat", label: "الزكاة وأحكامها" },
              { href: "/arkan", label: "أركان الإسلام" },
              { href: "/sunan-yawmiyya", label: "السنن اليومية" },
              { href: "/adhkar", label: "الأذكار" },
              { href: "/prayer-times", label: "مواقيت الصلاة" },
              { href: "/duas", label: "الأدعية الشرعية" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="sw-related__link">
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
