import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { RANKS } from "@/views/PrayerRanksPage";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";


type SalahTab = "shurut" | "wajibaat" | "kayfiyya" | "mubtilatat" | "khushuu" | "fawaid" | "maratib" | "suwar";

const TABS: { id: SalahTab; label: string; icon: string }[] = [
  { id: "shurut",      label: "الشروط والأركان",   icon: "📋" },
  { id: "wajibaat",    label: "واجبات الصلاة",      icon: "✅" },
  { id: "kayfiyya",    label: "كيفية الصلاة",       icon: "🕌" },
  { id: "mubtilatat",  label: "المبطلات والمكروهات", icon: "⛔" },
  { id: "khushuu",     label: "الخشوع",             icon: "🤲" },
  { id: "fawaid",      label: "فضائل الصلاة",       icon: "⭐" },
  { id: "maratib",     label: "مراتب المصلين",      icon: "🏆" },
  { id: "suwar",       label: "سور الصلاة والنوافل", icon: "📖" },
];

/* ── واجبات الصلاة ── */
interface Wajib {
  num: number;
  title: string;
  dhikr?: string;
  desc: string;
  note?: string;
}
const WAJIBAAT: Wajib[] = [
  {
    num: 1,
    title: "التكبيرات الانتقالية",
    dhikr: "الله أكبر",
    desc: "كل تكبير بين أركان الصلاة ما عدا تكبيرة الإحرام التي هي ركن. يشمل التكبير عند الركوع والسجود والرفع منه والجلوس بين السجدتين.",
    note: "إن تركها عمداً بطلت الصلاة عند أكثر الفقهاء، وإن نسيها جبرها بسجود السهو.",
  },
  {
    num: 2,
    title: "قول «سمع الله لمن حمده» عند الرفع من الركوع",
    dhikr: "سمع الله لمن حمده",
    desc: "يقولها الإمام والمنفرد، لا المأموم. دليلها: «وإذا قال سمع الله لمن حمده فقولوا ربنا ولك الحمد» — متفق عليه.",
  },
  {
    num: 3,
    title: "قول «ربنا ولك الحمد» عند الاعتدال",
    dhikr: "ربنا ولك الحمد حمداً كثيراً طيباً مباركاً فيه",
    desc: "يقولها الإمام والمأموم والمنفرد جميعاً في حال الاعتدال من الركوع. الزيادة «حمداً كثيراً...» مستحبة لمن أمكنه.",
  },
  {
    num: 4,
    title: "التسبيح في الركوع",
    dhikr: "سبحان ربي العظيم",
    desc: "يقالها مرة واحدة على أقل الكمال، والسنة ثلاث مرات. دليلها: «فأما الركوع فعظِّموا فيه الرب» — مسلم.",
    note: "الحد الأدنى مرة، والسنة ثلاث، ويُستحب الإطالة للمنفرد.",
  },
  {
    num: 5,
    title: "التسبيح في السجود",
    dhikr: "سبحان ربي الأعلى",
    desc: "يقالها مرة واحدة على أقل الكمال، والسنة ثلاث مرات. السجود أقرب ما يكون العبد من ربه فيُستحب الإكثار من الدعاء فيه — مسلم.",
    note: "للمنفرد إطالة السجود والإكثار من الدعاء فيه ما شاء.",
  },
  {
    num: 6,
    title: "قول «رب اغفر لي» بين السجدتين",
    dhikr: "رب اغفر لي، رب اغفر لي",
    desc: "يقال في الجلسة بين السجدتين. دليلها: حديث حذيفة أن النبي ﷺ كان يقول بين السجدتين «رب اغفر لي» — أبو داود، صحيح.",
  },
  {
    num: 7,
    title: "التشهد الأول",
    dhikr: "التحيات لله والصلوات والطيبات، السلام عليك أيها النبي ورحمة الله وبركاته، السلام علينا وعلى عباد الله الصالحين، أشهد أن لا إله إلا الله وأشهد أن محمداً عبده ورسوله",
    desc: "في الصلاة الثلاثية (المغرب) وفي الصلاة الرباعية (الظهر والعصر والعشاء) في الركعة الثانية. أما الصلاة الثنائية (الفجر والنوافل) فليس فيها تشهد أول.",
    note: "إن نسيه ولم يستتم قائماً رجع وجلس. وإن استتم قائماً أكمل وسجد للسهو في آخر صلاته.",
  },
  {
    num: 8,
    title: "الجلوس للتشهد الأول",
    dhikr: "",
    desc: "الجلوس الذي يُؤدَّى فيه التشهد الأول واجب مستقل بذاته لمداومة النبي ﷺ عليه. وهو مرتبط بالتشهد الأول لكن يُعدّ واجباً قائماً بنفسه.",
    note: "إن نسيه وقام ولم يستتم رجع. وإن استتم قياماً مضى وسجد للسهو.",
  },
];

