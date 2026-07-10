import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Layers, Scale, Search, Sparkles } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/elite-2026.css";
import { ShareButtons } from "@/components/ContentActions";

/* ══════════════════════════════════════════════════════════════════
   §239، القواعد الفقهية الكبرى  (.fq-*)
   ══════════════════════════════════════════════════════════════════ */

type TabId = "kubra" | "faraa" | "dhawaabit" | "tatbiq";

interface Qaaida {
  id: number;
  text: string;
  meaning: string;
  origin: string;
  conditions?: string[];
  faraa: string[];
  examples: { situation: string; hukm: string }[];
  exceptions?: string[];
  scholars?: string;
}

interface FariyaQaaida {
  text: string;
  parent: number;
  explanation: string;
  example: string;
}

interface Daabita {
  id: number;
  science: string;
  icon: string;
  rules: { text: string; example: string }[];
}

interface TatbiqMasala {
  title: string;
  qaaida: string;
  question: string;
  answer: string;
  source?: string;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "kubra",     label: "القواعد الخمس الكبرى" },
  { id: "faraa",     label: "القواعد الفرعية" },
  { id: "dhawaabit", label: "الضوابط الفقهية" },
  { id: "tatbiq",    label: "التطبيقات المعاصرة" },
];

const QAWAID_KUBRA: Qaaida[] = [
  {
    id: 1,
    text: "الأُمُورُ بِمَقَاصِدِهَا",
    meaning: "كل فعل يُحكم عليه بحسب القصد والنية الكامنة وراءه، لا بصورته الظاهرة فحسب.",
    origin: "مستخرجة من حديث النبي ﷺ: «إنَّمَا الأعمالُ بالنِّيَّاتِ» (متفق عليه).",
    conditions: [
      "أن تكون النية مقارنة للفعل في الجملة",
      "أن تكون النية لأمر مشروع أصلاً",
      "أن تكون قاصدة لذات العبادة لا لغيرها",
    ],
    faraa: [
      "العقود تتبع المقاصد والمعاني، لا الألفاظ والمباني",
      "لا ثواب إلا بنية",
      "لا عبرة للتوهم والتخيل في العقود",
    ],
    examples: [
      { situation: "من نوى بوضوء الطهارة", hukm: "صحّ وضوؤه وارتفع حدثه" },
      { situation: "من أعطى ماله هبةً في مرض الموت بقصد حرمان الورثة", hukm: "اعتُبرت وصية تخضع لأحكامها" },
      { situation: "من باع سلاحاً لمن يعلم أنه سيستخدمه في العدوان", hukm: "حرم عليه البيع وكان آثماً" },
    ],
    exceptions: [
      "الشهادة: حكمها بالظاهر لا بالنية الباطنة",
      "طلاق الهازل يقع مع عدم نية الطلاق عند الجمهور",
    ],
    scholars: "الشافعي، ابن نجيم، السيوطي، ابن تيمية",
  },
  {
    id: 2,
    text: "الْيَقِينُ لَا يَزُولُ بِالشَّكِّ",
    meaning: "ما ثبت بيقين لا يرتفع إلا بيقين مثله، ولا يجوز إزالة اليقين بمجرد التوهم أو الشك.",
    origin: "مستخرجة من حديث عبد الله بن زيد: «فَلا يَنْصَرِفَنَّ حتى يَسْمَعَ صَوتًا أو يَجِدَ ريحًا» (متفق عليه).",
    conditions: [
      "أن يكون اليقين ثابتاً بدليل معتبر",
      "أن يكون الشك طارئاً لاحقاً للتيقن",
    ],
    faraa: [
      "الأصل براءة الذمة",
      "الأصل في الأشياء الإباحة",
      "الأصل بقاء ما كان على ما كان",
      "الأصل في الإنسان العدالة",
    ],
    examples: [
      { situation: "شك في عدد ركعات صلاته", hukm: "بنى على الأقل (اليقين) وأتمّ" },
      { situation: "شك هل أدّى ديناً بعد ثبوته في ذمته", hukm: "الأصل بقاء الدين حتى يثبت الأداء" },
      { situation: "شك هل زال الحيض قبل انقضاء يوم وليلة", hukm: "الأصل بقاء الحيض" },
    ],
    exceptions: [
      "إذا غلب الشك حتى صار في حكم الغالب الظن انقلب الحكم",
      "في الأموال المختلطة يعمل بغلبة الظن",
    ],
    scholars: "النووي، السيوطي، ابن الوكيل، ابن دقيق العيد",
  },
  {
    id: 3,
    text: "الْمَشَقَّةُ تَجْلِبُ التَّيْسِيرَ",
    meaning: "كلما اشتدت المشقة في أداء التكليف الشرعي جاز التخفيف من أحكامه رفقاً بالمكلف.",
    origin: "مستخرجة من قوله تعالى: ﴿يُرِيدُ اللّٰهُ بِكُمُ الْيُسْرَ وَلَا يُرِيدُ بِكُمُ الْعُسْرَ﴾ [البقرة: ١٨٥]",
    conditions: [
      "أن تكون المشقة فوق ما يُحتمل عادةً",
      "أن تكون المشقة لازمة مستمرة لا عارضة زائلة سريعاً",
      "ألا تؤدي الرخصة إلى مفسدة أكبر",
    ],
    faraa: [
      "الضرورات تبيح المحظورات",
      "الضرورة تُقدَّر بقدرها",
      "ما أُبيح للضرورة يزول بزوالها",
      "إذا ضاق الأمر اتسع",
    ],
    examples: [
      { situation: "المريض العاجز عن القيام في الصلاة", hukm: "جاز له الصلاة جالساً أو مستلقياً" },
      { situation: "المسافر في رمضان", hukm: "جاز له الفطر والقضاء بعد رمضان" },
      { situation: "المضطر إلى الميتة خوف الهلاك", hukm: "أُبيح له تناولها بقدر الضرورة" },
    ],
    exceptions: [
      "المشقة المعتادة في العبادة لا تبيح الترخص (كمشقة الصوم في الأيام المعتدلة)",
      "لا رخصة في الكبائر وأصول العقيدة مهما اشتدت المشقة",
    ],
    scholars: "ابن القيم، الشاطبي، الغزالي، الزركشي",
  },
  {
    id: 4,
    text: "الضَّرَرُ يُزَالُ",
    meaning: "وجوب إزالة الضرر عن النفس والغير، ولا يُقرّ ضرر ولا يُوقَع ضرر بلا موجب شرعي.",
    origin: "مستخرجة من حديث: «لا ضَرَرَ ولا ضِرَار» (رواه ابن ماجه وصححه ابن الصلاح).",
    conditions: [
      "أن يكون الضرر حقيقياً لا وهمياً أو مجرد توهم",
      "أن تكون إزالته ممكنة شرعاً",
      "ألا تؤدي إزالته إلى ضرر أكبر",
    ],
    faraa: [
      "الضرر لا يُزال بضرر مثله",
      "الضرر الأشد يُزال بالضرر الأخف",
      "يُتحمل الضرر الخاص لدفع الضرر العام",
      "درء المفاسد أولى من جلب المصالح",
    ],
    examples: [
      { situation: "جار يبني ما يضر جاره", hukm: "يُمنع وتُزال الضرر بأمر القاضي" },
      { situation: "زوج يضار زوجته ضراراً يُسقط حقه", hukm: "للزوجة طلب التفريق قضاءً" },
      { situation: "تاجر يحتكر طعام الناس في الأزمات", hukm: "يُجبر على البيع بالسعر العادل" },
    ],
    exceptions: [
      "الحدود والعقوبات الشرعية مشروعة وإن كان فيها ضرر على المحدود",
      "العمليات الجراحية النافعة جائزة وإن كان فيها ألم",
    ],
    scholars: "ابن الماجشون، ابن نجيم، السيوطي، المجلة العثمانية",
  },
  {
    id: 5,
    text: "الْعَادَةُ مُحَكَّمَةٌ",
    meaning: "العُرف والعادة المتوارثة يُحتجّ بها في استنباط الأحكام الشرعية وتفسير النصوص والعقود.",
    origin: "مستخرجة من قوله تعالى: ﴿خُذِ الْعَفْوَ وَأْمُرْ بِالْعُرْفِ﴾ [الأعراف: ١٩٩]",
    conditions: [
      "أن تكون العادة مطردة في الأغلب الأعم",
      "أن تكون موجودة وقت التصرف لا بعده",
      "ألا تخالف نصاً شرعياً صريحاً",
    ],
    faraa: [
      "المعروف عرفاً كالمشروط شرطاً",
      "الممتنع عادةً كالممتنع حقيقةً",
      "التعيين بالعرف كالتعيين بالنص",
      "استعمال الناس حجة يجب العمل بها",
    ],
    examples: [
      { situation: "من استأجر دابةً دون تحديد الحمل", hukm: "يُحمل ما جرى به عرف المنطقة" },
      { situation: "صداق المثل عند عدم تسمية المهر", hukm: "يُرجع إلى ما تعارف عليه أمثال الزوجة" },
      { situation: "عقد البيع بالمعاطاة بدون إيجاب وقبول صريح", hukm: "صحيح لجريان العرف به" },
    ],
    exceptions: [
      "العرف الفاسد لا يُعتبر كعرف الربا والزنا",
      "العرف الخاص لا يُعارض النص العام",
    ],
    scholars: "ابن عابدين، الشاطبي، القرافي، ابن قدامة",
  },
];

