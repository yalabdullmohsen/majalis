export type YesNoCategory =
  | "العقيدة"
  | "الفقه"
  | "السيرة"
  | "القرآن"
  | "الحديث"
  | "الصحابة"
  | "الأنبياء"
  | "التاريخ الإسلامي"
  | "اللغة العربية";

export type YesNoQuestion = {
  id: string;
  category: YesNoCategory;
  question: string;
  answer: boolean;
  explanation: string;
};

export const YES_NO_CATEGORIES: YesNoCategory[] = [
  "العقيدة",
  "الفقه",
  "السيرة",
  "القرآن",
  "الحديث",
  "الصحابة",
  "الأنبياء",
  "التاريخ الإسلامي",
  "اللغة العربية",
];

export const YES_NO_QUESTIONS: YesNoQuestion[] = [
  { id: "aq-1", category: "العقيدة", question: "الإيمان بالقدر ركن من أركان الإيمان.", answer: true, explanation: "جاء في حديث جبريل عليه السلام أن الإيمان: «أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر وتؤمن بالقدر خيره وشره»." },
  { id: "aq-2", category: "العقيدة", question: "يجوز للمسلم أن يطلب الشفاعة من الأموات.", answer: false, explanation: "الشفاعة الحقيقية لله تعالى، وما جاز من شفاعة النبي ﷺ وغيره فبإذن الله وبعد استئذانه." },
  { id: "fq-1", category: "الفقه", question: "الوتر سنة مؤكدة في رمضان وغيره.", answer: true, explanation: "الوتر سنة مؤكدة، وفي رمضان له أجر أعظم لكنه ليس واجباً." },
  { id: "fq-2", category: "الفقه", question: "يجوز للمسافر أن يقصر الصلاة الرباعية في السفر الطويل.", answer: true, explanation: "القصر للمسافر في الصلاة الرباعية رخصة ثابتة في السنة." },
  { id: "sr-1", category: "السيرة", question: "هاجر النبي ﷺ من مكة إلى المدينة.", answer: true, explanation: "الهجرة النبوية من مكة إلى يثرب (المدينة) في عام 622م." },
  { id: "sr-2", category: "السيرة", question: "ولد النبي ﷺ في المدينة المنورة.", answer: false, explanation: "ولد النبي ﷺ في مكة المكرمة عام الفيل." },
  { id: "qr-1", category: "القرآن", question: "سورة الإخلاص تعدل ثلث القرآن.", answer: true, explanation: "ثبت في الصحيحين أنها تعدل ثلث القرآن من جهة المعنى والأجر." },
  { id: "qr-2", category: "القرآن", question: "عدد سور القرآن 113 سورة.", answer: false, explanation: "عدد سور القرآن 114 سورة." },
  { id: "hd-1", category: "الحديث", question: "الحديث القدسي هو كلام الله بلفظ النبي ﷺ.", answer: true, explanation: "الحديث القدسي: كلام الله تعالى بألفاظ النبي ﷺ، بخلاف القرآن." },
  { id: "hd-2", category: "الحديث", question: "كل ما يروى عن النبي ﷺ يعد صحيحاً.", answer: false, explanation: "الأحاديث تختلف درجاتها: صحيح، حسن، ضعيف، وموضوع." },
  { id: "sb-1", category: "الصحابة", question: "أبو بكر الصديق رضي الله عنه أول الخلفاء الراشدين.", answer: true, explanation: "بايع المسلمون أبا بكر رضي الله عنه بعد وفاة النبي ﷺ." },
  { id: "sb-2", category: "الصحابة", question: "عمر بن الخطاب رضي الله عنه كان أول من أسلم.", answer: false, explanation: "أول من أسلم: خديجة، ثم علي، ثم أبو بكر، ثم زيد، ثم أبو عبيدة..." },
  { id: "an-1", category: "الأنبياء", question: "موسى عليه السلام كليم الله.", answer: true, explanation: "لقّب موسى عليه السلام بكليم الله في القرآن والسنة." },
  { id: "an-2", category: "الأنبياء", question: "نوح عليه السلام أول رسول.", answer: false, explanation: "أول الأنبياء آدم عليه السلام، ونوح أول رسول بعث إلى قومه." },
  { id: "hi-1", category: "التاريخ الإسلامي", question: "وقعت معركة بدر في السنة الثانية للهجرة.", answer: true, explanation: "غزوة بدر في 17 رمضان سنة 2 هـ." },
  { id: "hi-2", category: "التاريخ الإسلامي", question: "فتح مكة كان في السنة الثامنة للهجرة.", answer: true, explanation: "فتح مكة في رمضان سنة 8 هـ." },
  { id: "lg-1", category: "اللغة العربية", question: "«الفاعل» في «كتب الطالب الدرس» هو «الطالب».", answer: true, explanation: "الطالب فاعل مرفوع في جملة «كتب الطالب الدرس»." },
  { id: "lg-2", category: "اللغة العربية", question: "«ال» التعريف تُلحق بالأسماء فقط.", answer: false, explanation: "«ال» تُلحق بالأسماء والصفات المشبهة بها في بعض الحالات." },
  { id: "aq-3", category: "العقيدة", question: "التوحيد ثلاثة أنواع: ربوبية وألوهية وأسماء وصفات.", answer: true, explanation: "هذا التقسيم المعروف عند أهل السنة والجماعة." },
  { id: "fq-3", category: "الفقه", question: "الزكاة واجبة في الذهب إذا بلغ النصاب.", answer: true, explanation: "الزكاة في الذهب والفضة والأموال النامية واجبة عند بلوغ النصاب وحولان الحول." },
  { id: "qr-3", category: "القرآن", question: "أطول سورة في القرآن سورة البقرة.", answer: true, explanation: "سورة البقرة 286 آية." },
  { id: "hd-3", category: "الحديث", question: "صحيح البخاري من أصح كتب الحديث.", answer: true, explanation: "صحيح البخاري يُعد أصح كتاب بعد كتاب الله عند جمهور أهل العلم." },
  { id: "sb-3", category: "الصحابة", question: "خالد بن الوليد رضي الله عنه لقّب بسيف الله.", answer: true, explanation: "سماه النبي ﷺ سيف الله المسلول." },
  { id: "sr-3", category: "السيرة", question: "غزوة الخندق وُقعت في السنة الخامسة للهجرة.", answer: true, explanation: "غزوة الأحزاب (الخندق) في شawwal سنة 5 هـ." },
  { id: "an-3", category: "الأنبياء", question: "عيسى عليه السلام ولد بغير أب.", answer: true, explanation: "خلقه الله من غير أب كآية ومعجزة." },
  { id: "hi-3", category: "التاريخ الإسلامي", question: "تأسيس الدولة العباسية كان في القرن الثامن الميلادي.", answer: true, explanation: "تأسست الدولة العباسية عام 132 هـ / 750م تقريباً." },
  { id: "lg-3", category: "اللغة العربية", question: "جمع «كتاب» جمع تكسير «كتب».", answer: true, explanation: "كتب جمع كتاب على وزن فعل." },
];

export function filterYesNoQuestions(
  category: YesNoCategory | "all",
  search: string,
): YesNoQuestion[] {
  const q = search.trim().toLowerCase();
  return YES_NO_QUESTIONS.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return (
      item.question.includes(search.trim()) ||
      item.explanation.includes(search.trim()) ||
      item.category.includes(search.trim())
    );
  });
}

export function pickRandomYesNo(excludeId?: string): YesNoQuestion | null {
  const pool = YES_NO_QUESTIONS.filter((q) => q.id !== excludeId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