/* ── سور الصلاة والنوافل (بيانات هيكلية — المحتوى التفصيلي يُضاف عبر إدارة الفتاوى) ── */
const SUWAR_SALAH = [
  {
    prayer: "الفجر",
    recitation: "جهر",
    note: "يُستحَب إطالة القراءة. في فجر الجمعة: الم تنزيل السجدة (ركعة أولى) وهل أتى على الإنسان (ركعة ثانية).",
    rakat: 2,
  },
  {
    prayer: "الظهر",
    recitation: "إسرار",
    note: "القراءة سرية. يُستحَب الإطالة نسبياً في الركعتين الأوليين وتقصير الأخيرتين.",
    rakat: 4,
  },
  {
    prayer: "العصر",
    recitation: "إسرار",
    note: "القراءة سرية. القدر مشابه للظهر أو أقصر منه.",
    rakat: 4,
  },
  {
    prayer: "المغرب",
    recitation: "جهر",
    note: "يُستحَب قصار السور. ومن الثابت قراءة الأعراف والطور والمرسلات وقصار المفصّل.",
    rakat: 3,
  },
  {
    prayer: "العشاء",
    recitation: "جهر",
    note: "يُستحَب أوساط المفصَّل. ومنه: سورة الشمس وقريب منها.",
    rakat: 4,
  },
];

const NAWAFIL = [
  {
    name: "سنة الفجر القبلية",
    rakat: 2,
    note: "ركعتان خفيفتان قبل صلاة الفجر، من آكد السنن. يُستحَب فيهما: الكافرون في الأولى والإخلاص في الثانية، أو آيتا البقرة 136 وآل عمران 64.",
  },
  {
    name: "السنة الراتبة للظهر",
    rakat: "4 قبلية + 2 بعدية",
    note: "أربع ركعات قبل الظهر وركعتان بعده. تُقضى إن فاتت.",
  },
  {
    name: "السنة الراتبة للمغرب",
    rakat: "2 بعدية",
    note: "ركعتان بعد المغرب. يُستحَب قراءة الكافرون والإخلاص.",
  },
  {
    name: "السنة الراتبة للعشاء",
    rakat: "2 بعدية",
    note: "ركعتان بعد العشاء.",
  },
  {
    name: "صلاة الضحى",
    rakat: "2 فأكثر",
    note: "وقتها من ارتفاع الشمس قيد رمح إلى قُبيل الظهر. أدناها ركعتان وأكثرها ثمان أو اثنا عشر.",
  },
  {
    name: "صلاة الوتر",
    rakat: "1 أو 3 أو 5 أو 7",
    note: "يُؤدى بعد العشاء وآخره قُبيل الفجر. يُستحَب في الوتر: سبح اسم ربك الأعلى، والكافرون، والإخلاص.",
  },
  {
    name: "قيام الليل / التهجد",
    rakat: "مثنى مثنى",
    note: "أفضل القيام ما كان في الثلث الأخير من الليل. يختم بوتر.",
  },
  {
    name: "صلاة الاستخارة",
    rakat: 2,
    note: "ركعتان من غير الفريضة عند إرادة أمر مهم، ثم دعاء الاستخارة المأثور. تُصلَّى في أي وقت غير مكروه.",
  },
  {
    name: "صلاة التراويح",
    rakat: "8 أو 20",
    note: "تُؤدَّى في رمضان بعد العشاء. جمهور الفقهاء على عشرين ركعة، والحنابلة والمحدثون على ثمان مع الوتر. تُختم بوتر.",
  },
  {
    name: "صلاة التسابيح",
    rakat: 4,
    note: "أربع ركعات تُقال فيها التسبيحات (سبحان الله والحمد لله ولا إله إلا الله والله أكبر) ثلاثمئة مرة موزعةً على الركعات. يُستحب أداؤها مرةً في العمر على الأقل.",
  },
];

/* ── الشروط والأركان ── */
const SHURUT = [
  { title: "الإسلام", desc: "الصلاة لا تصح من كافر" },
  { title: "العقل", desc: "لا تجب على المجنون حتى يُفيق" },
  { title: "البلوغ", desc: "تجب على البالغ ويُؤمَر بها الصبي لسبع" },
  { title: "دخول الوقت", desc: "لكل صلاة وقت محدد شرعاً بدايةً ونهايةً" },
  { title: "الطهارة من الحدث", desc: "الوضوء للأصغر والغسل للأكبر" },
  { title: "الطهارة من النجاسة", desc: "في البدن والثوب والمكان" },
  { title: "استقبال القبلة", desc: "إلا لعاجز أو خائف أو في صلاة النافلة سفراً" },
  { title: "ستر العورة", desc: "عورة الرجل من السرة إلى الركبة، عورة المرأة جسدها كله" },
  { title: "النية", desc: "في القلب لا يشترط التلفظ بها" },
];

