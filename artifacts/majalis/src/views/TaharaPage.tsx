import { useEffect, useState, useMemo } from "react";
import { applyPageSeo } from "../lib/seo";
import "@/styles/pages/tahara.css";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionIcon } from "@/components/ui/SectionIcon";


type TaharaTab = "wudu" | "ghusl" | "tayammum" | "najasat";

/* ── Wudu ── */
const WUDU_FARDH = [
  { num: "١", icon: "🤲", title: "النية", desc: "نية الوضوء في القلب لرفع الحدث؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي المعتمدة. من فرائض أو سنن", evidence: "«إنما الأعمال بالنيات» — متفق عليه: البخاري 1، مسلم 1907. وذهب الحنفية إلى أنها سنة لا فرض." },
  { num: "٢", icon: "💦", title: "غسل الوجه", desc: "من منابت شعر الرأس إلى الذقن طولاً، ومن أذن إلى أذن عرضاً؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مرا؛ من فرائض أو سنن", evidence: "﴿فَاغْسِلُوا وُجُوهَكُمْ﴾ — المائدة: 6." },
  { num: "٣", icon: "🖐️", title: "غسل اليدين", desc: "مع المرفقين من رؤوس الأصابع إلى المرفقين؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي ال؛ من فرائض أو سنن", evidence: "﴿وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ﴾ — المائدة: 6." },
  { num: "٤", icon: "🧠", title: "مسح الرأس", desc: "مسح كامل الرأس مرة واحدة عند الجمهور؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي المعتم؛ من فرائض أو سنن", evidence: "﴿وَامْسَحُوا بِرُءُوسِكُمْ﴾ — المائدة: 6. واختلفوا في القدر المجزئ: الجمهور على استيعابه، والشافعية على إجزاء بعضه." },
  { num: "٥", icon: "🦶", title: "غسل القدمين", desc: "مع الكعبين من رؤوس الأصابع إلى الكعبين؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي المع؛ من فرائض أو سنن", evidence: "﴿وَأَرْجُلَكُمْ إِلَى الْكَعْبَيْنِ﴾ — المائدة: 6، وقال ﷺ لمن ترك موضعاً في قدمه: «ويلٌ للأعقاب من النار» — متفق عليه." },
  { num: "٦", icon: "⬇️", title: "الترتيب", desc: "الترتيب بين الأعضاء كما جاء في الآية الكريمة؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع مجالس العل؛ من فرائض أو سنن", evidence: "لدلالة ترتيب الأعضاء في آية المائدة: 6، ولفعله ﷺ الذي واظب عليه. وهو فرض عند الشافعية والحنابلة، سنة عند الحنفية والمالكية." },
];

const WUDU_SUNNAH = [
  "التسمية (بسم الله) في أوله",
  "غسل الكفين ثلاثاً في البداية",
  "المضمضة والاستنشاق والاستنثار",
  "تثليث غسل الأعضاء (ثلاث مرات)",
  "البدء باليمين قبل اليسار",
  "التخليل بين الأصابع",
  "مسح الأذنين ظاهراً وباطناً",
  "قول الشهادتين بعد الانتهاء",
  "الموالاة (عدم التفريق بين الأعضاء)",
  "الدعاء بعد الوضوء: أشهد أن لا إله إلا الله وحده لا شريك له، اللهم اجعلني من التوابين",
  "استخدام السواك قبل الوضوء أو عند المضمضة تأسياً بالنبي ﷺ",
  "الابتداء بأعلى الوجه عند غسله ومن رؤوس الأصابع عند غسل اليدين والقدمين",
  "إمرار الإصبع الصغيرة في باطن الأذنين عند مسحهما",
  "إدارة خاتم الإصبع لإيصال الماء تحته إن كان واسعاً",
  "تجديد الوضوء لكل صلاة استحباباً إن كان على وضوء",
  "إتباع الوضوء بصلاة ركعتين: «من توضأ نحو وضوئي ثم صلى ركعتين لا يُحدِّث فيهما نفسه غُفر له ما تقدَّم من ذنبه» — البخاري",
  "تفضيل الاقتصاد في الماء وعدم الإسراف فيه اقتداءً بالنبي ﷺ الذي كان يتوضأ بالمُدّ",
  "المسح على الخفين للمقيم يوماً وليلة وللمسافر ثلاثة أيام ولياليهن بدلاً من غسل القدمين",
];

