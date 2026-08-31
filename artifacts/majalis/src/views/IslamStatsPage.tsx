import { useEffect, useState, useMemo } from "react";
import { BarChart3, Globe, Heart, Star, TrendingUp, Users } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import "@/styles/pages/islam-stats.css";

/* ══════════════════════════════════════════════════════════════════
   §241، الإسلام في أرقام  (.is-*)
   ══════════════════════════════════════════════════════════════════ */

type TabId = "global" | "quran" | "history" | "science";

const TABS: { id: TabId; label: string; icon: typeof Globe }[] = [
  { id: "global",  label: "الإسلام في العالم",   icon: Globe },
  { id: "quran",   label: "القرآن الكريم",        icon: Star },
  { id: "history", label: "الحضارة الإسلامية",   icon: TrendingUp },
  { id: "science", label: "الدلالات الكونية",       icon: BarChart3 },
];

interface StatCard {
  value: string;
  label: string;
  sub?: string;
  color?: string;
}

interface BarItem {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}

interface TimelineItem {
  year: string;
  event: string;
  note?: string;
}

interface ScienceCard {
  topic: string;
  ayah: string;
  ref: string;
  discovery: string;
  discoveryYear: string;
}

/* المصادر وتاريخ آخر تحقق موثّقة مركزياً في: src/data/external-data-sources.json
   لا يُضاف هنا أي رقم بلا مصدر معلن داخل نص البطاقة نفسها. */
const GLOBAL_STATS: StatCard[] = [
  { value: "٢ مليار", label: "مسلم في العالم", sub: "٢٦٪ من سكان الأرض — مركز بيو، بيانات ٢٠٢٠م", color: "var(--mj-brand-deep)" },
  { value: "٢١٪", label: "نمو عدد المسلمين", sub: "بين ٢٠١٠م و٢٠٢٠م، أسرع نمو بين الديانات — مركز بيو", color: "#1a5a7a" },
  { value: "٤٩", label: "دولة ذات أغلبية مسلمة", sub: "من أصل نحو ١٩٥ دولة — تقدير مركز بيو", color: "var(--mj-brand)" },
  { value: "٦٥٪", label: "من مسلمي العالم في ١٠ دول", sub: "نحو ١.٣ مليار مسلم — مركز بيو، بيانات ٢٠٢٠م", color: "#312E81" },
  { value: "٣٦٩ مليون", label: "مسلم في أفريقيا جنوب الصحراء", sub: "٣٣٪ من سكان المنطقة، و١٨٪ من مسلمي العالم — مركز بيو ٢٠٢٠م", color: "var(--mj-brand)" },
  { value: "١٬٧٠٧٬٣٠١", label: "حاج في موسم ١٤٤٧هـ", sub: "الهيئة العامة للإحصاء السعودية — رقم رسمي مُعلن", color: "#9B1C1C" },
  { value: "٤٦ مليون", label: "مسلم في أوروبا", sub: "نحو ٦٪ من سكان القارة — مركز بيو، بيانات ٢٠٢٠م", color: "#312E81" },
  { value: "٥.٩ مليون", label: "مسلم في أمريكا الشمالية", sub: "الولايات المتحدة وكندا — مركز بيو، بيانات ٢٠٢٠م", color: "var(--mj-brand)" },
  { value: "٣.٨٨ تريليون$", label: "أصول التمويل الإسلامي", sub: "بنهاية ٢٠٢٤م بنمو ١٤.٩٪ — مجلس الخدمات المالية الإسلامية (IFSB)", color: "#9B1C1C" },
  { value: "١٧٪", label: "نمو الصيرفة الإسلامية", sub: "في سنة واحدة (٢٠٢٤م) — تقرير الاستقرار المالي الإسلامي ٢٠٢٥", color: "var(--mj-brand-deep)" },
  { value: "٨٥٩ م", label: "أقدم جامعة عاملة في العالم", sub: "القرويين في فاس — مسجَّلة لدى اليونسكو وموسوعة غينيس", color: "var(--mj-brand)" },
  { value: "١٢", label: "شهراً في التقويم الهجري", sub: "منها أربعة حُرُم، وأُرّخ التقويم بالهجرة في عهد عمر رضي الله عنه", color: "#1a5a7a" },
];