const ARKAN = [
  { num: 1, title: "القيام", desc: "للقادر في الفريضة" },
  { num: 2, title: "تكبيرة الإحرام", desc: "«الله أكبر»، ركن قولي" },
  { num: 3, title: "قراءة الفاتحة", desc: "في كل ركعة، «لا صلاة لمن لم يقرأ بفاتحة الكتاب»" },
  { num: 4, title: "الركوع", desc: "الانحناء حتى تطمئن اليدان على الركبتين" },
  { num: 5, title: "الاعتدال من الركوع", desc: "الرفع والطمأنينة" },
  { num: 6, title: "السجود", desc: "على سبعة أعظم، الجبهة والأنف واليدان والركبتان والقدمان" },
  { num: 7, title: "الرفع من السجود", desc: "والجلوس بين السجدتين" },
  { num: 8, title: "السجدة الثانية", desc: "مثل الأولى" },
  { num: 9, title: "الطمأنينة", desc: "في كل ركن، الهدوء والاستقرار" },
  { num: 10, title: "الترتيب", desc: "بين الأركان" },
  { num: 11, title: "التشهد الأخير", desc: "والجلوس له" },
  { num: 12, title: "الصلاة على النبي ﷺ", desc: "في التشهد الأخير" },
  { num: 13, title: "التسليم", desc: "السلام عليكم ورحمة الله، مرتين" },
];

/* ── كيفية الصلاة ── */
interface SalahStep {
  num: number;
  action: string;
  dhikr?: string;
  note?: string;
}
const KAYFIYYA: SalahStep[] = [
  { num: 1, action: "الوقوف مستقبلاً القبلة بنية الصلاة", note: "اليدان على الجانبين أو متقاطعتان على الصدر" },
  { num: 2, action: "رفع اليدين إلى حذو المنكبين أو الأذنين", dhikr: "الله أكبر", note: "تكبيرة الإحرام، يدخل في الصلاة" },
  { num: 3, action: "وضع اليد اليمنى على اليسرى على الصدر والقراءة", dhikr: "دعاء الاستفتاح ثم الفاتحة ثم سورة قصيرة", note: "يُسَرّ في الظهر والعصر ويُجهَر في الفجر والمغرب والعشاء" },
  { num: 4, action: "الركوع، وضع اليدين على الركبتين مع تسوية الظهر", dhikr: "سبحان ربي العظيم (3 مرات)" },
  { num: 5, action: "الرفع من الركوع", dhikr: "سمع الله لمن حمده، ربنا ولك الحمد حمداً كثيراً طيباً مباركاً فيه", note: "يرفع يديه عند الرفع" },
  { num: 6, action: "السجود، ينزل بالتكبير ويضع الجبهة والأنف أولاً", dhikr: "سبحان ربي الأعلى (3 مرات)" },
  { num: 7, action: "الجلوس بين السجدتين", dhikr: "رب اغفر لي رب اغفر لي", note: "يجلس على القدم اليسرى مفروشة ويستوي" },
  { num: 8, action: "السجدة الثانية", dhikr: "سبحان ربي الأعلى (3 مرات)" },
  { num: 9, action: "القيام للركعة الثانية بالتكبير", note: "يقوم معتمداً على ركبتيه" },
  { num: 10, action: "في الركعة الأخيرة يجلس للتشهد", dhikr: "التحيات لله والصلوات والطيبات... ثم الصلاة الإبراهيمية" },
  { num: 11, action: "التسليم عن اليمين ثم اليسار", dhikr: "السلام عليكم ورحمة الله" },
];

/* ── المبطلات والمكروهات ── */
const MUBTILATAT = [
  { title: "الحدث (نقض الطهارة)", desc: "الريح أو البول أو غيره أثناء الصلاة، تبطل فوراً" },
  { title: "الكلام العمد", desc: "الكلام الآدمي عمداً دون ضرورة يبطل الصلاة" },
  { title: "الضحك", desc: "الضحك الصوتي (القهقهة)، بخلاف التبسم" },
  { title: "الأكل والشرب", desc: "ولو شيئاً يسيراً بالعمد" },
  { title: "العبث الكثير المتوالي", desc: "الحركة المتكررة التي لا تناسب الصلاة" },
  { title: "كشف العورة", desc: "إذا انكشف شيء من العورة عمداً" },
  { title: "ترك ركن أو شرط", desc: "كنسيان تكبيرة الإحرام أو الفاتحة عمداً" },
  { title: "الردة في أثناء الصلاة", desc: "من ارتد عن الإسلام ولو لحظة أثناء الصلاة بطلت صلاته" },
  { title: "مسبوقية الإمام بركنين عمداً", desc: "من سبق إمامه بركنين فعليَّين متعمداً بطلت صلاته عند جمهور الفقهاء" },
  { title: "انحراف الصدر عن القبلة عمداً", desc: "إذا استدار عن القبلة بصدره عمداً من غير ضرورة ولا عذر بطلت صلاته" },
  { title: "السهو في ترك ركن مع عدم تداركه", desc: "إذا أسقط ركناً كالركوع أو السجود ناسياً ولم يتداركه أبطلت الركعةُ في قول أكثر الفقهاء" },
];

