import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";


type UQTab = "nuzul" | "jam" | "tafsir" | "ijaz" | "ahkam" | "qiraat";

const TABS: { id: UQTab; label: string; icon: string }[] = [
  { id: "nuzul",  label: "النزول والتنجيم", icon: "🌙" },
  { id: "jam",    label: "الجمع والتدوين",  icon: "📜" },
  { id: "tafsir", label: "التفسير وأنواعه",  icon: "🔍" },
  { id: "ijaz",   label: "الإعجاز القرآني",  icon: "✨" },
  { id: "ahkam",  label: "أحكام القرآن",     icon: "⚖️" },
  { id: "qiraat", label: "القراءات السبع",   icon: "📖" },
];

/* ── النزول ── */
const NUZUL_FACTS = [
  { label: "مدة النزول", value: "23 سنة (13 مكة + 10 المدينة)" },
  { label: "أول ما نزل", value: "اقرأ باسم ربك، سورة العلق: 1-5" },
  { label: "آخر ما نزل", value: "اليوم أكملت لكم دينكم، المائدة: 3 (يوم عرفة)" },
  { label: "أول المكي", value: "سورة العلق" },
  { label: "أطول السور", value: "البقرة (286 آية)" },
  { label: "أقصر السور", value: "الكوثر (3 آيات)" },
  { label: "سور المدنية", value: "28 سورة" },
  { label: "السور المكية", value: "86 سورة" },
  { label: "عدد الكلمات", value: "77,430 كلمة تقريباً" },
  { label: "عدد الأحزاب", value: "60 حزباً (كل حزب = نصف جزء)" },
  { label: "أول ما نزل مدنياً", value: "سورة البقرة" },
  { label: "عدد السجدات", value: "15 سجدة في القرآن الكريم" },
  { label: "عدد الأنبياء المذكورين", value: "25 نبياً باسمٍ صريح في القرآن" },
  { label: "الآية الأطول", value: "آية الدَّين — البقرة: 282" },
  { label: "عدد الحروف", value: "نحو 327,792 حرفاً (ترتيب مبدأي)" },
  { label: "الحرف الأكثر وروداً", value: "الألف (المد والوصل) — أكثر من 40,000 مرة" },
  { label: "السورة الوحيدة بدون بسملة", value: "التوبة (البراءة) — السورة التاسعة" },
  { label: "القراءات السبع المتواترة", value: "قراءة نافع — ابن كثير — أبي عمرو — ابن عامر — عاصم — حمزة — الكسائي" },
];

const NUZUL_TYPES = [
  { title: "منجّم (مفرّق)", desc: "نزل القرآن مفرّقاً لا دفعة واحدة، ليُثبّت به فؤاد النبي ﷺ ويتلقّاه الصحابة ويعمل الناس به آية آية.", dalil: "وَقُرْآنًا فَرَقْنَاهُ لِتَقْرَأَهُ عَلَى النَّاسِ عَلَىٰ مُكْثٍ، الإسراء: 106" },
  { title: "مكي ومدني", desc: "المكي ما نزل قبل الهجرة ولو في غير مكة، موضوعه العقيدة والتوحيد. المدني ما نزل بعد الهجرة، موضوعه التشريع والأحكام.", dalil: "ضابط الاصطلاح: الزمان لا المكان" },
  { title: "أسباب النزول", desc: "أحداث أو أسئلة كانت سبباً مباشراً لنزول الآيات، العبرة بعموم اللفظ لا بخصوص السبب.", dalil: "العبرة بعموم اللفظ لا بخصوص السبب، قاعدة أصولية" },
  { title: "الليلي والنهاري والسفري", desc: "نزل القرآن ليلاً ونهاراً وفي السفر والحضر والحرب والسلم، دلالةً على شموليته لجميع أحوال المسلم.", dalil: "وَكَذَٰلِكَ أَنزَلْنَاهُ حُكْمًا عَرَبِيًّا، الرعد: 37" },
  { title: "الجمعي والفردي", desc: "بعض السور نزلت دفعةً واحدة كالفاتحة والكوثر، وبعض السور نزلت متفرقةً على مدد طويلة كالبقرة التي امتد نزولها قرابة عشر سنوات.", dalil: "دلالة واضحة في كتب علوم القرآن" },
  { title: "ابتداءً وانتظاراً وجواباً", desc: "بعض الآيات نزلت ابتداءً بدون سبب ظاهر، وبعضها نزل انتظاراً (انتظر النبي ﷺ الوحي فنزل)، وبعضها نزل جواباً لسؤال أو حادثة. مثال الجواب: نزول آيات الظهار في سورة المجادلة.", dalil: "علوم القرآن — السيوطي، الإتقان" },
  { title: "التقديم والتأخير في الترتيب", desc: "ترتيب الآيات في السور توقيفي بأمر النبي ﷺ، بينما ترتيب السور فيه خلاف هل هو توقيفي أم اجتهادي. والمصحف العثماني هو المعتمد بإجماع الصحابة.", dalil: "الإتقان في علوم القرآن — السيوطي" },
];