const QAWAID_FARAA: FariyaQaaida[] = [
  { text: "الغُنم بالغُرم", parent: 1, explanation: "الغانم بالنفع ضامن للضرر، من يستفيد من شيء فعليه تحمل مسؤوليته", example: "إذا أتلف الوكيل مال الغير في حدود وكالته، ضمن الموكّل لا الوكيل" },
  { text: "الخراج بالضمان", parent: 1, explanation: "نفع الشيء لمن عليه ضمانه، من يضمن شيئاً يستحق خراجه ومنافعه", example: "إذا اشترى شخص سلعة ثم تبين عيبها وردّها، فغلتها في مدة حيازته له" },
  { text: "لا عبرة بالدلالة في مقابلة التصريح", parent: 2, explanation: "إذا وُجد نص صريح لم يُعتبر ما يُفهم بالدلالة خلافاً له", example: "إذا نصّ المُوصي على ما يُوصي به صراحةً، لا يُعتبر خلافه بأي دلالة" },
  { text: "لا ثواب إلا بنية", parent: 1, explanation: "العمل الصالح لا يُثاب عليه العبد إلا إذا أتى به قاصداً", example: "من أطعم الفقير عادةً لا صدقةً لم يُثب ثواب الصدقة" },
  { text: "الضرورات تبيح المحظورات", parent: 3, explanation: "ما حُرّم ابتداءً قد يُباح عند الضرورة القصوى لرفع الحرج والمشقة الشديدة", example: "المضطر يأكل الميتة بقدر ما يسدّ الرمق" },
  { text: "الأصل بقاء ما كان على ما كان", parent: 2, explanation: "الحكم الثابت يبقى حتى يثبت ما يرفعه بدليل شرعي", example: "من تيقن الطهارة وشك في الحدث فهو طاهر" },
  { text: "إذا ضاق الأمر اتّسع", parent: 3, explanation: "عند الحرج والشدة تتوسع مساحة الحكم الشرعي رحمةً بالعباد", example: "التيمم عند عدم الماء، والصلاة قاعداً عند العجز" },
  { text: "درء المفاسد أولى من جلب المصالح", parent: 4, explanation: "عند تعارض المصالح والمفاسد، تُقدّم إزالة المفسدة على تحصيل المصلحة", example: "إغلاق بيع السلاح لمن يُخشى منه الفساد رغم المصلحة الاقتصادية" },
  { text: "يُتحمل الضرر الخاص لدفع الضرر العام", parent: 4, explanation: "يجوز إلحاق الضرر بالفرد حفاظاً على المجتمع وصون مصلحته العامة", example: "هدم بناء متداعٍ يُهدد الجيران رغم اعتراض صاحبه" },
  { text: "التابع تابع", parent: 5, explanation: "ما كان تابعاً لشيء لا يُفرد بحكم مستقل بل يتبع أصله", example: "من اشترى بستاناً، فالشجر فيه تابع له بلا حاجة لذكره" },
  { text: "المعروف عرفاً كالمشروط شرطاً", parent: 5, explanation: "ما تعارف الناس عليه وجرى به العُرف يُعدّ كأنه مشروط في العقد وإن لم يُذكر", example: "إذا جرى العرف بتسليم المبيع دون تأخير، التزم البائع ذلك وإن لم ينص عليه" },
  { text: "العبرة في العقود للمقاصد والمعاني لا للألفاظ والمباني", parent: 1, explanation: "يُنظر في العقود إلى ما قصده العاقدان حقيقةً، لا إلى الألفاظ المجردة", example: "من قال «بعتك» وكلاهما يقصد الهبة، فالهبة هي الحكم" },
  { text: "الأمور تُقدَّر بقدرها", parent: 3, explanation: "ما أُبيح لضرورة أو مشقة لا يتجاوز مقدارها بل يُقدَّر بالحاجة الفعلية", example: "المضطر يأكل من الميتة بقدر سدّ الرمق لا التشبع والادخار" },
  { text: "الأصل في الإنسان البراءة من التكاليف حتى يثبت الإلزام", parent: 2, explanation: "لا يُطالب أحد بتكليف أو دين حتى يثبت بدليل معتبر", example: "المدّعى عليه في دين لا يُلزم بالأداء حتى تُقام البيّنة" },
  { text: "رفع الحرج عن الأمة مقصد شرعي أصيل", parent: 3, explanation: "الشريعة جاءت لرفع الحرج والمشقة في التكاليف بتيسير الأحكام عند الاقتضاء", example: "جواز الجمع بين الصلاتين في السفر وتقصير الرباعية رفعاً للحرج" },
  { text: "لا اجتهاد مع النص", parent: 2, explanation: "إذا وُجد نص شرعي صريح لم يُجز مخالفته بالاجتهاد أو القياس", example: "نصاب الزكاة المقدَّر شرعاً لا يُغيَّر باجتهاد الفقيه وإن ادُّعيت المصلحة" },
  { text: "الحاجة تنزل منزلة الضرورة عامةً كانت أو خاصة", parent: 3, explanation: "إذا بلغت الحاجة حداً يُفضي إلى حرج شديد جاز التوسع في الحكم كما يُباح عند الضرورة", example: "جواز بيوع المساومة التي فيها جهالة يسيرة دفعاً للحرج في التعاملات اليومية" },
  { text: "إذا بطل الأصل بطل الفرع", parent: 2, explanation: "لا يصحّ الفرع وحده إذا انتفى أصله الذي يقوم عليه", example: "إذا بطل عقد الإجارة بطل شرط الأجر المترتب عليه" },
  { text: "المشقة لا تُثبَت بالتوهم", parent: 3, explanation: "لا يُحكم بوجود المشقة المُبيحة للرخصة بمجرد الوهم أو الإمكان بل لا بد من تحققها فعلاً", example: "من خشي مرضاً موهوماً لا يُفطر في رمضان استناداً لتلك الخشية" },
];