/* أعداد المسلمين لا إجمالي السكان. المصدر المعتمد: مركز بيو (بيانات ٢٠٢٠م، نُشرت يونيو ٢٠٢٥م)
   لما توفّر لديه رقم صريح، وإلا فأحدث تقدير منشور في جداول الإسلام حسب البلد. */
const POPULATION_BARS: BarItem[] = [
  { label: "إندونيسيا", value: 240, max: 270, unit: "م", color: "var(--mj-brand-deep)" },
  { label: "باكستان",   value: 233, max: 270, unit: "م", color: "#1a5a7a" },
  { label: "الهند",     value: 213, max: 270, unit: "م", color: "var(--mj-brand)" },
  { label: "بنغلاديش",  value: 151, max: 270, unit: "م", color: "#312E81" },
  { label: "نيجيريا",   value: 96,  max: 270, unit: "م", color: "var(--mj-brand)" },
  { label: "مصر",       value: 87,  max: 270, unit: "م", color: "#9B1C1C" },
  { label: "إيران",      value: 86,  max: 270, unit: "م", color: "var(--mj-brand-deep)" },
  { label: "تركيا",     value: 75,  max: 270, unit: "م", color: "#1E3A5F" },
  { label: "الجزائر",   value: 44,  max: 270, unit: "م", color: "var(--mj-brand)" },
  { label: "المغرب",    value: 36,  max: 270, unit: "م", color: "#1a5a7a" },
  { label: "السودان",   value: 35,  max: 270, unit: "م", color: "var(--mj-brand-deep)" },
  { label: "إثيوبيا",   value: 35,  max: 270, unit: "م", color: "#312E81" },
  { label: "السعودية",  value: 33,  max: 270, unit: "م", color: "var(--mj-brand)" },
  { label: "أوزبكستان", value: 29,  max: 270, unit: "م", color: "#1a5a7a" },
  { label: "الكويت",    value: 2,   max: 270, unit: "م", color: "#312E81" },
];

const QURAN_STATS: StatCard[] = [
  { value: "١١٤",  label: "سورة",        sub: "منها ٨٦ مكية و٢٨ مدنية", color: "var(--mj-brand-deep)" },
  { value: "٦٢٣٦", label: "آية",          sub: "في الرواية الأكثر شيوعاً", color: "#1a5a7a" },
  { value: "٣٠",   label: "جزءاً",        sub: "قسمة اصطلاحية للتلاوة والمراجعة لا توقيفية", color: "var(--mj-brand)" },
  { value: "٧٧٤٣٩", label: "كلمة",       sub: "على أشهر أعداد العادّين، والعدّ فيه اختلاف يسير", color: "#312E81" },
  { value: "٣٢٣٠١٥", label: "حرف",       sub: "فيما نقله السيوطي في الإتقان، ولأهل العدّ أقوال أخرى", color: "var(--mj-brand)" },
  { value: "٢٣",   label: "سنة للنزول",  sub: "بدأ في رمضان سنة ٦١٠م تقريباً", color: "#9B1C1C" },
  { value: "٤",    label: "جمعوا القرآن على عهده ﷺ", sub: "أبيّ بن كعب، ومعاذ، وزيد بن ثابت، وأبو زيد رضي الله عنهم — رواه البخاري", color: "var(--mj-brand-deep)" },
  { value: "١",    label: "مصدر أول للتشريع", sub: "ثم السنة النبوية المبيّنة له", color: "#1E3A5F" },
  { value: "٧",    label: "أحرف أُنزل عليها", sub: "الأحرف السبعة غير القراءات؛ والقراءات المتواترة عشر", color: "var(--mj-brand-deep)" },
  { value: "١٠",   label: "قراءات متواترة", sub: "رواها العشرة، وأشهرها اليوم رواية حفص عن عاصم", color: "var(--mj-brand)" },
  { value: "٧٨", label: "لغة تُرجمت إليها معاني القرآن", sub: "ترجمات صادرة عن مجمع الملك فهد لطباعة المصحف الشريف", color: "#312E81" },
  { value: "٦٠", label: "حزباً", sub: "كل حزب أربعة أرباع، والمجموع ٢٤٠ ربعاً", color: "var(--mj-brand)" },
  { value: "٢٥",   label: "نبياً مذكوراً باسمه", sub: "أكثرهم ذكراً موسى رضي الله عنه في نحو ١٣٦ موضعاً", color: "#1a5a7a" },
  { value: "١٥",   label: "سجدة تلاوة", sub: "موزَّعة على ١٤ سورة وفق قول الجمهور", color: "var(--mj-brand-deep)" },
  { value: "٢٩",   label: "سورة بحروف مقطعة", sub: "مثل الم وحم وطس — والحروف المقطعة ١٤ حرفاً", color: "#312E81" },
  { value: "٣",    label: "مراحل للجمع والتدوين", sub: "عهد النبي ﷺ ثم أبي بكر ثم عثمان رضي الله عنهم", color: "var(--mj-brand)" },
];