const WUDU_NAWAQIDH = [
  { icon: "💨", title: "خروج الريح", desc: "من الدبر صوتاً أو بلا صوت؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع المجلس العلمي المعتمدة. — م؛ من أحكام الفقه", evidence: "«لا وضوء إلا من صوتٍ أو ريح» — رواه الترمذي (74) وحسّنه، وأصله في الصحيحين: «لا ينصرف حتى يسمع صوتاً أو يجد ريحاً»." },
  { icon: "🚽", title: "خروج البول أو الغائط", desc: "من القبل أو الدبر؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع المجلس العلمي المعتمدة. — من مراجع؛ من أحكام الفقه", evidence: "﴿أَوْ جَاءَ أَحَدٌ مِّنكُم مِّنَ الْغَائِطِ﴾ — المائدة: 6." },
  { icon: "💤", title: "النوم المستغرق", desc: "النوم الثقيل الذي يزيل الشعور، أما النعاس اليسير فلا ينقض؛ من نواقض الوضوء عند من يرى النقض؛ يُراعى الخلاف الفقهي المعتبر؛ من نواقض الطهارة", evidence: "«العينُ وِكاءُ السَّهِ، فمن نام فليتوضأ» — رواه أبو داود (203) وحسّنه الألباني؛ ولحديث صفوان: «كان يأمرنا ألا ننزع خفافنا... إلا من جنابة، لكن من غائط وبول ونوم» — رواه الترمذي (96) وحسّنه." },
  { icon: "😵", title: "زوال العقل", desc: "الإغماء أو الجنون أو السكر؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع المجلس العلمي المعتمدة. من أحكام الفقه", evidence: "قياساً على النوم من باب أولى، لأنه أذهبُ للشعور منه — وعليه إجماع أهل العلم كما نقله ابن المنذر." },
  { icon: "👄", title: "لمس الفرج", desc: "باليد مباشرة بشهوة أو بلا شهوة عند الجمهور؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجالس ال؛ من أحكام الفقه", evidence: "«من مسّ ذكره فليتوضأ» — رواه الترمذي (82) وصححه؛ وذهب الحنفية إلى عدم النقض لحديث طلق بن علي، والمسألة خلافية معتبرة." },
  { icon: "🔥", title: "أكل لحم الإبل", desc: "عند الحنابلة، وهو قول لبعض أهل العلم بدليل صحيح؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجا؛ من أحكام الفقه", evidence: "سُئل ﷺ: أنتوضأ من لحوم الإبل؟ قال: «نعم» — رواه مسلم (360) من حديث جابر بن سمرة رضي الله عنه. وبه قال أحمد وإسحاق، وخالف الجمهور." },
  { icon: "🩸", title: "الفصد والحجامة وخروج الدم الكثير", desc: "يرى الحنفية والحنابلة أن خروج الدم الكثير من الجرح ينقض الوضوء، ويرى الشافعية والمالكية أنه لا ينقض مطلقاً؛ من نواقض الوضوء عند من يرى" },
  { icon: "🤮", title: "القيء الكثير الملء", desc: "يرى الحنفية أن القيء الكثير ينقض الوضوء لحديث معاوية، ويذهب الجمهور إلى أنه لا ينقض؛ من نواقض الوضوء عند من يرى النقض؛ يُراعى الخلاف الفقهي" },
  { icon: "🩹", title: "لمس الأجنبية عند الشافعية", desc: "يرى الشافعية أن مسَّ المرأة الأجنبية ينقض الوضوء مطلقاً، ويرى المالكية: إن كان بشهوة نقض، وذهب الحنفية والحنابلة إلى أنه لا ينقض إلا" },
];