const DHAWAABIT: Daabita[] = [
  {
    id: 1,
    science: "العبادات",
    icon: "🕌",
    rules: [
      { text: "لا صلاة لمن لم يقرأ بفاتحة الكتاب", example: "يجب قراءة الفاتحة في كل ركعة" },
      { text: "لا اجتهاد في مورد النص", example: "لا يُغيَّر نصاب الزكاة باجتهاد الفقيه" },
      { text: "كل صلاة أُديت بشروطها وأركانها مجزئة", example: "الصلاة المؤداة في وقت العذر تُجزئ" },
      { text: "التطوع لا يُؤمّ به من هو أهل للفرض", example: "لا يصحّ اقتداء من يصلي فرضاً بمتنفّل على الصحيح" },
    ],
  },
  {
    id: 2,
    science: "المعاملات",
    icon: "⚖️",
    rules: [
      { text: "الأصل في المعاملات الإباحة حتى يثبت التحريم", example: "كل عقد جديد مباح ما لم يخالف نصاً" },
      { text: "ما اشتمل على ضرر محقق محرم وإن ظهرت فيه منفعة", example: "عقود الربا محرمة وإن بدت فيها فائدة ظاهرية" },
      { text: "لا يجوز الجمع بين عقدين متناقضين", example: "لا بيع وشرط يناقض مقتضى البيع" },
      { text: "الغرر الفاحش مفسد للعقد", example: "بيع الجنين في بطن أمه باطل لجهالة المبيع" },
      { text: "الربا محرم في كل صوره سواء جاء صريحاً أو متوسلاً بحيلة", example: "بيع العينة وترتيب الفوائد المستترة في القرض محرّمان كصريح الربا" },
    ],
  },
  {
    id: 3,
    science: "الأسرة",
    icon: "🏠",
    rules: [
      { text: "كل من كان أقرب إلى المحضون تعلّقاً كان أولى بحضانته", example: "الأم أولى بحضانة الصغير في سني الرضاع" },
      { text: "الطلاق بيد من أخذ بالساق", example: "حق الطلاق الأصيل للزوج وما أُعطي المرأة فهو خيار المخالعة" },
      { text: "لا تثبت الولاية إلا لمن يملك أهليتها", example: "السفيه لا ولاية له في الأموال" },
    ],
  },
  {
    id: 4,
    science: "الجنايات",
    icon: "🔏",
    rules: [
      { text: "لا عقوبة إلا بنص", example: "لا يُعاقب فعل إلا إذا جُرِّم شرعاً أو قانوناً" },
      { text: "الحدود تُدرأ بالشبهات", example: "أي شبهة في ثبوت الزنا تُسقط الحدّ" },
      { text: "القصاص مبني على المماثلة", example: "يُقتل القاتل بمثل ما قتل ما أمكن" },
      { text: "لا قصاص بين الأصل والفرع", example: "لا يُقتص من الأب بسبب قتل ابنه" },
    ],
  },
];