const HISTORY_TIMELINE: TimelineItem[] = [
  { year: "٦١٠ م", event: "بدء نزول الوحي على النبي محمد ﷺ في غار حراء" },
  { year: "٦٢٢ م", event: "الهجرة النبوية، بداية التقويم الهجري" },
  { year: "٦٣٢ م", event: "وفاة النبي ﷺ وبدء جمع القرآن في مصحف في عهد أبي بكر" },
  { year: "٧٥٠ م", event: "قيام الدولة العباسية وانتقال مركز الحضارة الإسلامية إلى بغداد" },
  { year: "٨٣٠ م", event: "تأسيس بيت الحكمة في بغداد، عصر الترجمة والعلم" },
  { year: "١٠٠٠ م", event: "ابن سينا يؤلف القانون في الطب، مرجع الطب لـ ٦٠٠ سنة" },
  { year: "١٢٥٨ م", event: "سقوط بغداد، وبقاء القرآن محفوظاً في الصدور" },
  { year: "١٤٥٣ م", event: "فتح القسطنطينية على يد محمد الفاتح" },
  { year: "١٦٠٠ م", event: "انتشار الإسلام في جنوب آسيا وأفريقيا جنوب الصحراء", note: "عبر التجارة والدعوة السلمية" },
  { year: "١٩٢٤ م", event: "سقوط الخلافة العثمانية وبداية مرحلة النهضة الإسلامية الجديدة" },
  { year: "١٩٦٩ م", event: "تأسيس منظمة المؤتمر الإسلامي (منظمة التعاون الإسلامي اليوم)", note: "أكبر تكتل إسلامي دولي، ومقرها جدة" },
  { year: "٢٠٢٠ م", event: "بلوغ عدد المسلمين ٢ مليار نسمة، نحو ربع سكان الأرض", note: "مركز بيو للأبحاث — نُشر يونيو ٢٠٢٥م" },
  { year: "٢٠١٠–٢٠٢٠ م", event: "الإسلام أسرع الديانات نمواً في العالم بزيادة ٢١٪ في عقد واحد", note: "وفق مركز بيو للأبحاث" },
  { year: "٥٧٠ م", event: "ولادة النبي محمد ﷺ في مكة المكرمة عام الفيل", note: "على المشهور، وقيل ٥٧١م" },
  { year: "٦٣٧ م", event: "فتح بيت المقدس على يد عمر بن الخطاب بعهد أمان تاريخي للأديان" },
  { year: "١٠١ هـ / ٧٢٠ م", event: "التدوين الرسمي للسنة بأمر عمر بن عبدالعزيز، ونشأة منهج الجرح والتعديل" },
  { year: "٩٠٠ م", event: "ذروة الحضارة العباسية وسيادة بغداد كأكبر مدن العالم آنذاك" },
  { year: "١١٨٧ م", event: "تحرير القدس على يد صلاح الدين الأيوبي بعد ٨٨ عاماً من الاحتلال" },
  { year: "١٣٥٠ م", event: "ابن بطوطة يُتمّ رحلته التي تجاوزت ١٢٠٠٠٠ كم، أوسع رحلة في التاريخ القديم" },
  { year: "١٥١٧ م", event: "الدولة العثمانية تحتضن الخلافة الإسلامية وتسيطر على معظم العالم العربي" },
  { year: "٧١١ م", event: "فتح الأندلس على يد طارق بن زياد، بداية ثمانية قرون من الحضارة الإسلامية في أوروبا" },
  { year: "٧٦٢ م", event: "تأسيس بغداد على يد الخليفة المنصور، لتصبح عاصمة العالم وقاعدة الحضارة العباسية" },
  { year: "١٤٩٢ م", event: "سقوط غرناطة ونهاية الحضارة الأندلسية في أوروبا بعد ثمانية قرون من التألق الحضاري" },
];