/* ── الجمع والتدوين ── */
const JAM_STAGES = [
  {
    stage: "في عهد النبي ﷺ",
    icon: "1",
    items: [
      "حُفظ في الصدور، كان الصحابة يحفظونه غيباً",
      "كُتب في الرقاع والأكتاف والعُسُب (جريد النخل)",
      "كان الكتّاب المعيّنون يدوّنون ما يُملى عليهم",
      "لم يُجمع في مصحف واحد في حياته ﷺ",
    ],
  },
  {
    stage: "في عهد أبي بكر (12 هـ)",
    icon: "2",
    items: [
      "بعد معركة اليمامة واستشهاد 70 قارئاً أقترح عمر الجمع",
      "أمر أبو بكر زيد بن ثابت بجمع القرآن",
      "اشترط زيد التثبت بالكتابة المكتوبة + شاهدَين",
      "وُجد في مصحف واحد محفوظ عند أبي بكر ثم حفصة",
    ],
  },
  {
    stage: "في عهد عثمان (25 هـ)",
    icon: "3",
    items: [
      "بسبب اختلاف الصحابة في القراءات أمر عثمان بنسخ المصاحف",
      "أرسل المصاحف العثمانية إلى الأمصار (7 نسخ)",
      "أحرق ما سواها من صحف الآحاد غير المتّفق عليها",
      "بنى على مصحف حفصة وزاد نسخ لجنة من الصحابة",
    ],
  },
];

/* ── التفسير ── */
const TAFSIR_TYPES = [
  { title: "التفسير بالمأثور", icon: "📖", desc: "يعتمد على تفسير القرآن بالقرآن ثم بالسنة ثم بكلام الصحابة والتابعين. أعلاه مرتبةً وأصحّه.", ex: "تفسير الطبري، ابن كثير" },
  { title: "التفسير بالرأي", icon: "🧠", desc: "يعتمد على الاجتهاد مع التزام ضوابط اللغة والشريعة، قسمٌ محمود وقسمٌ مذموم.", ex: "تفسير الزمخشري، تفسير الرازي" },
  { title: "التفسير الإشاري", icon: "🔮", desc: "يستنبط الصوفية معاني باطنية من الآيات، مقبول إذا وافق الظاهر ولم يُعارض الشريعة.", ex: "تفسير القشيري" },
  { title: "التفسير العلمي", icon: "🔬", desc: "يستنبط الحقائق العلمية الكونية من القرآن، مشروط بعدم الجزم والتزام الموضوعية.", ex: "التفسير العلمي للزنداني" },
  { title: "التفسير الموضوعي", icon: "📚", desc: "يجمع الآيات ذات الموضوع الواحد من سور القرآن كلها ليدرسها دراسة متكاملة، نشأ منهجاً مستقلاً في القرن العشرين.", ex: "في ظلال القرآن لسيد قطب، تفسيرات للإمام الدريني" },
  { title: "التفسير الفقهي (أحكام القرآن)", icon: "⚖️", desc: "يعتني تحديداً بآيات الأحكام الشرعية واستنباط الفروع الفقهية منها مع ذكر الخلاف بين المذاهب.", ex: "أحكام القرآن للجصاص، أحكام القرآن لابن العربي" },
  { title: "التفسير اللغوي والنحوي", icon: "📝", desc: "يركّز على الجانب اللغوي والنحوي والصرفي للألفاظ القرآنية، ويُعنى بتحليل البنية التركيبية للآيات.", ex: "معاني القرآن للفراء، إعراب القرآن للزجاج" },
  { title: "التفسير المقارن", icon: "🔄", desc: "يجمع أقوال المفسرين في كل آية ويدرس الخلاف بينهم ويُرجّح، ويُسمى أحياناً بالتفسير الاستيعابي.", ex: "البحر المحيط لأبي حيان، الدر المنثور للسيوطي" },
];