const TATBIQAT: TatbiqMasala[] = [
  {
    title: "التأمين التجاري المعاصر",
    qaaida: "الضرر يُزال / الغُرم بالغُنم",
    question: "هل يجوز الاكتتاب في شركات التأمين التجاري؟",
    answer: "يرى جمهور الفقهاء المعاصرين عدم جواز التأمين التجاري لاشتماله على الغرر الفاحش والربا. والبديل التأمين التكافلي المبني على التبرع المتبادل.",
    source: "قرار مجمع الفقه الإسلامي الدولي رقم ٩",
  },
  {
    title: "التعامل بالعملات الرقمية",
    qaaida: "الأصل في المعاملات الإباحة / العادة محكّمة",
    question: "ما حكم التداول في العملات الرقمية كالبيتكوين؟",
    answer: "للعلماء رأيان: المنع لكونها غرراً فاحشاً ولغياب الضبط والرقابة، والجواز باعتبارها سلعة كسائر السلع يجري عليها حكمها. وقد مال بعض المجامع الفقهية للمنع.",
    source: "مجمع فقهاء الشريعة بأمريكا، هيئة كبار العلماء بالسعودية",
  },
  {
    title: "البيع الإلكتروني والتجارة الرقمية",
    qaaida: "المعروف عرفاً كالمشروط شرطاً / العادة محكّمة",
    question: "ما ضوابط البيع الإلكتروني عبر المنصات الرقمية؟",
    answer: "البيع الإلكتروني جائز إذا توفرت شروط البيع الشرعي: معرفة السلعة، وتحديد الثمن، وانتفاء الغرر الفاحش. وما جرى به العرف في خدمة العملاء وسياسات الإرجاع يُعتبر ملزماً.",
    source: "قرار مجمع الفقه الإسلامي الدولي رقم ٥٢",
  },
  {
    title: "نقل الأعضاء والتبرع بها",
    qaaida: "الضرورة تبيح المحظورات / الضرر الأشد يُزال بالأخف",
    question: "ما حكم نقل الأعضاء من شخص حي أو متوفى؟",
    answer: "أجاز جمهور العلماء نقل الأعضاء بشروط: أن يكون المتبرع بالغاً عاقلاً راضياً، وألا يُفضي التبرع إلى ضرر قاتل بالمتبرع، وأن تكون الحاجة داعية. ونقل الأعضاء بعد الوفاة جائز إذا أذن المتوفى.",
    source: "قرار مجمع الفقه الإسلامي الدولي رقم ٢٦",
  },
  {
    title: "استخدام الذكاء الاصطناعي في الفتوى",
    qaaida: "الأمور بمقاصدها / اليقين لا يزول بالشك",
    question: "هل يجوز الاعتماد على الذكاء الاصطناعي في إصدار الفتاوى؟",
    answer: "لا يجوز أن يكون الذكاء الاصطناعي مرجعاً مستقلاً للفتوى لافتقاره إلى الأهلية الشرعية والتقوى والإدراك المقاصدي. ويجوز استخدامه أداةً مساعدة للبحث وتجميع المعلومات مع إشراف عالم متخصص.",
    source: "بيان رابطة العالم الإسلامي ٢٠٢٤",
  },
  {
    title: "صناديق الاستثمار الإسلامية",
    qaaida: "الأصل في المعاملات الإباحة / الغُنم بالغُرم",
    question: "ما حكم الاشتراك في صناديق الاستثمار الإسلامية والصكوك؟",
    answer: "تجوز صناديق الاستثمار الإسلامية والصكوك الشرعية إذا استوفت شروط الاستثمار المباح: خلوّها من الربا والغرر الفاحش وتضمين ربح وخسارة حقيقيَّين بحسب مبدأ الغُنم بالغُرم. وتختلف عن السندات الربوية بكونها ملكية حصص في أصول حقيقية.",
    source: "معيار هيئة المحاسبة والمراجعة للمؤسسات المالية الإسلامية (أيوفي)",
  },
  {
    title: "العقود الذكية (Smart Contracts)",
    qaaida: "العقود تتبع المقاصد / العادة محكّمة",
    question: "ما الحكم الشرعي على العقود الذكية في البلوكشين؟",
    answer: "العقد الذكي جائز من حيث الأصل إذا كان محله حلالاً وخالياً من الغرر والربا والشروط المفسدة. وتنفيذه الآلي لا يُبطله ما دام مقصد الطرفين واضحاً ومتفقاً عليه.",
    source: "ندوة البحوث الفقهية المعاصرة",
  },
  {
    title: "تأجير الأرحام",
    qaaida: "الضرر يُزال / الأمور بمقاصدها",
    question: "هل يجوز الاستعانة بامرأة أخرى لحمل الجنين (تأجير الأرحام)؟",
    answer: "ذهب جمهور الفقهاء المعاصرين إلى عدم جواز تأجير الأرحام لأجنبية لما فيه من اختلاط الأنساب وإشكاليات النسب والحضانة. ويُجيز بعض العلماء نقل البويضة المُخصَّبة من الزوجة إلى رحم الزوجة الثانية ضمن عقد زواج صحيح وبشروط محددة.",
    source: "قرار مجمع الفقه الإسلامي الدولي رقم ٤٠",
  },
  {
    title: "التحويلات البنكية الإلكترونية وبطاقات الدفع",
    qaaida: "العادة محكّمة / الأمور بمقاصدها",
    question: "ما ضوابط التحويل البنكي وبطاقات الدفع الإلكتروني من الناحية الشرعية؟",
    answer: "التحويل البنكي جائز إذا خلا من الفوائد الربوية. وبطاقات الدفع المباشر (Debit) جائزة مطلقاً. أما بطاقات الائتمان (Credit) ففيها خلاف: الجمهور على جوازها ما لم يُستعمل تسهيل الائتمان بفوائد ربوية، وهو المفتى به في كبرى المؤسسات الفقهية.",
    source: "معايير أيوفي للمؤسسات المالية الإسلامية، الطبعة المحدَّثة ٢٠٢٣",
  },
  {
    title: "إجازة الخبراء الأجانب غير المسلمين في عقود المستشفيات",
    qaaida: "الضرورات تبيح المحظورات / الضرر الأشد يُزال بالأخف",
    question: "هل يجوز الاستعانة بأطباء أو خبراء غير مسلمين في المستشفيات الإسلامية والتعاقد معهم؟",
    answer: "يجوز الاستعانة بغير المسلمين في مجال الطب والخبرات التقنية إذا دعت الحاجة ولم يوجد كفء مسلم، إذ الحاجة تنزل منزلة الضرورة. ولا يجوز أن يكون للكافر ولاية دينية أو إدارية على المسلمين، فلا تتعارض الاستعانة الفنية مع هذا الأصل.",
    source: "فتاوى اللجنة الدائمة للبحوث العلمية والإفتاء، السعودية، مجموعة ٢",
  },
  {
    title: "صيام المسلم في البلدان ذات النهار الطويل",
    qaaida: "المشقة تجلب التيسير / الأمور تُقدَّر بقدرها",
    question: "ما حكم صيام رمضان في بلدان الشمال حيث يمتد النهار أكثر من ٢٢ ساعة؟",
    answer: "للفقهاء المعاصرين رأيان: الأول — الصيام تبعاً لأوقات البلد الفعلية مهما طالت. الثاني — اعتماد توقيت أقرب البلاد الإسلامية المعتدلة كمكة أو نحوها إذا بلغت المشقة حداً يُخلّ بالتكليف أو يُفضي إلى ضرر. وقد مال كثير من المجامع الفقهية للثاني رفعاً للحرج.",
    source: "قرار مجمع الفقه الإسلامي الأوروبي، ومجلس الإفتاء الأوروبي ٢٠١٣",
  },
  {
    title: "اقتراض الرهن العقاري لتملُّك المسكن",
    qaaida: "الحاجة تنزل منزلة الضرورة / الضرر يُزال",
    question: "هل يجوز الاقتراض الربوي لشراء مسكن في بلدان الغرب حيث لا يتوفر بديل إسلامي؟",
    answer: "للعلماء في هذه المسألة اتجاهان: الجمهور يمنع الاقتراض الربوي لشراء المسكن لعدم بلوغ الضرورة الشرعية المبيحة. في حين يُجيز بعضهم للمقيمين في الغرب بضوابط: الحاجة الشديدة، وعدم توفر بديل شرعي، وكون المسكن للسكن لا الاستثمار.",
    source: "مجلس الإفتاء الأوروبي، ومجمع فقهاء الشريعة بأمريكا الشمالية",
  },
  {
    title: "الطلاق عبر الرسائل الإلكترونية",
    qaaida: "الكتابة كالكلام في إنشاء العقود والتصرفات / الأمور بمقاصدها",
    question: "هل يقع الطلاق المكتوب عبر الرسائل النصية أو البريد الإلكتروني؟",
    answer: "يرى جمهور العلماء المعاصرين أن الطلاق يقع بالكتابة الواضحة الصريحة أياً كانت وسيلتها، لأن الكتابة قائمة مقام الكلام. ومنهم من اشترط إرادة الطلاق دون كونه في لحظة غضب. وينبغي التثبت من صحة النسبة والتوثيق الرسمي تفادياً للجحود.",
    source: "مجمع الفقه الإسلامي الدولي، دورة السادسة عشرة",
  },
  {
    title: "العمل في المؤسسات المالية التقليدية",
    qaaida: "الوسائل لها حكم المقاصد / الإعانة على المحظور محظورة",
    question: "ما حكم العمل في البنوك الربوية أو الشركات التي يشتمل نشاطها الرئيسي على محرم؟",
    answer: "يُحرَّم العمل في وظائف تتعلق مباشرة بالربا كعقد القرض الربوي وتسجيله، لحديث «لعن رسول الله آكل الربا ومؤكله وكاتبه وشاهديه». أما الوظائف التقنية أو الإدارية غير المرتبطة بالعمليات الربوية مباشرةً فقد أجاز بعض العلماء العمل فيها بضوابط.",
    source: "فتوى هيئة كبار العلماء بالمملكة العربية السعودية، ولجنة الفتوى بالأزهر",
  },
];