const HISTORY_ACHIEVEMENTS: StatCard[] = [
  { value: "٩٨٠–١٠٣٧ م", label: "ابن سينا — صاحب القانون", sub: "نُسبت إليه مئات المصنفات في الطب والفلسفة والفلك", color: "var(--mj-brand-deep)" },
  { value: "٦٠٠ سنة", label: "القانون مرجعاً طبياً", sub: "ظل يُدرَّس في جامعات أوروبا حتى القرن السابع عشر", color: "#312E81" },
  { value: "٨٢٠ م", label: "جبر الخوارزمي", sub: "مؤسس علم الجبر، ومن اسمه اشتُقت كلمة الخوارزمية", color: "var(--mj-brand)" },
  { value: "مئات", label: "الألفاظ العربية في الإنجليزية", sub: "مثل: الجبر، الكحول، القهوة، السكر، القطن", color: "var(--mj-brand)" },
  { value: "٨٠٥ م", label: "أول بيمارستان في بغداد", sub: "أُنشئ في عهد هارون الرشيد على نمط البيمارستانات المنظَّمة", color: "#1E3A5F" },
  { value: "١٠٥٨–١١١١ م", label: "الإمام الغزالي", sub: "صاحب «إحياء علوم الدين» — جمع بين الفقه والتزكية", color: "var(--mj-brand-deep)" },
  { value: "٨٢٨ م", label: "مرصد الشمّاسية ببغداد", sub: "من أوائل المراصد الفلكية المنظَّمة، في عهد المأمون", color: "#1a5a7a" },
  { value: "عشرات", label: "النجوم بأسماء عربية معتمدة دولياً", sub: "مثل: الدبران (Aldebaran)، وآخر النهر (Achernar)، والنسر الواقع (Vega)", color: "#312E81" },
  { value: "آلاف", label: "الألفاظ العربية في الإسبانية", sub: "إرث الحضارة الأندلسية في اللغة الإسبانية الحديثة", color: "var(--mj-brand)" },
  { value: "٩٦٥-١٠٤٠ م", label: "ابن الهيثم — أبو علم البصريات", sub: "أسس نظرية البصر الحديثة وكتب 'المناظر' المرجع الأوروبي لـ500 عام", color: "#1E3A5F" },
  { value: "١٢٠٠+", label: "نبات عشبي موثَّق طبياً", sub: "وثَّق ابن البيطار الأندلسي نحو 1400 دواء وعقار في موسوعته النباتية", color: "var(--mj-brand)" },
  { value: "٨٥٩ م", label: "القرويين — أقدم جامعة في العالم", sub: "تأسست في فاس بالمغرب على يد فاطمة الفهرية، لا تزال تعمل حتى اليوم", color: "var(--mj-brand-deep)" },
];