const MUFASSIRUN = [
  { name: "ابن جرير الطبري", kitab: "جامع البيان", era: "ت 310هـ", note: "أوثق تفسير بالمأثور" },
  { name: "ابن كثير", kitab: "تفسير القرآن العظيم", era: "ت 774هـ", note: "أشهر التفاسير وأيسرها" },
  { name: "القرطبي", kitab: "الجامع لأحكام القرآن", era: "ت 671هـ", note: "عمدة في آيات الأحكام" },
  { name: "السعدي", kitab: "تيسير الكريم الرحمن", era: "ت 1376هـ", note: "يسير واضح للجميع" },
  { name: "ابن عاشور", kitab: "التحرير والتنوير", era: "ت 1393هـ", note: "أشمل تفاسير العصر الحديث" },
  { name: "الزمخشري", kitab: "الكشاف عن حقائق التنزيل", era: "ت 538هـ", note: "إمام في البلاغة مع التنبه لاعتزالياته" },
  { name: "ابن عطية الأندلسي", kitab: "المحرر الوجيز", era: "ت 541هـ", note: "من أجمع تفاسير المغرب العربي" },
  { name: "الراغب الأصفهاني", kitab: "المفردات في غريب القرآن", era: "ت 502هـ", note: "مرجع أساسي في لغة ألفاظ القرآن" },
  { name: "الشوكاني", kitab: "فتح القدير", era: "ت 1250هـ", note: "جمع بين التفسير بالمأثور والاستنباط" },
  { name: "الأمين الشنقيطي", kitab: "أضواء البيان في إيضاح القرآن بالقرآن", era: "ت 1393هـ", note: "رائد تفسير القرآن بالقرآن في العصر الحديث" },
  { name: "البغوي", kitab: "معالم التنزيل", era: "ت 516هـ", note: "تفسير نظيف من الإسرائيليات، بالغ في الاهتمام بالسنة النبوية" },
  { name: "النسفي", kitab: "مدارك التنزيل وحقائق التأويل", era: "ت 710هـ", note: "تفسير موجز جامع، عمدة في المدارس الحنفية" },
  { name: "ابن الجوزي", kitab: "زاد المسير في علم التفسير", era: "ت 597هـ", note: "مختصر نافع في نقل أقوال السلف وعلم النزول" },
  { name: "الآلوسي", kitab: "روح المعاني في تفسير القرآن الكريم", era: "ت 1270هـ", note: "موسوعي شامل يجمع المأثور والمعقول والإشاري في ثلاثين جزءاً" },
  { name: "الرازي (فخر الدين)", kitab: "مفاتيح الغيب (التفسير الكبير)", era: "ت 606هـ", note: "أوسع التفاسير في العلوم العقلية والفلسفية، لكن فيه تطويل وخروج عن المقصود" },
  { name: "أبو حيان الأندلسي", kitab: "البحر المحيط في التفسير", era: "ت 745هـ", note: "مرجع أول في الإعراب القرآني والتحليل النحوي، شديد النقد للزمخشري" },
  { name: "سيد قطب", kitab: "في ظلال القرآن", era: "ت 1386هـ", note: "تفسير أدبي حركي بأسلوب أدبي رفيع، كتبه صاحبه في ظروف استثنائية — يُقرأ للتذوق الأدبي مع التنبه لبعض آرائه" },
  { name: "الشيخ الشعراوي", kitab: "التفسير الشعراوي (خواطر)", era: "ت 1419هـ", note: "تفسير مُيسَّر للعامة بأسلوب شفهي جمع بين العلم والبيان، نُقل من الكلمات المسجلة" },
  { name: "ابن أبي حاتم الرازي", kitab: "تفسير ابن أبي حاتم", era: "ت 327هـ", note: "من أنفس كتب التفسير بالمأثور عن الصحابة والتابعين، وثيق الصلة بكتب الجرح والتعديل" },
];