/* ── Ghusl ── */
const GHUSL_MUJIBAT = [
  { icon: "🌙", title: "الجنابة", desc: "بإنزال المني أو الجماع، وهي أعظم موجبات الغسل؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع مجالس الع؛ من فرائض أو سنن", evidence: "﴿وَإِن كُنتُمْ جُنُبًا فَاطَّهَّرُوا﴾ — المائدة: 6، وقال ﷺ: «إذا جلس بين شعبها الأربع ثم جهدها فقد وجب الغسل» — متفق عليه." },
  { icon: "🌸", title: "انقطاع الحيض", desc: "يجب على المرأة الغسل بعد انقطاع دم الحيض؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي ال؛ من فرائض أو سنن", evidence: "﴿فَإِذَا تَطَهَّرْنَ فَأْتُوهُنَّ مِنْ حَيْثُ أَمَرَكُمُ اللَّهُ﴾ — البقرة: 222، وقال ﷺ لفاطمة بنت أبي حبيش: «فإذا أدبرت فاغتسلي وصلّي» — متفق عليه." },
  { icon: "🤱", title: "انقطاع النفاس", desc: "يجب الغسل بعد انتهاء دم النفاس؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي المعتمدة. من فرائض أو سنن", evidence: "قياساً على الحيض بإجماع أهل العلم، ولأن دم النفاس دم حيضٍ مجتمع." },
  { icon: "☠️", title: "الموت", desc: "يُغسَّل الميت المسلم قبل الصلاة عليه؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع المجلس العلمي ال؛ من أحكام الفقه", evidence: "قال ﷺ في المحرِم الذي وقصته ناقته: «اغسلوه بماءٍ وسِدر» — متفق عليه." },
  { icon: "☪️", title: "الإسلام", desc: "يُستحب الغسل عند الإسلام وإن قيل بوجوبه؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي الم؛ من فرائض أو سنن", evidence: "أمر النبي ﷺ قيس بن عاصم لما أسلم أن يغتسل — رواه الترمذي (605) وحسّنه؛ وذهب الجمهور إلى الاستحباب وبعضهم إلى الوجوب." },
  { icon: "💤", title: "الاحتلام", desc: "إذا استيقظ وأيقن خروج المني وجب الغسل، وإن احتلم ولم يجد بللاً فلا غسل عليه؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل؛ من فرائض" },
  { icon: "🤰", title: "الولادة", desc: "يجب الغسل على المرأة بعد الولادة حتى وإن لم يعقبها دم نفاس عند جمهور العلماء؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل؛ من" },
];

const GHUSL_FARAIDH = [
  { icon: "💭", title: "النية", desc: "نية رفع الجنابة أو الحدث الأكبر؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي المعتمدة. من فرائض أو سنن" },
  { icon: "💧", title: "التعميم بالماء", desc: "إفاضة الماء على جميع البدن حتى يصل إلى كل جزء؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجالس؛ من أحكام الفقه" },
];

const GHUSL_SIFAT = [
  "يبدأ بغسل اليدين والاستنجاء",
  "ثم يتوضأ وضوءاً كاملاً كوضوء الصلاة",
  "يُفيض الماء على رأسه ثلاثاً",
  "ثم يُفيض على شقه الأيمن ثم الأيسر",
  "يدلك بدنه جيداً ويُخلل الشعر",
  "يغسل رجليه إن لم يغسلهما في الوضوء",
  "يتأكد من وصول الماء إلى أصول الشعر والآباط والخلف وسُرَّة البطن",
  "يُستحب استخدام الصابون أو الخِطمي لإزالة الأدران والدهون التي تمنع وصول الماء",
];

/* ── Tayammum ── */
const TAYAMMUM_IBAHA = [
  { icon: "🏜️", title: "عدم الماء", desc: "إذا عُدم الماء أو كان بعيداً لا يصل إليه؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجالس العل؛ من أحكام الفقه" },
  { icon: "🏥", title: "المرض", desc: "إذا خاف أن يضره استعمال الماء بسبب مرض أو برد شديد؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع؛ من أحكام الفقه" },
  { icon: "⏰", title: "ضيق الوقت", desc: "إذا خاف خروج وقت الصلاة لو اشتغل بطلب الماء عند بعض العلماء؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد؛ من أحكام الفقه" },
  { icon: "⚕️", title: "الجرح أو الكسر", desc: "إذا كان في بعض أعضائه جرح أو كسر يضره الماء؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجالس ا؛ من أحكام الفقه" },
  { icon: "❄️", title: "البرد الشديد", desc: "إذا خشي المصلي الضرر من استعمال الماء البارد عند عدم إمكانية تسخينه، يجوز له التيمم عند جمهور العلماء؛ من فرائض أو سنن الطهارة؛ من فرائض أو" },
  { icon: "🚰", title: "الحاجة إلى الماء للشرب", desc: "إذا كان الماء الموجود محتاجاً إليه للشرب أو لعطش حيوان محترم، قُدِّم حق الآدمي أو الحيوان وجاز التيمم للصلاة؛ من أحكام الطهارة المعتمدة؛ من" },
  { icon: "🔒", title: "تعذُّر استعمال الماء بحكم شرعي", desc: "كالمرأة المحرمة التي أصابتها الجنابة وخافت الضرر من برد الماء، أو المريض الذي نهاه الطبيب عن مس الماء؛ من أحكام الطهارة المعتمدة؛ من أحكام" },
];