const SCIENCE_CARDS: ScienceCard[] = [
  {
    topic: "توسّع الكون",
    ayah: "وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ",
    ref: "سورة الذاريات: ٤٧",
    discovery: "اكتشاف توسع الكون على يد إدوين هابل",
    discoveryYear: "١٩٢٩ م",
  },
  {
    topic: "الحاجز بين البحرين",
    ayah: "مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ، بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ",
    ref: "سورة الرحمن: ١٩-٢٠",
    discovery: "اكتشاف علم أوقيانوغرافيا الحاجز المائي بين البحار",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "دورة الماء في الطبيعة",
    ayah: "أَلَمْ تَرَ أَنَّ اللَّهَ يُزْجِي سَحَابًا ثُمَّ يُؤَلِّفُ بَيْنَهُ ثُمَّ يَجْعَلُهُ رُكَامًا فَتَرَى الْوَدْقَ يَخْرُجُ مِنْ خِلَالِهِ",
    ref: "سورة النور: ٤٣",
    discovery: "الفهم العلمي الكامل لدورة الماء وتكوّن السحب",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "مراحل خلق الإنسان",
    ayah: "وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن سُلَالَةٍ مِّن طِينٍ، ثُمَّ جَعَلْنَاهُ نُطْفَةً فِي قَرَارٍ مَّكِينٍ",
    ref: "سورة المؤمنون: ١٢-١٣",
    discovery: "علم الأجنة الحديث وتفاصيل مراحل تطور الجنين",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "حرارة الشمس وضوءها",
    ayah: "وَجَعَلَ الشَّمْسَ سِرَاجًا",
    ref: "سورة نوح: ١٦",
    discovery: "الفرق بين الجرم الضوئي (سراج) والجرم العاكس (نور للقمر)",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "دقة خلق البنان",
    ayah: "بَلَىٰ قَادِرِينَ عَلَىٰ أَن نُّسَوِّيَ بَنَانَهُ",
    ref: "سورة القيامة: ٤",
    discovery: "دقة تكوين أطراف الأصابع التي يعيدها الله يوم البعث",
    discoveryYear: "١٨٨٠ م",
  },
  {
    topic: "الحديد من خارج الأرض",
    ayah: "وَأَنزَلْنَا الْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ",
    ref: "سورة الحديد: ٢٥",
    discovery: "اكتشاف العلم أن الحديد نشأ في نجوم أخرى ووصل الأرض بالنيازك",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "ضغط الأعماق والظلام",
    ayah: "أَوْ كَظُلُمَاتٍ فِي بَحْرٍ لُّجِّيٍّ يَغْشَاهُ مَوْجٌ مِّن فَوْقِهِ مَوْجٌ مِّن فَوْقِهِ سَحَابٌ",
    ref: "سورة النور: ٤٠",
    discovery: "رصد طبقات الأمواج الداخلية والظلام المطبق في أعماق البحار",
    discoveryYear: "١٩٥٠ م",
  },
  {
    topic: "تكوين الكون من الدخان",
    ayah: "ثُمَّ اسْتَوَىٰ إِلَى السَّمَاءِ وَهِيَ دُخَانٌ",
    ref: "سورة فصلت: ١١",
    discovery: "نظرية الانفجار العظيم وأن الكون كان في بدايته سحابة غازية كثيفة",
    discoveryYear: "١٩٤٨ م",
  },
  {
    topic: "الأزواج في كل شيء",
    ayah: "وَمِن كُلِّ شَيْءٍ خَلَقْنَا زَوْجَيْنِ لَعَلَّكُمْ تَذَكَّرُونَ",
    ref: "سورة الذاريات: ٤٩",
    discovery: "اكتشاف علم المادة ومضاد المادة، والأزواج في عالم الجسيمات الدون-ذرية",
    discoveryYear: "١٩٣٢ م",
  },
  {
    topic: "الأجرام تسبح في فلك",
    ayah: "كُلٌّ فِي فَلَكٍ يَسْبَحُونَ",
    ref: "سورة يس: ٤٠",
    discovery: "فهم انتظام حركة الأجرام السماوية في أفلاك ومسارات محسوبة",
    discoveryYear: "١٦٠٩ م (كبلر)",
  },
  {
    topic: "الجبال كالأوتاد وجذور القشرة",
    ayah: "وَالْجِبَالَ أَوْتَادًا",
    ref: "سورة النبأ: ٧",
    discovery: "اكتشاف علم الجيولوجيا أن للجبال جذوراً عميقة تستقر بها القشرة الأرضية كما يُثبت الوتد الخيمة",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الماء أصل كل حياة",
    ayah: "وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ",
    ref: "سورة الأنبياء: ٣٠",
    discovery: "إثبات علم الأحياء أن الخلية الحية تتألف أساساً من الماء وأن الحياة لا تقوم بدونه",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الرياح الملقِّحة للنبات",
    ayah: "وَأَرْسَلْنَا الرِّيَاحَ لَوَاقِحَ",
    ref: "سورة الحجر: ٢٢",
    discovery: "إثبات علم النبات أن الرياح تنقل حبوب اللقاح وتُلقِّح أجيالاً واسعة من النباتات",
    discoveryYear: "القرن الثامن عشر",
  },
  {
    topic: "الجلد والإحساس بالألم",
    ayah: "كُلَّمَا نَضِجَتْ جُلُودُهُم بَدَّلْنَاهُمْ جُلُودًا غَيْرَهَا لِيَذُوقُوا الْعَذَابَ",
    ref: "سورة النساء: ٥٦",
    discovery: "اكتشاف علم التشريح أن مستقبلات الألم تتمركز في طبقات الجلد وليس العضلات أو العظام",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الجنين في الظلمات الثلاث",
    ayah: "يَخْلُقُكُمْ فِي بُطُونِ أُمَّهَاتِكُمْ خَلْقًا مِّن بَعْدِ خَلْقٍ فِي ظُلُمَاتٍ ثَلَاثٍ",
    ref: "سورة الزمر: ٦",
    discovery: "يذكر المفسرون الظلمات الثلاث في بطن الأم والرحم والمشيمة أو الأغشية المحيطة بالجنين",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الدماغ ناصية الكاذب",
    ayah: "نَاصِيَةٍ كَاذِبَةٍ خَاطِئَةٍ",
    ref: "سورة العلق: ١٦",
    discovery: "أثبت علم الأعصاب أن الفص الجبهي في أعلى مقدمة الرأس هو مركز التحكم في السلوك والصدق والكذب",
    discoveryYear: "القرن العشرون",
  },
];