/* ── الإعجاز ── */
const IJAZ_TYPES = [
  { title: "الإعجاز اللغوي والبياني", icon: "🗣️", desc: "أسلوب القرآن يفوق كلام البشر في الفصاحة والبلاغة والجمال، عجز العرب عن معارضته وهم أهل اللغة." },
  { title: "الإعجاز التشريعي", icon: "⚖️", desc: "منظومة تشريعية متكاملة تحكم حياة الإنسان والمجتمع، جاء بها رجل لم يتلقَّ تعليماً." },
  { title: "الإعجاز العلمي", icon: "🔭", desc: "إشارات علمية دقيقة في مجالات الفلك والبيولوجيا وعلم الأجنة وعلم البحار، لم يكن للبشر علم بها." },
  { title: "الإعجاز الغيبي", icon: "🔮", desc: "إخبار بغيوب مضت وغيوب مستقبلية تحقق كثيرٌ منها، كانتصار الروم وحفظ فرعون جسداً." },
  { title: "إعجاز الحفظ والانتشار", icon: "🌍", desc: "وحده من بين الكتب السماوية بقي محفوظاً بالنص والسند دون تحريف، قال تعالى: (إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ)." },
  { title: "التحدي المفتوح", icon: "🏆", desc: "طالب القرآن بمثله ثم بعشر سور ثم بسورة واحدة، وظل التحدي قائماً إلى يوم القيامة دون مجاراة." },
  { title: "الإعجاز العددي", icon: "🔢", desc: "تكرار كلمات متقابلة المعنى بأعداد متساوية: الدنيا والآخرة (115 مرة لكل منهما)، الحياة والموت، الملائكة والشياطين — ظاهرة دقيقة تستعصي على الصدفة." },
  { title: "الإعجاز التربوي والنفسي", icon: "🧠", desc: "منهج القرآن في تغيير السلوك البشري يتفوق على أرقى النظريات النفسية الحديثة، إذ جمع بين الترغيب والترهيب والقدوة والسرد والحجة في بنية متكاملة موجَّهة للقلب لا العقل فحسب." },
  { title: "الإعجاز التناسبي (علم المناسبات)", icon: "🔗", desc: "التناسق الدقيق بين أول السورة وآخرها، وبين السورة وما قبلها وما بعدها — كشف عنه علماء كالبقاعي في 'نظم الدرر' والبيضاوي، وأثبت أن هذا الترتيب معجز في بنيته وليس عشوائياً." },
];

/* ── أحكام القرآن ── */
const MUHKAM_MUTASHABIH = {
  muhkam: {
    title: "المحكم",
    def: "ما تبيّن معناه واستقل بنفسه ولا لبس فيه، وهو أم الكتاب.",
    ex: ["قل هو الله أحد", "لا إله إلا الله", "آيات الأحكام الصريحة"],
  },
  mutashabih: {
    title: "المتشابه",
    def: "ما خفي معناه ولم يتضح وحده، كالحروف المقطعة والصفات الإلهية.",
    ex: ["الم، حم، كهيعص", "الرحمن على العرش استوى", "يَدُ اللَّهِ فَوْقَ أَيْدِيهِمْ"],
  },
};

/* ── القراءات السبع ── */
interface Qira {
  name: string;
  imam: string;
  died: string;
  origin: string;
  rawi1: string;
  rawi2: string;
  note: string;
}

const QIRAAT_SABA: Qira[] = [
  { name: "قراءة نافع",      imam: "نافع بن عبد الرحمن",   died: "ت 169هـ", origin: "المدينة المنورة", rawi1: "قالون",   rawi2: "ورش",   note: "أشيع القراءات في المغرب العربي وغرب أفريقيا (ورش) وليبيا وتونس (قالون)" },
  { name: "قراءة ابن كثير",  imam: "عبدالله بن كثير",      died: "ت 120هـ", origin: "مكة المكرمة",    rawi1: "البزي",   rawi2: "قنبل",  note: "مكة المكرمة وإندونيسيا" },
  { name: "قراءة أبي عمرو",  imam: "أبو عمرو بن العلاء",   died: "ت 154هـ", origin: "البصرة",         rawi1: "الدوري",  rawi2: "السوسي",note: "من أكثر القراءات توثيقاً في كتب الرواية، واسع الانتشار قديماً" },
  { name: "قراءة ابن عامر",  imam: "عبدالله بن عامر",      died: "ت 118هـ", origin: "الشام",          rawi1: "هشام",    rawi2: "ابن ذكوان", note: "الشام والأردن وبعض بلدان المشرق" },
  { name: "قراءة عاصم",      imam: "عاصم بن أبي النجود",   died: "ت 127هـ", origin: "الكوفة",         rawi1: "شعبة",    rawi2: "حفص",   note: "رواية حفص هي الأكثر انتشاراً في العالم الإسلامي (مصر، الخليج، تركيا، آسيا)" },
  { name: "قراءة حمزة",      imam: "حمزة بن حبيب",         died: "ت 156هـ", origin: "الكوفة",         rawi1: "خلف",     rawi2: "خلاد",  note: "منتشرة في الكتب والدراسات العلمية المتخصصة" },
  { name: "قراءة الكسائي",   imam: "علي بن حمزة الكسائي",  died: "ت 189هـ", origin: "الكوفة",         rawi1: "الليث",   rawi2: "الدوري",note: "إمام الكوفة ومن كبار أئمة النحو وعلوم العربية" },
];