const MAKRUHAT = [
  "الالتفات بالوجه يميناً وشمالاً",
  "النظر للسماء",
  "البصاق أمام المصلي أو عن يمينه",
  "وضع اليد على الخصر",
  "الصلاة مع وجود ما يشغل البال (حاقناً أو حاقباً)",
  "الصلاة وأمامه ما يشغله من نار أو صورة",
  "العبث باللحية أو الثوب",
  "فرقعة الأصابع أو التقاطع بينها",
  "إغماض العينين إغماضاً تاماً دون حاجة",
  "الصلاة بحضرة طعام يشتهيه وهو جائع",
  "الصلاة في مكان فيه أصوات عالية أو مشتتات لا ضرورة لها",
  "التمطي والتثاؤب أثناء الصلاة قدر الإمكان",
  "الصلاة وأمامه نار مشتعلة أو صورة تلهيه",
];

/* ── الخشوع ── */
const KHUSHUU_WAYS = [
  { icon: "🧠", title: "حضور القلب", desc: "تذكر أنك بين يدي الله، أعظم من خلق السموات والأرض" },
  { icon: "👁️", title: "إدامة النظر لموضع السجود", desc: "لا تنظر يميناً وشمالاً، وهو خُلسة الشيطان" },
  { icon: "🎵", title: "التدبر في القراءة", desc: "تأمل معاني ما تقرأ وحاول أن تشعر بالكلمات" },
  { icon: "⏱️", title: "الطمأنينة والترتيل", desc: "لا تتعجل في الأركان، أقصر صلاة طمأنينة خير من طويلة بلا خشوع" },
  { icon: "🌟", title: "تصغير الدنيا في قلبك", desc: "استحضر عظمة الله وحقارة الدنيا قبل الصلاة" },
  { icon: "🚪", title: "التجديد والتهيؤ", desc: "توضأ بانتباه، واقرأ دعاء الدخول للمسجد، وصلّ تحية المسجد" },
  { icon: "📵", title: "إبعاد المشتتات", desc: "ضع الهاتف في الصامت، واختر مكاناً هادئاً بلا صور" },
  { icon: "🤲", title: "الدعاء في السجود", desc: "«أقرب ما يكون العبد من ربه وهو ساجد فأكثروا الدعاء»، مسلم" },
  { icon: "🌅", title: "الصلاة في أول وقتها", desc: "سُئل النبي ﷺ عن أفضل الأعمال فقال: «الصلاة على وقتها». التبكير بالصلاة يُضاعف خشوعك ويجعلها عبادة لا عادة" },
  { icon: "🔄", title: "تجديد النية بين الركعات", desc: "استحضر لماذا تصلي في كل ركعة، كأنك تقف بين يدي الله لأول مرة. هذا التجديد يُبعد الغفلة ويُحيي القلب" },
  { icon: "📖", title: "تعلُّم معاني الأذكار والفاتحة", desc: "كلما عرفت معنى ما تقوله ازداد خشوعك، فتعلَّم تفسير الفاتحة وأذكار الركوع والسجود والتشهد بالعربية والمعنى معاً" },
  { icon: "⚰️", title: "تذكُّر الموت عند كل صلاة", desc: "قال ﷺ: «اذكر الموت في صلاتك، فإن الرجل إذا ذكر الموت في صلاته حقيقٌ أن يُحسن صلاته». استشعر أنها قد تكون آخر صلاة في حياتك" },
];