function AnimatedBar({ item, delay }: { item: BarItem; delay: number }) {
  const [width, setWidth] = useState(0);
  const pct = (item.value / item.max) * 100;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="is-bar">
      <div className="is-bar__label">{item.label}</div>
      <div className="is-bar__track">
        <div
          className="is-bar__fill"
          style={{ "--is-bar-w": `${width}%`, "--is-bar-color": item.color } as { [k: string]: string }}
        />
      </div>
      <div className="is-bar__val">{item.value}{item.unit}</div>
    </div>
  );
}

export default function IslamStatsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("global");
  const [search, setSearch] = useState("");

  const filteredTimeline = useMemo(() =>
    search.trim() ? HISTORY_TIMELINE.filter(i => arabicMatchAny([i.year, i.event, i.note ?? ""], search)) : HISTORY_TIMELINE,
  [search]);
  const filteredAchievements = useMemo(() =>
    search.trim() ? HISTORY_ACHIEVEMENTS.filter(s => arabicMatchAny([s.value, s.label, s.sub ?? ""], search)) : HISTORY_ACHIEVEMENTS,
  [search]);
  const filteredScience = useMemo(() =>
    search.trim() ? SCIENCE_CARDS.filter(c => arabicMatchAny([c.topic, c.ref, c.discovery], search)) : SCIENCE_CARDS,
  [search]);

  useEffect(() => {
    applyPageSeo({
      path: "/islam-stats",
      title: "الإسلام في أرقام | سُنّة",
      description: "إحصاءات وأرقام مثيرة عن الإسلام في العالم: المسلمون، القرآن، الحضارة الإسلامية، والدلالات الكونية. من انتشار الإسلام إلى إعجاز القرآن",
      keywords: ["الإسلام في أرقام", "إحصاءات المسلمين", "الإعجاز القرآني", "الحضارة الإسلامية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "إحصاءات الإسلام في العالم",
          description: "حقائق وإحصاءات موثقة عن الإسلام من انتشاره إلى إعجاز القرآن والحضارة الإسلامية؛ من انتشار الإسلام إلى إعجاز القرآن؛ إحصاءات موثّقة عن",
          numberOfItems: TABS.length,
          itemListElement: TABS.map((tab, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: tab.label,
            url: `https://www.ssunnah.com/islam-stats#${tab.id}`,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="is-page" dir="rtl">
      {/* ══ Hero ══ */}
      <section className="is-hero">
        <div className="is-hero__inner">
          <div className="is-hero__badge">
            <Globe size={13} aria-hidden="true" />
            <span>إنفوجرافيك تفاعلي</span>
          </div>
          <h1 className="is-hero__title">الإسلام في أرقام</h1>
          <p className="is-hero__sub">
            حقائق وإحصاءات عن الإسلام مع ذكر مصدر كل رقم وسنته — من انتشاره في العالم إلى القرآن وإسهامات الحضارة الإسلامية
          </p>
          <div className="is-hero__kpis">
            <div className="is-kpi"><Users size={22} aria-hidden="true" /><span>٢ مليار مسلم</span></div>
            <div className="is-kpi"><Star size={22} aria-hidden="true" /><span>٦٢٣٦ آية قرآنية</span></div>
            <div className="is-kpi"><Heart size={22} aria-hidden="true" /><span>١٤٠٠+ سنة حضارة</span></div>
          </div>
        </div>
      </section>

      <div className="is-container">
        {/* ══ التبويبات ══ */}
        <div className="is-tabs" role="tablist" aria-label="تبويبات إحصائيات الإسلام">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`is-tab-${t.id}`}
              type="button"
              role="tab"
              className={`is-tab${activeTab === t.id ? " is-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              aria-selected={activeTab === t.id}
              aria-controls={`is-panel-${t.id}`}
            >
              <t.icon size={15} aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── الإسلام في العالم ── */}
        {activeTab === "global" && (
          <div className="is-section" role="tabpanel" id="is-panel-global" aria-labelledby="is-tab-global">
            <div className="is-stats-grid">
              {GLOBAL_STATS.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>

            <div className="is-section-title">
              <Users size={16} aria-hidden="true" />
              <h2>أكبر الدول الإسلامية سكاناً (مليون نسمة)</h2>
            </div>
            <div className="is-bars">
              {POPULATION_BARS.map((item, i) => (
                <AnimatedBar key={item.label} item={item} delay={i * 80} />
              ))}
            </div>

            <div className="is-note">
              📊 المصدر: مركز بيو للأبحاث، بيانات المشهد الديني العالمي ٢٠٢٠م المنشورة في ٢٠٢٥م
            </div>
          </div>
        )}

        {/* ── القرآن الكريم ── */}
        {activeTab === "quran" && (
          <div className="is-section" role="tabpanel" id="is-panel-quran" aria-labelledby="is-tab-quran">
            <div className="is-quran-highlight">
              <p className="is-quran-highlight__text">
                إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ
              </p>
              <p className="is-quran-highlight__ref">سورة الحجر: ٩</p>
            </div>
            <div className="is-stats-grid">
              {QURAN_STATS.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>
            <div className="is-note">
              📖 الإحصاءات وفق رواية حفص عن عاصم، المعتمدة في معظم البلدان الإسلامية
            </div>
          </div>
        )}

        {/* ── الحضارة الإسلامية ── */}
        {activeTab === "history" && (
          <div className="is-section" role="tabpanel" id="is-panel-history" aria-labelledby="is-tab-history">
            <div className="is-search-wrap">
              <input
                type="search"
                className="ds-input is-search-input"
                placeholder="ابحث في الحضارة الإسلامية..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="بحث في الحضارة الإسلامية"
              />
            </div>
            <div className="is-stats-grid">
              {filteredAchievements.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>

            <div className="is-section-title">
              <TrendingUp size={16} aria-hidden="true" />
              <h2>خط زمني للحضارة الإسلامية</h2>
            </div>
            <div className="is-timeline">
              {filteredTimeline.map((item, i) => (
                <div key={i} className="is-timeline-item">
                  <div className="is-timeline-item__year">{item.year}</div>
                  <div className="is-timeline-item__dot" aria-hidden="true" />
                  <div className="is-timeline-item__content">
                    <p className="is-timeline-item__event">{item.event}</p>
                    {item.note && <p className="is-timeline-item__note">{item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الدلالات الكونية ── */}
        {activeTab === "science" && (
          <div className="is-section" role="tabpanel" id="is-panel-science" aria-labelledby="is-tab-science">
            <div className="is-science-intro">
              <BarChart3 size={20} aria-hidden="true" />
              <p>
                الدلالات الكونية في القرآن الكريم: آيات تحمل دلالات علمية اكتشفها العلم الحديث بعد قرون من نزول القرآن.
              </p>
            </div>
            <div className="is-search-wrap">
              <input
                type="search"
                className="ds-input is-search-input"
                placeholder="ابحث في الدلالات الكونية..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="بحث في الدلالات الكونية"
              />
            </div>
            <div className="is-science-grid">
              {filteredScience.map((card, i) => (
                <div key={i} className="is-science-card">
                  <div className="is-science-card__topic">{card.topic}</div>
                  <p className="is-science-card__ayah" lang="ar">
                    ﴿{card.ayah}﴾
                  </p>
                  <p className="is-science-card__ref">{card.ref}</p>
                  <div className="is-science-card__discovery">
                    <span className="is-science-card__disc-label">الاكتشاف العلمي</span>
                    <span className="is-science-card__disc-text">{card.discovery}</span>
                    <span className="is-science-card__disc-year">{card.discoveryYear}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="is-note">
              ⚠️ تنبيه: الدلالات الكونية يُقدَّم للاستدلال لا للتفسير، التفسير العلمي للقرآن يشترط شروطاً وضوابط علمية صارمة
            </div>
          </div>
        )}
      </div>

      <div className="twh-share">
        <ShareButtons title="الإسلام في أرقام — سُنّة" url="https://www.ssunnah.com/islam-stats" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="islamic-history" title="اختبر معلوماتك في الإسلام والتاريخ" count={4} />
      </div>
    </div>
  );
}