const QIRAAT_USUL = [
  { title: "شرط القبول",       desc: "اتفق العلماء على ثلاثة شروط للقراءة الصحيحة: (1) موافقة وجه في اللغة العربية، (2) موافقة رسم المصاحف العثمانية ولو احتمالاً، (3) صحة السند بالتواتر." },
  { title: "القراءات المتواترة", desc: "القراءات السبع متواترة عند جمهور العلماء، وأضاف ابن الجزري إليها ثلاثاً أخرى فصارت العشر. وما عداها إما شاذ أو ضعيف." },
  { title: "الأحرف السبعة",     desc: "الأحرف السبعة الواردة في الحديث ليست القراءات السبع، بل هي أوجه من التوسع اللغوي نزل بها القرآن. والعلاقة بينهما دقيقة وقد أطال العلماء في بيانها." },
  { title: "وظيفة التجويد",     desc: "علم التجويد يُقعِّد أحكام قراءة القرآن كالمد والإدغام والإخفاء والقلقلة، وهو واجب عملي على كل قارئ. وقد ألّف فيه الإمام ابن الجزري متنه الشهير 'الجزرية'." },
  { title: "القراءات الثلاث التكميلية (العشر)", desc: "أضاف ابن الجزري (ت 833هـ) في 'النشر في القراءات العشر' ثلاث قراءات إلى السبع: قراءة أبي جعفر المدني، وقراءة يعقوب الحضرمي، وقراءة خلف العاشر. والعشر كلها متواترة عند المحققين وقد حصرها الحافظ ابن الجزري بأسانيد صحيحة." },
];

const NASKH_TYPES = [
  { title: "نسخ الحكم والتلاوة", desc: "رُفع الحكم ورُفع النص معاً، وهو الأقل.", ex: "عشر رضعات معلومات كن يُحرّمن" },
  { title: "نسخ التلاوة دون الحكم", desc: "رُفع النص وبقي حكمه معمولاً به.", ex: "الشيخ والشيخة إذا زنيا فارجموهما" },
  { title: "نسخ الحكم دون التلاوة", desc: "أكثر أنواع النسخ وأشهرها، بقي النص يُتلى ورُفع حكمه.", ex: "نسخ وجوب التصدق قبل مناجاة النبي ﷺ" },
];