const TAYAMMUM_KAYFIYYA = [
  { num: "١", step: "النية", desc: "نية التيمم لاستباحة الصلاة؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي المعتمدة. — من م؛ من فرائض أو سنن" },
  { num: "٢", step: "التسمية", desc: "قول بسم الله؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع المجلس العلمي المعتمدة. — من مراجع مجالس؛ من أحكام الفقه" },
  { num: "٣", step: "ضرب الأرض", desc: "ضربة واحدة بباطن الكفين على الصعيد الطاهر؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجالس الع؛ من أحكام الفقه" },
  { num: "٤", step: "المسح على الوجه", desc: "مسح الوجه كاملاً بباطن الكفين؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي المعتمدة. — م؛ من فرائض أو سنن" },
  { num: "٥", step: "مسح اليدين", desc: "مسح ظاهر اليد اليسرى باليمنى والعكس إلى الرسغين؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع مجالس ا؛ من فرائض أو سنن" },
];

/* ── Najasat ── */
const NAJASAT_ITEMS = [
  {
    type: "mughallaza",
    label: "نجاسة مغلظة",
    color: "red",
    items: [
      { icon: "🐶", title: "لعاب الكلب", desc: "يُغسَّل المحل سبع مرات إحداها بالتراب عند الشافعية والحنابلة؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد؛ من أحكام الفقه" },
      { icon: "🐷", title: "الخنزير", desc: "يُحكم بنجاسة ذاته وما يتصل بها من رطوبة؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع المجلس العلمي؛ من أحكام الفقه" },
    ],
  },
  {
    type: "mukhaffafa",
    label: "نجاسة مخففة",
    color: "amber",
    items: [
      { icon: "👶", title: "بول الرضيع الذكر", desc: "يكفي نضحه (رشّه بالماء) دون حاجة لغسل، الذكر الذي لم يأكل الطعام؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل؛ من فرائض أو سنن" },
    ],
  },
  {
    type: "mutawassita",
    label: "النجاسة المعتادة",
    color: "orange",
    items: [
      { icon: "🩸", title: "الدم السائل والقيح", desc: "يُعفى عن يسيره، ويُغسل الكثير منه؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مراجع المجلس العلمي المعتمدة. من فرائض أو سنن" },
      { icon: "🚽", title: "البول والغائط", desc: "من الآدمي وغيره من الحيوانات التي لا يؤكل لحمها؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجا؛ من أحكام الفقه" },
      { icon: "🐄", title: "ميتة الحيوانات", desc: "ما عدا السمك والجراد والشهيد في سبيل الله؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجالس الع؛ من أحكام الفقه" },
      { icon: "🍺", title: "الخمر السائل", desc: "نجس عند الجمهور، ويطهر بتخليله إلى خل؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع المجلس العلمي ا؛ من أحكام الفقه" },
      { icon: "💦", title: "المذي والودي", desc: "المذي: ماء رقيق أبيض يخرج عند الشهوة، والودي: ماء أبيض ثخين بعد البول، كلاهما نجس يوجب الوضوء لا الغسل؛ من فرائض أو سنن الطهارة؛ من فرائض" },
      { icon: "🐾", title: "روث ما لا يؤكل وبوله", desc: "بول وروث الحيوان الذي لا يؤكل لحمه نجس عند الجمهور كالحمار والبغل والقطط، وما يؤكل لحمه فيه خلاف مشهور؛ من أحكام الطهارة المعتمدة؛ من أحكام" },
    ],
  },
];

const TABS: { id: TaharaTab; label: string; icon: string }[] = [
  { id: "wudu", label: "الوضوء", icon: "💧" },
  { id: "ghusl", label: "الغسل", icon: "🚿" },
  { id: "tayammum", label: "التيمم", icon: "🏜️" },
  { id: "najasat", label: "النجاسات", icon: "⚠️" },
];