/* ── فضائل الصلاة ── */
const FAWAID = [
  { ayah: "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ", ref: "العنكبوت: 45", note: "الصلاة حصن من الذنوب والفواحش" },
  { ayah: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ ۖ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ", ref: "المؤمنون: 1-2", note: "الفلاح مرتبط بالخشوع" },
  { ayah: "وَأَقِمِ الصَّلَاةَ لِذِكْرِي", ref: "طه: 14", note: "الصلاة ذكر لله، الغاية العليا" },
  { ayah: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ", ref: "البقرة: 45", note: "الصلاة معين على كل أمر شاق في الحياة" },
  { ayah: "وَأْمُرْ أَهْلَكَ بِالصَّلَاةِ وَاصْطَبِرْ عَلَيْهَا ۖ لَا نَسْأَلُكَ رِزْقًا ۖ نَّحْنُ نَرْزُقُكَ", ref: "طه: 132", note: "الصلاة التزام يُحيط بالأسرة والمجتمع" },
  { ayah: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا", ref: "النساء: 103", note: "فريضة مؤقتة محددة لا تُؤخَّر دون عذر" },
  { ayah: "فَوَيْلٌ لِّلْمُصَلِّينَ ۞ الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ", ref: "الماعون: 4-5", note: "الويل لمن يُصلي ساهياً لاهياً عن وقتها ومعناها" },
  { ayah: "فَأَقِيمُوا الصَّلَاةَ ۚ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا", ref: "النساء: 103", note: "إقامة الصلاة تعني أداءها كاملةً في وقتها بأركانها وشروطها" },
  { ayah: "وَالَّذِينَ هُمْ عَلَىٰ صَلَوَاتِهِمْ يُحَافِظُونَ", ref: "المؤمنون: 9 / المعارج: 34", note: "المحافظة على الصلاة خاتمة صفات المفلحين" },
];

const AHADITH_FAWAID = [
  { text: "«الصلوات الخمس والجمعة إلى الجمعة كفّارة لما بينهن إذا اجتُنبت الكبائر»", source: "مسلم" },
  { text: "«أول ما يُحاسَب الناس به يوم القيامة من أعمالهم الصلاة»", source: "النسائي، صحيح" },
  { text: "«الصلاة نور»، نور في القلب ونور في الوجه ونور في القبر ونور يوم القيامة", source: "مسلم" },
  { text: "«مثل الصلوات الخمس كمثل نهر غَمْر على باب أحدكم يغتسل منه خمس مرات»", source: "مسلم" },
  { text: "«من صلى الفجر في جماعة فهو في ذمة الله يوم القيامة»", source: "مسلم: ٦٥٧" },
  { text: "«من حافظ على الصلوات الخمس: ركوعها وسجودها ومواقيتها، علم أنني قد حرَّمته على النار»", source: "صحيح ابن حبان، صحيح" },
  { text: "«بين الرجل وبين الكفر والشرك ترك الصلاة»", source: "مسلم: ٨٢" },
  { text: "«من صلى البردين — الفجر والعصر — دخل الجنة»", source: "البخاري: ٥٧٤، مسلم: ٦٣٥" },
  { text: "«أقرب ما يكون العبد من ربه وهو ساجد، فأكثروا الدعاء»", source: "مسلم: ٤٨٢" },
  { text: "«إذا قام أحدكم إلى الصلاة فإن الله قِبَل وجهه، فلا يَبصُقنَّ قِبَل وجهه ولا عن يمينه»", source: "البخاري: ٤٠٦" },
  { text: "«من توضأ فأحسن الوضوء، ثم صلى ركعتين لا يُحدِّث فيهما نفسه، غُفر له ما تقدم من ذنبه»", source: "البخاري: ١٦٠، مسلم: ٢٢٦" },
  { text: "«الصلاة في المسجد الحرام خير من مئة ألف صلاة فيما سواه»، وزيادة الأجر ترتبط بالمكان والخشوع", source: "ابن ماجه: ١٤٠٦، صحيح" },
];

export default function SalahGuidePage() {
  useEffect(() => {
    applyPageSeo({
      path: "/salah-guide",
      title: "دليل الصلاة الكامل، المجلس العلمي",
      description: "الدليل الشامل للصلاة: شروطها وأركانها وسورها ومراتب المصلين والنوافل والخشوع",
      keywords: ["الصلاة", "كيفية الصلاة", "أركان الصلاة", "شروط الصلاة", "مراتب الصلاة", "سور الصلاة", "النوافل", "السنن الرواتب"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أركان الصلاة",
          description: "أركان الصلاة الثلاثة عشر مع الأدلة",
          numberOfItems: ARKAN.length,
          itemListElement: ARKAN.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `الركن ${r.num}: ${r.title} — ${r.desc}`,
            url: `https://majlisilm.com/salah-guide#rukn-${r.num}`,
          })),
        },
      ],
    });
  }, []);

  const todayWajib = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return WAJIBAAT[(day - 1 + WAJIBAAT.length) % WAJIBAAT.length];
  }, []);
  const VALID_TABS: SalahTab[] = ["shurut", "wajibaat", "kayfiyya", "mubtilatat", "khushuu", "fawaid", "maratib", "suwar"];
  const initialTab = (): SalahTab => {
    try {
      const q = new URLSearchParams(window.location.search).get("tab");
      return VALID_TABS.includes(q as SalahTab) ? (q as SalahTab) : "shurut";
    } catch { return "shurut"; }
  };
  const [tab, setTab] = useState<SalahTab>(initialTab);
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredMubtilatat = useMemo(() =>
    search.trim() ? MUBTILATAT.filter(m => arabicMatchAny([m.title, m.desc], search)) : MUBTILATAT,
  [search]);
  const filteredMakruhat = useMemo(() =>
    search.trim() ? MAKRUHAT.filter(m => arabicMatchAny([m], search)) : MAKRUHAT,
  [search]);
  const filteredKhushuu = useMemo(() =>
    search.trim() ? KHUSHUU_WAYS.filter(k => arabicMatchAny([k.title, k.desc], search)) : KHUSHUU_WAYS,
  [search]);
  const filteredFawaid = useMemo(() =>
    search.trim() ? FAWAID.filter(f => arabicMatchAny([f.ayah, f.ref, f.note], search)) : FAWAID,
  [search]);
  const filteredAhadith = useMemo(() =>
    search.trim() ? AHADITH_FAWAID.filter(h => arabicMatchAny([h.text, h.source], search)) : AHADITH_FAWAID,
  [search]);

  return (
    <main className="sg-page" dir="rtl">
      {/* hero */}
      <section className="sg-hero">
        <div className="sg-hero__badge">العبادة والأركان</div>
        <h1 className="sg-hero__title">دليل الصلاة الكامل</h1>
        <p className="sg-hero__sub">
          من الشروط والأركان إلى الخشوع والفضائل، كل ما تحتاجه لصلاة صحيحة مقبولة
        </p>
        <div className="sg-times-row">
          {[
            { name: "الفجر",   rakat: "2", mod: "sg-chip--fajr"    },
            { name: "الظهر",   rakat: "4", mod: "sg-chip--dhuhr"   },
            { name: "العصر",   rakat: "4", mod: "sg-chip--asr"     },
            { name: "المغرب",  rakat: "3", mod: "sg-chip--maghrib" },
            { name: "العشاء",  rakat: "4", mod: "sg-chip--isha"    },
          ].map((p) => (
            <div key={p.name} className={`sg-salah-chip ${p.mod}`}>
              <span className="sg-salah-chip__name">{p.name}</span>
              <span className="sg-salah-chip__rakat">{p.rakat} ركعات</span>
            </div>
          ))}
        </div>
      </section>

      {/* واجب الصلاة اليوم */}
      <div className="sgod-card">
        <div className="sgod-card__badge"><Sparkles size={11} aria-hidden="true" /> واجب الصلاة اليوم</div>
        <div className="sgod-card__num">واجب #{todayWajib.num}</div>
        <h2 className="sgod-card__title">{todayWajib.title}</h2>
        {todayWajib.dhikr && <p className="sgod-card__dhikr">{todayWajib.dhikr}</p>}
        <p className="sgod-card__desc">{todayWajib.desc}</p>
        {todayWajib.note && <p className="sgod-card__note">{todayWajib.note}</p>}
      </div>

      {/* tabs */}
      <div className="sg-tabs-bar" role="tablist" aria-label="أقسام دليل الصلاة">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`sgp-tab-${t.id}`}
            type="button"
            role="tab"
            className={`sg-tab${tab === t.id ? " sg-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
              aria-controls={`sgp-panel-${t.id}`}
          >
            <span><SectionIcon name={t.icon} size={22} /></span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="sg-body">

        {/* ── الشروط والأركان ── */}
        {tab === "shurut" && (
          <div role="tabpanel" id="sgp-panel-shurut" aria-labelledby="sgp-tab-shurut" className="sg-section">
            <h2 className="sg-subhead">شروط صحة الصلاة (9 شروط)</h2>
            <div className="sg-shurut-grid">
              {SHURUT.map((s, i) => (
                <div key={i} className="sg-shart-card">
                  <span className="sg-shart-num">{i + 1}</span>
                  <div>
                    <span className="sg-shart-title">{s.title}</span>
                    <span className="sg-shart-desc">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="sg-subhead sg-subhead--mt">أركان الصلاة (13 ركناً)</h2>
            <div className="sg-arkan-list">
              {ARKAN.map((r) => (
                <div key={r.num} className="sg-rukn-row">
                  <span className="sg-rukn-num">{r.num}</span>
                  <div>
                    <span className="sg-rukn-title">{r.title}</span>
                    <span className="sg-rukn-desc">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── واجبات الصلاة ── */}
        {tab === "wajibaat" && (
          <div role="tabpanel" id="sgp-panel-wajibaat" aria-labelledby="sgp-tab-wajibaat" className="sg-section">
            <div className="sg-info-box sg-info-box--intro">
              <span>📘</span>
              <div>
                <p>
                  <strong>الفرق بين الأركان والواجبات:</strong> الأركان لا تسقط بحال، ومن ترك ركناً عمداً أو سهواً بطلت صلاته ما لم يتداركه.
                  أما الواجبات فمن تركها عمداً بطلت صلاته، ومن تركها سهواً وجب عليه سجود السهو في آخر صلاته ولا تبطل.
                </p>
                <p className="sg-wajib-note-sub">
                  الواجبات الثمانية المذكورة هي المعتمدة في المذهب الحنبلي. وتتفاوت المذاهب في عدّ بعضها واجباً أو سنةً.
                </p>
              </div>
            </div>

            <h2 className="sg-subhead">الواجبات الثمانية للصلاة</h2>
            <div className="sg-wajibaat-list">
              {WAJIBAAT.map((w) => (
                <div key={w.num} className="sg-wajib-card">
                  <div className="sg-wajib-card__header">
                    <span className="sg-wajib-num">{w.num}</span>
                    <span className="sg-wajib-title">{w.title}</span>
                  </div>
                  {w.dhikr && (
                    <div className="sg-dhikr-box sg-dhikr-box--wajib">
                      <span className="sg-dhikr-box__label">الذكر:</span>
                      <span className="sg-dhikr-box__text">{w.dhikr}</span>
                    </div>
                  )}
                  <p className="sg-wajib-desc">{w.desc}</p>
                  {w.note && (
                    <div className="sg-step-note">
                      <span>📌</span>
                      <span>{w.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="sg-info-box sg-info-box--sujud">
              <span>🙏</span>
              <div>
                <strong>سجود السهو</strong>
                <p>
                  يُشرع سجود السهو في ثلاثة مواضع: الزيادة في الصلاة، والنقصان منها (بترك واجب)، والشك في عدد الركعات.
                  وهو سجدتان قبل التسليم في الغالب، وبعده في حالات الزيادة عند بعض الفقهاء.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── كيفية الصلاة ── */}
        {tab === "kayfiyya" && (
          <div role="tabpanel" id="sgp-panel-kayfiyya" aria-labelledby="sgp-tab-kayfiyya" className="sg-section">
            <p className="sg-lead">خطوات الصلاة بالترتيب، اضغط على كل خطوة لمزيد من التفاصيل</p>
            <div className="sg-steps-list">
              {KAYFIYYA.map((s) => {
                const isOpen = openStep === s.num;
                return (
                  <div key={s.num} className={`sg-step-card${isOpen ? " sg-step-card--open" : ""}`}>
                    <button
                      type="button"
                      className="sg-step-head"
                      onClick={() => setOpenStep(isOpen ? null : s.num)}
                    >
                      <span className="sg-step-num">{s.num}</span>
                      <span className="sg-step-action">{s.action}</span>
                      <span className={`sg-chevron${isOpen ? " sg-chevron--open" : ""}`}>▾</span>
                    </button>
                    {isOpen && (
                      <div className="sg-step-body">
                        {s.dhikr && (
                          <div className="sg-dhikr-box">
                            <span className="sg-dhikr-box__label">الذكر:</span>
                            <span className="sg-dhikr-box__text">{s.dhikr}</span>
                          </div>
                        )}
                        {s.note && (
                          <div className="sg-step-note">
                            <span>📌</span>
                            <span>{s.note}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── المبطلات ── */}
        {tab === "mubtilatat" && (
          <div role="tabpanel" id="sgp-panel-mubtilatat" aria-labelledby="sgp-tab-mubtilatat" className="sg-section">
            <div className="sg-search-wrap">
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في المبطلات والمكروهات..." className="page-search-input sg-search-input"
                aria-label="بحث في مبطلات الصلاة" />
            </div>
            <h2 className="sg-subhead">مبطلات الصلاة</h2>
            <div className="sg-mubtilatat-list">
              {filteredMubtilatat.map((m, i) => (
                <div key={i} className="sg-mubtil-card">
                  <span className="sg-mubtil-icon">✗</span>
                  <div>
                    <span className="sg-mubtil-title">{m.title}</span>
                    <span className="sg-mubtil-desc">{m.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="sg-subhead sg-subhead--mt">مكروهات الصلاة</h2>
            <ul className="sg-makruhat-list">
              {filteredMakruhat.map((m, i) => (
                <li key={i} className="sg-makruh-item">{m}</li>
              ))}
            </ul>

            <div className="sg-info-box">
              <span>💡</span>
              <p>الفرق بين المُبطِل والمكروه: المُبطِل يُلغي الصلاة وتجب إعادتها، المكروه يُنقص الأجر ولا يُلغيها. والسهو يُعالَج بسجدتَي السهو.</p>
            </div>
          </div>
        )}

        {/* ── الخشوع ── */}
        {tab === "khushuu" && (
          <div role="tabpanel" id="sgp-panel-khushuu" aria-labelledby="sgp-tab-khushuu" className="sg-section">
            <div className="sg-search-wrap">
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في أساليب الخشوع..." className="page-search-input sg-search-input"
                aria-label="بحث في الخشوع" />
            </div>
            <p className="sg-lead">
              الخشوع روح الصلاة، بلا خشوع تكون الصلاة قشراً بلا لبّ. قال تعالى:
              <strong> (وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ)</strong>
            </p>
            <div className="sg-khushuu-grid">
              {filteredKhushuu.map((k) => (
                <div key={k.title} className="sg-khushuu-card">
                  <span className="sg-khushuu-icon"><SectionIcon name={k.icon} size={22} /></span>
                  <h3 className="sg-khushuu-title">{k.title}</h3>
                  <p className="sg-khushuu-desc">{k.desc}</p>
                </div>
              ))}
            </div>

            <div className="sg-khushuu-hadith">
              <p className="sg-khushuu-hadith__text">
                «إن الرجل لينصرف وما كُتب له إلا عُشر صلاته، تُسعها، ثمنها... إلى أن قال: نصفها»
              </p>
              <cite className="sg-khushuu-hadith__ref">أبو داود، صحيح</cite>
            </div>
          </div>
        )}

        {/* ── فضائل الصلاة ── */}
        {tab === "fawaid" && (
          <div role="tabpanel" id="sgp-panel-fawaid" aria-labelledby="sgp-tab-fawaid" className="sg-section">
            <div className="sg-search-wrap">
              <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في فضائل الصلاة..." className="page-search-input sg-search-input"
                aria-label="بحث في فضائل الصلاة" />
            </div>
            <h2 className="sg-subhead">من القرآن الكريم</h2>
            <div className="sg-ayaat-list">
              {filteredFawaid.map((f, i) => (
                <div key={i} className="sg-ayah-card">
                  <p className="sg-ayah-card__text">{f.ayah}</p>
                  <cite className="sg-ayah-card__ref">{f.ref}</cite>
                  <span className="sg-ayah-card__note">{f.note}</span>
                </div>
              ))}
            </div>

            <h2 className="sg-subhead sg-subhead--mt">من السنة النبوية</h2>
            <div className="sg-ahadith-list">
              {filteredAhadith.map((h, i) => (
                <div key={i} className="sg-hadith-item">
                  <p className="sg-hadith-item__text">{h.text}</p>
                  <cite className="sg-hadith-item__source">{h.source}</cite>
                </div>
              ))}
            </div>

            <div className="sg-reminder-box">
              <h3 className="sg-reminder-box__title">تذكّر</h3>
              <p className="sg-reminder-box__text">
                الصلاة أول ما يُحاسَب عليه العبد يوم القيامة، إن صلحت صلح سائر عمله وإن فسدت فسد سائر عمله.
                خمس صلوات في اليوم تساوي 17 ركعة، كل ركعة وقفة بين يدي الله.
              </p>
            </div>
          </div>
        )}

        {/* ── مراتب المصلين ── */}
        {tab === "maratib" && (
          <div role="tabpanel" id="sgp-panel-maratib" aria-labelledby="sgp-tab-maratib" className="sg-section">
            <h2 className="sg-subhead">مراتب الناس في الصلاة (خمس مراتب)</h2>
            <p className="sg-intro-note">قال ابن القيم رحمه الله في كتاب الصلاة: الناس في الصلاة على خمس مراتب.</p>
            <div className="sg-ranks-list">
              {RANKS.map((r, i) => (
                <div key={i} className="sg-rank-card">
                  <div className="sg-rank-card__header">
                    <span className="sg-rank-card__num">{i + 1}</span>
                    <div>
                      <strong className="sg-rank-card__title">{r.label}</strong>
                      <span className={`sg-rank-card__ruling ${i === 4 ? "sg-rank-card__ruling--high" : ""}`}>{r.ruling}</span>
                    </div>
                  </div>
                  <p className="sg-rank-card__text">{r.text}</p>
                  {r.benefit && <p className="sg-rank-card__benefit">💡 {r.benefit}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── سور الصلاة والنوافل ── */}
        {tab === "suwar" && (
          <div role="tabpanel" id="sgp-panel-suwar" aria-labelledby="sgp-tab-suwar" className="sg-section">
            <h2 className="sg-subhead">القراءة في الصلوات الخمس</h2>
            <p className="sg-intro-note">
              الفاتحة ركن في كل ركعة. ويُستحب قراءة سورة أو آيات بعدها في الأوليين.
              الجهر في: الفجر والمغرب والعشاء. الإسرار في: الظهر والعصر.
            </p>
            <div className="sg-suwar-grid">
              {SUWAR_SALAH.map((p) => (
                <div key={p.prayer} className="sg-suwar-card">
                  <div className="sg-suwar-card__top">
                    <strong className="sg-suwar-card__name">{p.prayer}</strong>
                    <span className={`sg-suwar-card__rec ${p.recitation === "جهر" ? "sg-suwar-card__rec--jahr" : "sg-suwar-card__rec--sirr"}`}>
                      {p.recitation}
                    </span>
                    <span className="sg-suwar-card__rakat">{p.rakat} ركعات</span>
                  </div>
                  <p className="sg-suwar-card__note">{p.note}</p>
                </div>
              ))}
            </div>

            <h2 className="sg-subhead sg-subhead--mt">النوافل والسنن الرواتب</h2>
            <p className="sg-intro-note">
              السنن الرواتب المؤكدة اثنتا عشرة ركعة في اليوم: أربع قبل الظهر وركعتان بعده، وركعتان بعد المغرب، وركعتان بعد العشاء، وركعتا الفجر.
            </p>
            <div className="sg-nawafil-list">
              {NAWAFIL.map((n, i) => (
                <div key={i} className="sg-nawfil-card">
                  <div className="sg-nawfil-card__header">
                    <strong className="sg-nawfil-card__name">{n.name}</strong>
                    <span className="sg-nawfil-card__rakat">{n.rakat} ركعة</span>
                  </div>
                  <p className="sg-nawfil-card__note">{n.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="twh-share">
          <ShareButtons title="دليل الصلاة — المجلس العلمي" url="https://majlisilm.com/salah-guide" />
        </div>

        {/* related */}
        <nav className="sg-related" aria-label="صفحات ذات صلة">
          <h2 className="sg-related__title">استكشف أيضاً</h2>
          <div className="sg-related__grid">
            {[
              { href: "/prayer-times", label: "مواقيت الصلاة" },
              { href: "/prayer-ranks", label: "فضائل الصلاة" },
              { href: "/tahara", label: "الطهارة وأحكامها" },
              { href: "/adhkar", label: "الأذكار اليومية" },
              { href: "/sunan-yawmiyya", label: "السنن اليومية" },
              { href: "/qibla", label: "اتجاه القبلة" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="sg-related__link">{r.label}</a>
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