export default function UlumQuranPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/ulum-quran",
      title: "علوم القرآن الكريم، المجلس العلمي",
      description: "مقدمة شاملة في علوم القرآن: النزول والجمع والتفسير والإعجاز والمحكم والمتشابه والناسخ والمنسوخ",
      keywords: ["علوم القرآن", "أسباب النزول", "الناسخ والمنسوخ", "المحكم والمتشابه", "إعجاز القرآن"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "حقائق علوم القرآن الكريم",
          description: "حقائق أساسية في علوم القرآن: نزوله وجمعه وتفسيره وإعجازه",
          numberOfItems: NUZUL_FACTS.length,
          itemListElement: NUZUL_FACTS.map((f, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${f.label}: ${f.value}`,
            url: `https://majlisilm.com/ulum-quran#fact-${i + 1}`,
          })),
        },
      ],
    });
  }, []);

  const todayQira = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return QIRAAT_SABA[(day - 1 + QIRAAT_SABA.length) % QIRAAT_SABA.length];
  }, []);
  const [tab, setTab] = useState<UQTab>("nuzul");
  const [openJam, setOpenJam] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const filteredNuzulFacts = useMemo(() =>
    search.trim() ? NUZUL_FACTS.filter(f => arabicMatchAny([f.label, f.value], search)) : NUZUL_FACTS,
  [search]);
  const filteredNuzulTypes = useMemo(() =>
    search.trim() ? NUZUL_TYPES.filter(n => arabicMatchAny([n.title, n.desc, n.dalil ?? ""], search)) : NUZUL_TYPES,
  [search]);
  const filteredTafsirTypes = useMemo(() =>
    search.trim() ? TAFSIR_TYPES.filter(t => arabicMatchAny([t.title, t.desc, t.ex], search)) : TAFSIR_TYPES,
  [search]);
  const filteredMufassirun = useMemo(() =>
    search.trim() ? MUFASSIRUN.filter(m => arabicMatchAny([m.name, m.kitab, m.era, m.note], search)) : MUFASSIRUN,
  [search]);
  const filteredIjaz = useMemo(() =>
    search.trim() ? IJAZ_TYPES.filter(j => arabicMatchAny([j.title, j.desc], search)) : IJAZ_TYPES,
  [search]);

  return (
    <main className="uq-page" dir="rtl">
      {/* hero */}
      <section className="uq-hero">
        <div className="uq-hero__badge">علوم القرآن</div>
        <h1 className="uq-hero__title">علوم القرآن الكريم</h1>
        <p className="uq-hero__sub">
          مقدمة شاملة في علوم القرآن: من النزول والجمع إلى الإعجاز والتفسير والأحكام
        </p>
        <div className="uq-stats-row">
          {[
            { num: "114", label: "سورة" },
            { num: "6236", label: "آية" },
            { num: "30", label: "جزءاً" },
            { num: "23", label: "سنة نزول" },
          ].map((s) => (
            <div key={s.label} className="uq-stat">
              <span className="uq-stat__num">{s.num}</span>
              <span className="uq-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* قراءة اليوم */}
      <div className="uqod-card">
        <div className="uqod-card__badge"><Sparkles size={11} aria-hidden="true" /> قراءة اليوم</div>
        <h2 className="uqod-card__name">{todayQira.name}</h2>
        <div className="uqod-card__meta">
          <span className="uqod-card__imam">{todayQira.imam}</span>
          <span className="uqod-card__sep">·</span>
          <span className="uqod-card__died">{todayQira.died}</span>
          <span className="uqod-card__sep">·</span>
          <span className="uqod-card__origin">{todayQira.origin}</span>
        </div>
        <div className="uqod-card__rawi">
          <span className="uqod-card__rawi-label">الراويان:</span>
          <span>{todayQira.rawi1} · {todayQira.rawi2}</span>
        </div>
        <p className="uqod-card__note">{todayQira.note}</p>
      </div>

      {/* tabs */}
      <div className="uq-tabs-bar" role="tablist" aria-label="أقسام علوم القرآن">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`ulq-tab-${t.id}`}
            type="button"
            role="tab"
            className={`uq-tab${tab === t.id ? " uq-tab--active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-selected={tab === t.id}
              aria-controls={`ulq-panel-${t.id}`}
          >
            <span><SectionIcon name={t.icon} size={22} /></span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="uq-body">

        {/* ── النزول ── */}
        {tab === "nuzul" && (
          <div role="tabpanel" id="ulq-panel-nuzul" aria-labelledby="ulq-tab-nuzul" className="uq-section">
            <div className="uq-search-wrap">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في حقائق النزول..."
                className="page-search-input uq-search-input"
                aria-label="بحث في علوم النزول"
              />
            </div>
            <div className="uq-facts-grid">
              {filteredNuzulFacts.map((f) => (
                <div key={f.label} className="uq-fact-item">
                  <span className="uq-fact-item__label">{f.label}</span>
                  <span className="uq-fact-item__value">{f.value}</span>
                </div>
              ))}
            </div>

            <h2 className="uq-subhead">أنواع النزول</h2>
            <div className="uq-types-list">
              {filteredNuzulTypes.map((n) => (
                <div key={n.title} className="uq-type-card">
                  <h3 className="uq-type-card__title">{n.title}</h3>
                  <p className="uq-type-card__desc">{n.desc}</p>
                  {n.dalil && (
                    <div className="uq-dalil-box">
                      <span className="uq-dalil-box__icon">📜</span>
                      <span>{n.dalil}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الجمع ── */}
        {tab === "jam" && (
          <div role="tabpanel" id="ulq-panel-jam" aria-labelledby="ulq-tab-jam" className="uq-section">
            <p className="uq-lead">
              مرّ جمع القرآن وتدوينه بثلاث مراحل تاريخية متتالية ضمنت حفظه من الضياع والتحريف
            </p>
            <div className="uq-jam-list">
              {JAM_STAGES.map((s, i) => {
                const isOpen = openJam === i;
                return (
                  <div key={i} className={`uq-jam-card${isOpen ? " uq-jam-card--open" : ""}`}>
                    <button
                      type="button"
                      className="uq-jam-head"
                      onClick={() => setOpenJam(isOpen ? null : i)}
                    >
                      <span className="uq-jam-num"><SectionIcon name={s.icon} size={22} /></span>
                      <span className="uq-jam-title">{s.stage}</span>
                      <span className={`uq-jam-chevron${isOpen ? " uq-jam-chevron--open" : ""}`}>▾</span>
                    </button>
                    {isOpen && (
                      <ul className="uq-jam-body">
                        {s.items.map((item) => (
                          <li key={item} className="uq-jam-item">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="uq-info-box">
              <span className="uq-info-box__icon">ℹ️</span>
              <p>الفرق بين جمع أبي بكر وجمع عثمان: الأول جمع المتفرق في مكان واحد، والثاني وحّد القراءة على حرف واحد وأرسل نسخاً موحّدة للأمصار.</p>
            </div>
          </div>
        )}

        {/* ── التفسير ── */}
        {tab === "tafsir" && (
          <div role="tabpanel" id="ulq-panel-tafsir" aria-labelledby="ulq-tab-tafsir" className="uq-section">
            <div className="uq-search-wrap">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في أنواع التفسير والمفسّرين..."
                className="page-search-input uq-search-input"
                aria-label="بحث في التفسير"
              />
            </div>
            <div className="uq-tafsir-types">
              {filteredTafsirTypes.map((t) => (
                <div key={t.title} className="uq-tafsir-card">
                  <span className="uq-tafsir-icon"><SectionIcon name={t.icon} size={22} /></span>
                  <div>
                    <h3 className="uq-tafsir-title">{t.title}</h3>
                    <p className="uq-tafsir-desc">{t.desc}</p>
                    <span className="uq-tafsir-ex">مثال: {t.ex}</span>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="uq-subhead">أبرز المفسّرين وكتبهم</h2>
            <div className="uq-mufassirun">
              {filteredMufassirun.map((m) => (
                <div key={m.name} className="uq-mufassir-row">
                  <div className="uq-mufassir-info">
                    <span className="uq-mufassir-name">{m.name}</span>
                    <span className="uq-mufassir-era">{m.era}</span>
                  </div>
                  <div>
                    <span className="uq-mufassir-kitab">{m.kitab}</span>
                    <span className="uq-mufassir-note">{m.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الإعجاز ── */}
        {tab === "ijaz" && (
          <div role="tabpanel" id="ulq-panel-ijaz" aria-labelledby="ulq-tab-ijaz" className="uq-section">
            <div className="uq-search-wrap">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في أنواع الإعجاز القرآني..."
                className="page-search-input uq-search-input"
                aria-label="بحث في الإعجاز القرآني"
              />
            </div>
            <div className="uq-ijaz-grid">
              {filteredIjaz.map((j) => (
                <div key={j.title} className="uq-ijaz-card">
                  <span className="uq-ijaz-icon"><SectionIcon name={j.icon} size={22} /></span>
                  <h3 className="uq-ijaz-title">{j.title}</h3>
                  <p className="uq-ijaz-desc">{j.desc}</p>
                </div>
              ))}
            </div>

            <div className="uq-ijaz-ayah">
              <p className="uq-ijaz-ayah__text">
                قُل لَّئِنِ اجْتَمَعَتِ الْإِنسُ وَالْجِنُّ عَلَىٰ أَن يَأْتُوا بِمِثْلِ هَٰذَا الْقُرْآنِ لَا يَأْتُونَ بِمِثْلِهِ
                وَلَوْ كَانَ بَعْضُهُمْ لِبَعْضٍ ظَهِيرًا
              </p>
              <cite className="uq-ijaz-ayah__ref">الإسراء: 88</cite>
            </div>
          </div>
        )}

        {/* ── أحكام القرآن ── */}
        {tab === "ahkam" && (
          <div role="tabpanel" id="ulq-panel-ahkam" aria-labelledby="ulq-tab-ahkam" className="uq-section">
            <h2 className="uq-subhead">المحكم والمتشابه</h2>
            <div className="uq-mm-grid">
              {[MUHKAM_MUTASHABIH.muhkam, MUHKAM_MUTASHABIH.mutashabih].map((m) => (
                <div key={m.title} className="uq-mm-card">
                  <h3 className="uq-mm-title">{m.title}</h3>
                  <p className="uq-mm-def">{m.def}</p>
                  <div className="uq-mm-examples">
                    <span className="uq-mm-examples__label">أمثلة:</span>
                    {m.ex.map((e) => (
                      <span key={e} className="uq-mm-examples__item">{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <h2 className="uq-subhead uq-subhead--mt">الناسخ والمنسوخ</h2>
            <p className="uq-lead">النسخ لغةً: الإزالة. اصطلاحاً: رفع حكم شرعي متقدم بحكم متأخر، وللنسخ ثلاثة أنواع:</p>
            <div className="uq-naskh-list">
              {NASKH_TYPES.map((n, i) => (
                <div key={i} className="uq-naskh-card">
                  <div className="uq-naskh-num">{i + 1}</div>
                  <div>
                    <h3 className="uq-naskh-title">{n.title}</h3>
                    <p className="uq-naskh-desc">{n.desc}</p>
                    <span className="uq-naskh-ex">مثال: {n.ex}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="uq-info-box uq-info-box--mt">
              <span className="uq-info-box__icon">📌</span>
              <p>آيات الأحكام في القرآن تُقدَّر بـ 500 آية، بعض العلماء يقدّرها بـ 200 آية آية صريحة الحكم.</p>
            </div>
          </div>
        )}

        {/* ── القراءات السبع ── */}
        {tab === "qiraat" && (
          <div role="tabpanel" id="ulq-panel-qiraat" aria-labelledby="ulq-tab-qiraat" className="uq-section">
            <p className="uq-lead">
              القراءات السبع المتواترة هي طرق أداء القرآن الكريم المنقولة بالسند الصحيح عن النبي ﷺ، كل قراءة تتميز بخصائص أدائية وعلماء رواة محددين.
            </p>

            <div className="uq-qiraat-grid">
              {QIRAAT_SABA.map((q, i) => (
                <div key={i} className="uq-qiraat-card">
                  <div className="uq-qiraat-card__head">
                    <span className="uq-qiraat-card__num">{(i + 1).toLocaleString("ar-EG")}</span>
                    <div>
                      <h3 className="uq-qiraat-card__name">{q.name}</h3>
                      <span className="uq-qiraat-card__imam">{q.imam} — {q.died}</span>
                    </div>
                    <span className="uq-qiraat-card__origin">{q.origin}</span>
                  </div>
                  <div className="uq-qiraat-card__rawis">
                    <span className="uq-qiraat-card__rawi-label">الراويان:</span>
                    <span className="uq-qiraat-card__rawi">{q.rawi1}</span>
                    <span className="uq-qiraat-card__sep">·</span>
                    <span className="uq-qiraat-card__rawi">{q.rawi2}</span>
                  </div>
                  <p className="uq-qiraat-card__note">{q.note}</p>
                </div>
              ))}
            </div>

            <h2 className="uq-subhead uq-subhead--mt">أصول علم القراءات</h2>
            <div className="uq-qiraat-usul">
              {QIRAAT_USUL.map((u, i) => (
                <div key={i} className="uq-usul-card">
                  <h3 className="uq-usul-card__title">{u.title}</h3>
                  <p className="uq-usul-card__desc">{u.desc}</p>
                </div>
              ))}
            </div>

            <div className="uq-info-box uq-info-box--mt">
              <span className="uq-info-box__icon">📌</span>
              <p>أشهر المراجع في القراءات: النشر في القراءات العشر لابن الجزري، والسبعة لابن مجاهد، وحرز الأماني الشاطبية للشاطبي.</p>
            </div>
          </div>
        )}

        <div className="twh-share">
          <ShareButtons title="علوم القرآن الكريم — المجلس العلمي" url="https://majlisilm.com/ulum-quran" />
        </div>

        {/* related */}
        <nav className="uq-related" aria-label="صفحات ذات صلة">
          <h2 className="uq-related__title">استكشف أيضاً</h2>
          <div className="uq-related__grid">
            {[
              { href: "/quran/tajweed", label: "علم التجويد" },
              { href: "/quran-hub", label: "مركز القرآن" },
              { href: "/hadith-science", label: "مصطلح الحديث" },
              { href: "/tawhid", label: "التوحيد" },
              { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="uq-related__link">{r.label}</a>
            ))}
          </div>
        </nav>
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="quran" title="اختبر معلوماتك في علوم القرآن" count={4} />
      </div>
    </main>
  );
}