export default function FiqhQawaidPage() {
  const [activeTab, setActiveTab] = useState<TabId>("kubra");
  const [openKubra, setOpenKubra] = useState<number | null>(null);
  const [openDhaabit, setOpenDhaabit] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [openTatbiq, setOpenTatbiq] = useState<number | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-qawaid",
      title: "القواعد الفقهية الكبرى | المجلس العلمي",
      description: "تعلّم القواعد الفقهية الخمس الكبرى وفروعها وتطبيقاتها المعاصرة بشرح موسّع وأمثلة عملية.",
      keywords: ["قواعد فقهية", "الأشباه والنظائر", "أصول الفقه", "الضوابط الفقهية", "فقه إسلامي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "القواعد الفقهية الكبرى",
          description: "القواعد الفقهية الخمس الكبرى وفروعها وتطبيقاتها",
          numberOfItems: QAWAID_KUBRA.length,
          itemListElement: QAWAID_KUBRA.map((q, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: q.text,
            url: `https://majlisilm.com/fiqh-qawaid#qaaida-${q.id}`,
          })),
        },
      ],
    });
  }, []);

  const filteredFaraa = useMemo(() =>
    search.trim()
      ? QAWAID_FARAA.filter(q => q.text.includes(search) || q.explanation.includes(search))
      : QAWAID_FARAA,
    [search],
  );

  return (
    <div className="fq-page" dir="rtl">
      {/* ══ Hero ══ */}
      <section className="fq-hero">
        <div className="fq-hero__inner">
          <span className="fq-hero__badge">الفقه الإسلامي</span>
          <h1 className="fq-hero__title">القواعد الفقهية الكبرى</h1>
          <p className="fq-hero__sub">
            الأصول الكلية التي تندرج تحتها فروع وجزئيات فقهية لا تُحصى، يستدل بها العلماء على الأحكام ويُقيسون عليها النوازل
          </p>
          <div className="fq-hero__stats">
            <div className="fq-stat"><span className="fq-stat__num">٥</span><span className="fq-stat__label">قواعد كبرى</span></div>
            <div className="fq-stat"><span className="fq-stat__num">١٩</span><span className="fq-stat__label">قاعدة فرعية</span></div>
            <div className="fq-stat"><span className="fq-stat__num">٤</span><span className="fq-stat__label">ضوابط تخصصية</span></div>
            <div className="fq-stat"><span className="fq-stat__num">٩</span><span className="fq-stat__label">تطبيق معاصر</span></div>
          </div>
        </div>
      </section>

      {/* ══ التبويبات ══ */}
      <div className="fq-container">
        <div className="fq-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              type="button"
              className={`fq-tab${activeTab === t.id ? " fq-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              aria-selected={activeTab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── القواعد الكبرى ── */}
        {activeTab === "kubra" && (
          <div className="fq-section">
            <p className="fq-intro">
              اتفق العلماء على أن هذه القواعد الخمس هي أمهات القواعد الفقهية وأكثرها استيعاباً للجزئيات،
              وقد أُودعت في كتب «الأشباه والنظائر» للسيوطي وابن نجيم وابن الوكيل وغيرهم.
            </p>
            {QAWAID_KUBRA.map((q, i) => (
              <div key={q.id} className="fq-card">
                <div
                  className="fq-card__head"
                  onClick={() => setOpenKubra(openKubra === q.id ? null : q.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenKubra(openKubra === q.id ? null : q.id)}
                  aria-expanded={openKubra === q.id}
                >
                  <div className="fq-card__num-wrap">
                    <span className="fq-card__num">{(i + 1).toLocaleString("ar-EG")}</span>
                  </div>
                  <div className="fq-card__title-wrap">
                    <span className="fq-card__arabic">{q.text}</span>
                  </div>
                  <span className="fq-card__chevron" aria-hidden="true">
                    {openKubra === q.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </div>

                {openKubra === q.id && (
                  <div className="fq-card__body">
                    <div className="fq-card__meaning">
                      <span className="fq-label">المعنى</span>
                      <p>{q.meaning}</p>
                    </div>
                    <div className="fq-card__origin">
                      <span className="fq-label">المستند</span>
                      <p>{q.origin}</p>
                    </div>
                    {q.conditions && (
                      <div className="fq-card__section">
                        <span className="fq-label">شروط الاعتبار</span>
                        <ul className="fq-list">
                          {q.conditions.map((c, j) => <li key={j}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="fq-card__section">
                      <span className="fq-label">القواعد الفرعية المنبثقة</span>
                      <ul className="fq-list fq-list--faraa">
                        {q.faraa.map((f, j) => <li key={j}>«{f}»</li>)}
                      </ul>
                    </div>
                    <div className="fq-card__section">
                      <span className="fq-label">أمثلة تطبيقية</span>
                      <div className="fq-examples">
                        {q.examples.map((ex, j) => (
                          <div key={j} className="fq-example">
                            <span className="fq-example__sit">{ex.situation}</span>
                            <span className="fq-example__arrow" aria-hidden="true">←</span>
                            <span className="fq-example__hukm">{ex.hukm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {q.exceptions && (
                      <div className="fq-card__section">
                        <span className="fq-label fq-label--warn">استثناءات</span>
                        <ul className="fq-list fq-list--exception">
                          {q.exceptions.map((ex, j) => <li key={j}>{ex}</li>)}
                        </ul>
                      </div>
                    )}
                    {q.scholars && (
                      <div className="fq-card__scholars">
                        <Sparkles size={13} aria-hidden="true" />
                        <span>{q.scholars}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── القواعد الفرعية ── */}
        {activeTab === "faraa" && (
          <div className="fq-section">
            <div className="fq-search-bar">
              <Search size={15} aria-hidden="true" />
              <input
                className="fq-search-input"
                placeholder="ابحث في القواعد الفرعية…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="بحث"
              />
            </div>
            {filteredFaraa.length === 0 && (
              <p className="fq-empty">لا نتائج للبحث</p>
            )}
            <div className="fq-faraa-grid">
              {filteredFaraa.map((q, i) => (
                <div key={i} className="fq-faraa-card">
                  <div className="fq-faraa-card__badge">
                    قاعدة {q.parent.toLocaleString("ar-EG")}
                  </div>
                  <p className="fq-faraa-card__text">«{q.text}»</p>
                  <p className="fq-faraa-card__explain">{q.explanation}</p>
                  <div className="fq-faraa-card__example">
                    <Scale size={12} aria-hidden="true" />
                    <span>{q.example}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الضوابط الفقهية ── */}
        {activeTab === "dhawaabit" && (
          <div className="fq-section">
            <p className="fq-intro">
              الضوابط الفقهية أخص من القواعد، تنحصر في فن بعينه كالعبادات أو المعاملات، وتجمع أحكاماً متشابهة في باب واحد.
            </p>
            {DHAWAABIT.map(d => (
              <div key={d.id} className="fq-daabit">
                <div
                  className="fq-daabit__head"
                  onClick={() => setOpenDhaabit(openDhaabit === d.id ? null : d.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenDhaabit(openDhaabit === d.id ? null : d.id)}
                  aria-expanded={openDhaabit === d.id}
                >
                  <span className="fq-daabit__icon" aria-hidden="true">{d.icon}</span>
                  <span className="fq-daabit__science">{d.science}</span>
                  <span className="fq-daabit__count">{d.rules.length} ضوابط</span>
                  <span className="fq-card__chevron" aria-hidden="true">
                    {openDhaabit === d.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
                {openDhaabit === d.id && (
                  <div className="fq-daabit__body">
                    {d.rules.map((r, j) => (
                      <div key={j} className="fq-daabit__rule">
                        <p className="fq-daabit__rule-text">«{r.text}»</p>
                        <p className="fq-daabit__rule-ex">
                          <Layers size={11} aria-hidden="true" />
                          {r.example}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── التطبيقات المعاصرة ── */}
        {activeTab === "tatbiq" && (
          <div className="fq-section">
            <p className="fq-intro">
              القواعد الفقهية ليست حبيسة كتب التراث، بل هي المرجع الأول للعلماء حين تنزل بهم نوازل العصر وقضاياه المستجدة.
            </p>
            {TATBIQAT.map((t, i) => (
              <div key={i} className="fq-tatbiq">
                <div
                  className="fq-tatbiq__head"
                  onClick={() => setOpenTatbiq(openTatbiq === i ? null : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenTatbiq(openTatbiq === i ? null : i)}
                  aria-expanded={openTatbiq === i}
                >
                  <span className="fq-tatbiq__num">{(i + 1).toLocaleString("ar-EG")}</span>
                  <div className="fq-tatbiq__info">
                    <span className="fq-tatbiq__title">{t.title}</span>
                    <span className="fq-tatbiq__qaaida">{t.qaaida}</span>
                  </div>
                  <span className="fq-card__chevron" aria-hidden="true">
                    {openTatbiq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
                {openTatbiq === i && (
                  <div className="fq-tatbiq__body">
                    <div className="fq-tatbiq__q">
                      <BookOpen size={14} aria-hidden="true" />
                      <p>{t.question}</p>
                    </div>
                    <p className="fq-tatbiq__a">{t.answer}</p>
                    {t.source && (
                      <p className="fq-tatbiq__source">المصدر: {t.source}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── مرجع مقتضب ── */}
        <section className="fq-ref">
          <h2 className="fq-ref__title">مراجع للمزيد</h2>
          <div className="fq-ref__grid">
            {[
              { title: "الأشباه والنظائر", author: "جلال الدين السيوطي" },
              { title: "الأشباه والنظائر", author: "ابن نجيم الحنفي" },
              { title: "الوجيز في إيضاح قواعد الفقه الكلية", author: "محمد صدقي البورنو" },
              { title: "القواعد الفقهية بين الأصالة والتوجيه", author: "علي الندوي" },
              { title: "المجلة العثمانية (الأحكام العدلية)", author: "لجنة العلماء العثمانية" },
              { title: "إعلام الموقعين عن رب العالمين", author: "ابن القيم الجوزية" },
            ].map((b, i) => (
              <div key={i} className="fq-ref__book">
                <BookOpen size={16} aria-hidden="true" />
                <div>
                  <p className="fq-ref__book-title">{b.title}</p>
                  <p className="fq-ref__book-author">{b.author}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="twh-share">
        <ShareButtons title="القواعد الفقهية — المجلس العلمي" url="https://majlisilm.com/fiqh-qawaid" />
      </div>
    </div>
  );
}