export default function TaharaPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/tahara",
      title: "الطهارة وأحكامها، المجلس العلمي",
      description: "دليل شامل لأحكام الطهارة: الوضوء والغسل والتيمم وأنواع المياه والنجاسات؛ محتوى معتمد في المجلس العلمي؛ يُستفاد منه في التعلم والتدبر؛ من",
      keywords: ["الطهارة", "الوضوء", "الغسل", "التيمم", "أحكام الطهارة", "الفقه"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "فرائض الوضوء",
          description: "فرائض الوضوء الستة مع الأدلة والأحكام؛ محتوى معتمد في المجلس العلمي؛ يُستفاد منه في التعلم والتدبر — من مراجع المجلس العلمي؛ من فرائض أو سنن",
          numberOfItems: WUDU_FARDH.length,
          itemListElement: WUDU_FARDH.map((w, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${w.num}: ${w.title} — ${w.desc}`,
            url: `https://www.majlisilm.com/tahara#wudu-fardh-${i + 1}`,
          })),
        },
      ],
    });
  }, []);

  const [tab, setTab] = useState<TaharaTab>("wudu");
  const [search, setSearch] = useState("");
  const filteredWuduNawaqidh = useMemo(() =>
    search.trim() ? WUDU_NAWAQIDH.filter(n => arabicMatchAny([n.title, n.desc], search)) : WUDU_NAWAQIDH,
  [search]);
  const filteredGhusulMujibat = useMemo(() =>
    search.trim() ? GHUSL_MUJIBAT.filter(m => arabicMatchAny([m.title, m.desc], search)) : GHUSL_MUJIBAT,
  [search]);
  const filteredTayammumIbaha = useMemo(() =>
    search.trim() ? TAYAMMUM_IBAHA.filter(i => arabicMatchAny([i.title, i.desc], search)) : TAYAMMUM_IBAHA,
  [search]);
  const filteredNajasat = useMemo(() => {
    if (!search.trim()) return NAJASAT_ITEMS;
    return NAJASAT_ITEMS
      .map(g => ({ ...g, items: g.items.filter(i => arabicMatchAny([i.title, i.desc], search)) }))
      .filter(g => g.items.length > 0);
  }, [search]);

  return (
    <main className="th-page" dir="rtl">
      {/* hero */}
      <section className="th-hero">
        <div className="th-hero__badge">الفقه والعبادة</div>
        <div className="th-hero__emoji">💧</div>
        <h1 className="th-hero__title">الطهارة وأحكامها</h1>
        <p className="th-hero__sub">
          الطهارة مفتاح الصلاة، دليل شامل للوضوء والغسل والتيمم والنجاسات
        </p>

        <div className="th-ayah">
          <p className="th-ayah__text">
            إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ
          </p>
          <cite className="th-ayah__ref">البقرة: 222</cite>
        </div>

        <div className="th-tabs" aria-label="أقسام الطهارة" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`thr-tab-${t.id}`}
              type="button"
              role="tab"
              className={`th-tab${tab === t.id ? " th-tab--active" : ""}`}
              onClick={() => setTab(t.id)}
              aria-selected={tab === t.id}
              aria-controls={`thr-panel-${t.id}`}
            >
              <span className="th-tab__icon"><SectionIcon name={t.icon} size={24} /></span>
              <span className="th-tab__label">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="th-body">
        <div className="th-search-wrap">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في أحكام الطهارة..."
            className="page-search-input th-search-input"
            aria-label="بحث في أحكام الطهارة"
          />
        </div>

        {/* ── الوضوء ── */}
        {tab === "wudu" && (
          <section role="tabpanel" id="thr-panel-wudu" aria-labelledby="thr-tab-wudu" className="th-section">
            <h2 className="th-section__title">فرائض الوضوء</h2>
            <p className="th-ayah-note">
              أصل الباب قوله تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا قُمْتُمْ إِلَى الصَّلَاةِ
              فَاغْسِلُوا وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ وَامْسَحُوا بِرُءُوسِكُمْ
              وَأَرْجُلَكُمْ إِلَى الْكَعْبَيْنِ﴾ — سورة المائدة: 6.
            </p>
            <div className="th-fardh-grid">
              {WUDU_FARDH.map((f) => (
                <div key={f.num} className="th-fardh-card">
                  <div className="th-fardh-card__head">
                    <span className="th-fardh-card__num">{f.num}</span>
                    <span className="th-fardh-card__icon"><SectionIcon name={f.icon} size={24} /></span>
                    <strong className="th-fardh-card__title">{f.title}</strong>
                  </div>
                  <p className="th-fardh-card__desc">{f.desc}</p>
                  {"evidence" in f && (
                    <p className="th-fardh-card__evidence">
                      <strong>الدليل:</strong> {(f as { evidence: string }).evidence}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <h2 className="th-section__title">سنن الوضوء</h2>
            <ul className="th-sunnah-list">
              {WUDU_SUNNAH.map((s) => (
                <li key={s} className="th-sunnah-item">{s}</li>
              ))}
            </ul>

            <h2 className="th-section__title">نواقض الوضوء</h2>
            <div className="th-nawaqidh-grid">
              {filteredWuduNawaqidh.map((n) => (
                <div key={n.title} className="th-naqidh-card">
                  <span className="th-naqidh-card__icon"><SectionIcon name={n.icon} size={24} /></span>
                  <div>
                    <strong className="th-naqidh-card__title">{n.title}</strong>
                    <p className="th-naqidh-card__desc">{n.desc}</p>
                    {"evidence" in n && (
                      <p className="th-card__evidence">
                        <strong>الدليل:</strong> {(n as { evidence: string }).evidence}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="th-info-box">
              <span>💡</span>
              <p>
                <strong>الحديث:</strong> «مِفْتَاحُ الصَّلَاةِ الطُّهُورُ، وَتَحْرِيمُهَا التَّكْبِيرُ، وَتَحْلِيلُهَا التَّسْلِيمُ»
                (سنن الترمذي، صحيح)
              </p>
            </div>
          </section>
        )}

        {/* ── الغسل ── */}
        {tab === "ghusl" && (
          <section role="tabpanel" id="thr-panel-ghusl" aria-labelledby="thr-tab-ghusl" className="th-section">
            <h2 className="th-section__title">موجبات الغسل</h2>
            <div className="th-mujibat-grid">
              {filteredGhusulMujibat.map((m) => (
                <div key={m.title} className="th-mujib-card">
                  <span className="th-mujib-card__icon"><SectionIcon name={m.icon} size={24} /></span>
                  <div>
                    <strong className="th-mujib-card__title">{m.title}</strong>
                    <p className="th-mujib-card__desc">{m.desc}</p>
                    {"evidence" in m && (
                      <p className="th-card__evidence">
                        <strong>الدليل:</strong> {(m as { evidence: string }).evidence}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <h2 className="th-section__title">فرائض الغسل</h2>
            <div className="th-faraidh-grid">
              {GHUSL_FARAIDH.map((f) => (
                <div key={f.title} className="th-faridh-card">
                  <span className="th-faridh-card__icon"><SectionIcon name={f.icon} size={24} /></span>
                  <div>
                    <strong className="th-faridh-card__title">{f.title}</strong>
                    <p className="th-faridh-card__desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="th-section__title">صفة الغسل الكامل (المستحب)</h2>
            <ol className="th-steps-list">
              {GHUSL_SIFAT.map((s, i) => (
                <li key={i} className="th-step-item">
                  <span className="th-step-item__num">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>

            <div className="th-info-box">
              <span>💡</span>
              <p>
                <strong>تنبيه:</strong> الغسل الصحيح يكفي بمجرد النية وإفاضة الماء على الجسد كله،
                وما زاد فهو من السنن المستحبة.
              </p>
            </div>
          </section>
        )}

        {/* ── التيمم ── */}
        {tab === "tayammum" && (
          <section role="tabpanel" id="thr-panel-tayammum" aria-labelledby="thr-tab-tayammum" className="th-section">
            <div className="th-ayah th-ayah--body">
              <p className="th-ayah__text">
                وَإِن كُنتُم مَّرْضَىٰ أَوْ عَلَىٰ سَفَرٍ أَوْ جَاءَ أَحَدٌ مِّنكُم مِّنَ الْغَائِطِ
                أَوْ لَامَسْتُمُ النِّسَاءَ فَلَمْ تَجِدُوا مَاءً فَتَيَمَّمُوا صَعِيدًا طَيِّبًا
              </p>
              <cite className="th-ayah__ref">النساء: 43</cite>
            </div>

            <h2 className="th-section__title">مبيحات التيمم</h2>
            <div className="th-ibaha-grid">
              {filteredTayammumIbaha.map((item) => (
                <div key={item.title} className="th-ibaha-card">
                  <span className="th-ibaha-card__icon"><SectionIcon name={item.icon} size={24} /></span>
                  <div>
                    <strong className="th-ibaha-card__title">{item.title}</strong>
                    <p className="th-ibaha-card__desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="th-section__title">كيفية التيمم</h2>
            <div className="th-steps-timeline">
              {TAYAMMUM_KAYFIYYA.map((k) => (
                <div key={k.num} className="th-timeline-step">
                  <div className="th-timeline-step__num">{k.num}</div>
                  <div className="th-timeline-step__content">
                    <strong className="th-timeline-step__title">{k.step}</strong>
                    <p className="th-timeline-step__desc">{k.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="th-info-box th-info-box--mt">
              <span>📌</span>
              <p>
                <strong>نواقض التيمم:</strong> ينتقض التيمم بوجود الماء وبكل ما ينقض الوضوء.
                كما ينتقض بزوال العذر الذي أباح التيمم.
              </p>
            </div>
          </section>
        )}

        {/* ── النجاسات ── */}
        {tab === "najasat" && (
          <section role="tabpanel" id="thr-panel-najasat" aria-labelledby="thr-tab-najasat" className="th-section">
            <p className="th-section__intro">
              النجاسة: كل عين حكم الشارع بنجاستها. إزالتها شرط لصحة الصلاة.
            </p>
            {filteredNajasat.map((group) => (
              <div key={group.type} className="th-naj-group">
                <h2 className={`th-naj-group__title th-naj-group__title--${group.color}`}>
                  {group.label}
                </h2>
                {group.items.map((item) => (
                  <div key={item.title} className="th-naj-card">
                    <span className="th-naj-card__icon"><SectionIcon name={item.icon} size={24} /></span>
                    <div>
                      <strong className="th-naj-card__title">{item.title}</strong>
                      <p className="th-naj-card__desc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <h2 className="th-section__title">أنواع المياه من حيث الطهورية</h2>
            <div className="th-water-grid">
              {[
                { label: "طهور مطهِّر", color: "green", desc: "الماء المطلق: ماء المطر، البحر، الأنهار، الآبار؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع مجا؛ من أحكام الفقه" },
                { label: "طاهر غير مطهِّر", color: "blue", desc: "الماء المستعمل في الوضوء أو الغسل، طاهر لكن لا يرفع الحدث؛ من فرائض أو سنن الطهارة؛ يُعتنى به عند الوضوء والغسل — من مرا؛ من فرائض أو سنن" },
                { label: "ماء نجس", color: "red", desc: "ما وقعت فيه نجاسة وتغير أحد أوصافه (لون، طعم، ريح)؛ من أحكام الطهارة المعتمدة؛ يُراعى الخلاف الفقهي حيث وُجد — من مراجع؛ من أحكام الفقه" },
              ].map((w) => (
                <div key={w.label} className={`th-water-card th-water-card--${w.color}`}>
                  <strong className="th-water-card__label">{w.label}</strong>
                  <p className="th-water-card__desc">{w.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="twh-share">
          <ShareButtons title="الطهارة وأحكامها — المجلس العلمي" url="https://www.majlisilm.com/tahara" />
        </div>

        {/* related */}
        <nav className="th-related" aria-label="مواضيع ذات صلة">
          <h2 className="th-related__title">استكشف أيضاً</h2>
          <div className="th-related__grid">
            {[
              { href: "/sawm", label: "الصيام وأحكامه" },
              { href: "/hajj", label: "الحج والعمرة" },
              { href: "/prayer-times", label: "مواقيت الصلاة" },
              { href: "/adhkar", label: "الأذكار" },
              { href: "/arkan", label: "أركان الإسلام" },
              { href: "/fiqh", label: "الفقه الإسلامي" },
            ].map((r) => (
              <a key={r.href} href={r.href} className="th-related__link">{r.label}</a>
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
