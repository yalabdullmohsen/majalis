import type { SinJeemQuestion } from "./types";

let _id = 0;
const q = (
  partial: Omit<SinJeemQuestion, "id"> & { id?: string },
): SinJeemQuestion => ({
  id: partial.id || `sq-${++_id}`,
  ...partial,
});

/** Offline + fallback question bank */
export const SIN_JEEM_QUESTIONS: SinJeemQuestion[] = [
  // القرآن
  q({ category_slug: "quran", question_type: "multiple_choice", difficulty: "سهل", question: "كم عدد سور القرآن الكريم؟", options: ["114", "113", "115", "112"], correct_index: 0, explanation: "القرآن الكريم يتكون من 114 سورة." }),
  q({ category_slug: "quran", question_type: "multiple_choice", difficulty: "متوسط", question: "ما أطول سورة في القرآن؟", options: ["البقرة", "آل عمران", "النساء", "المائدة"], correct_index: 0 }),
  q({ category_slug: "quran", question_type: "multiple_choice", difficulty: "متوسط", question: "ما أقصر سورة في القرآن؟", options: ["الكوثر", "الإخلاص", "الفلق", "الناس"], correct_index: 0 }),
  q({ category_slug: "quran", question_type: "true_false", difficulty: "سهل", question: "سورة الفاتحة تُسمى أم الكتاب.", options: ["صح", "خطأ"], correct_index: 0 }),
  q({ category_slug: "tafsir", question_type: "multiple_choice", difficulty: "متقدم", question: "من هو مفسر القرآن المشهور صاحب تفسير 'الطبري'؟", options: ["ابن جرير الطبري", "الطبري البغدادي", "ابن كثير", "القرطبي"], correct_index: 0 }),
  q({ category_slug: "asbab-nuzul", question_type: "multiple_choice", difficulty: "متوسط", question: "نزلت سورة الكافرون في أي مناسبة؟", options: ["دعوة قريش للتنازل عن الدين", "غزوة بدر", "الهجرة", "فتح مكة"], correct_index: 0 }),
  q({ category_slug: "maki-madani", question_type: "multiple_choice", difficulty: "سهل", question: "سورة الإخلاص من السور:", options: ["المكية", "المدنية", "مكية ومدنية", "لا يُعرف"], correct_index: 0 }),
  // التجويد
  q({ category_slug: "tajweed", question_type: "multiple_choice", difficulty: "متوسط", question: "كم عدد حروف القلقلة؟", options: ["5", "4", "6", "7"], correct_index: 0, explanation: "قُطب جَد — قاف، طاء، باء، جيم، دال." }),
  q({ category_slug: "tajweed", question_type: "multiple_choice", difficulty: "سهل", question: "المد الطبيعي يكون:", options: ["حركتين", "حركة واحدة", "4 حركات", "6 حركات"], correct_index: 0 }),
  q({ category_slug: "makhraj", question_type: "multiple_choice", difficulty: "متوسط", question: "حرف الغين من:", options: ["أقصى الحلق", "وسط اللسان", "الشفتين", "الأسنان"], correct_index: 0 }),
  q({ category_slug: "qalqala", question_type: "true_false", difficulty: "سهل", question: "القلقلة تكون في الحرف الساكن.", options: ["صح", "خطأ"], correct_index: 0 }),
  // العقيدة
  q({ category_slug: "tawheed", question_type: "multiple_choice", difficulty: "سهل", question: "التوحيد ثلاثة أنواع:", options: ["ربوبية، ألوهية، أسماء وصفات", "ربوبية فقط", "ألوهية وربوبية", "إحسان فقط"], correct_index: 0 }),
  q({ category_slug: "aqeeda", question_type: "multiple_choice", difficulty: "متوسط", question: "من أركان الإيمان؟", options: ["الإيمان بالملائكة", "الإيمان بالقدر فقط", "الصلاة", "الزكاة"], correct_index: 0 }),
  q({ category_slug: "names-attributes", question_type: "true_false", difficulty: "متوسط", question: "يجوز تأويل أسماء الله الحسنى على غير ظاهرها بلا دليل.", options: ["صح", "خطأ"], correct_index: 1 }),
  q({ category_slug: "shirk", question_type: "multiple_choice", difficulty: "سهل", question: "الشرك الأكبر:", options: ["يجعل العبد خارج الملة", "لا يخرج من الملة", "مكفر في الدنيا فقط", "غير مذموم"], correct_index: 0 }),
  // الحديث
  q({ category_slug: "nawawi-40", question_type: "multiple_choice", difficulty: "متوسط", question: "حديث 'إنما الأعمال بالنيات' هو الحديث:", options: ["الأول", "الثاني", "العاشر", "الأربعون"], correct_index: 0 }),
  q({ category_slug: "hadith", question_type: "multiple_choice", difficulty: "سهل", question: "من جامعي صحيح البخاري ومسلم؟", options: ["الإمام البخاري", "الترمذي", "النسائي", "ابن ماجه"], correct_index: 0 }),
  q({ category_slug: "hadith-sciences", question_type: "multiple_choice", difficulty: "متقدم", question: "الحديث المتواتر:", options: ["يرويه جمع كثير imposible تواطؤهم على الكذب", "يرويه راويان", "مرسل", "ضعيف"], correct_index: 0 }),
  q({ category_slug: "bukhari", question_type: "true_false", difficulty: "متوسط", question: "صحيح البخاري هو أصح كتاب بعد القرآن عند أهل السنة.", options: ["صح", "خطأ"], correct_index: 0 }),
  // السيرة
  q({ category_slug: "seera", question_type: "multiple_choice", difficulty: "سهل", question: "ولد النبي ﷺ في عام:", options: ["فيل", "بدر", "الفتح", "الوداع"], correct_index: 0 }),
  q({ category_slug: "hijra", question_type: "multiple_choice", difficulty: "متوسط", question: "الهجرة النبوية كانت من مكة إلى:", options: ["المدينة", "الطائف", "اليمن", "الشام"], correct_index: 0 }),
  q({ category_slug: "ghazwat", question_type: "multiple_choice", difficulty: "متوسط", question: "أولى غزوات النبي ﷺ:", options: ["بدر", "أحد", "الخندق", "حنين"], correct_index: 0 }),
  q({ category_slug: "ghazwat", question_type: "multiple_choice", difficulty: "سهل", question: "غزوة بدر وقعت في السنة:", options: ["الثانية للهجرة", "الأولى", "الثالثة", "الرابعة"], correct_index: 0 }),
  // الأنبياء
  q({ category_slug: "nuh", question_type: "multiple_choice", difficulty: "سهل", question: "لبث نوح عليه السلام في قومه:", options: ["950 سنة", "100 سنة", "500 سنة", "40 سنة"], correct_index: 0 }),
  q({ category_slug: "ibrahim", question_type: "multiple_choice", difficulty: "متوسط", question: "خليل الرحمن هو:", options: ["إبراهيم عليه السلام", "موسى", "عيسى", "نوح"], correct_index: 0 }),
  q({ category_slug: "musa", question_type: "multiple_choice", difficulty: "سهل", question: "كلمه الله:", options: ["موسى عليه السلام", "عيسى", "محمد ﷺ", "إبراهيم"], correct_index: 0 }),
  q({ category_slug: "muhammad", question_type: "multiple_choice", difficulty: "سهل", question: "لقب النبي ﷺ قبل البعثة:", options: ["الصادق الأمين", "الفاروق", "ذو النورين", "أسد الله"], correct_index: 0 }),
  // الصحابة
  q({ category_slug: "khulafa-rashidun", question_type: "multiple_choice", difficulty: "سهل", question: "أول الخلفاء الراشدين:", options: ["أبو بكر الصديق", "عمر", "عثمان", "علي"], correct_index: 0 }),
  q({ category_slug: "ashara-mubashshara", question_type: "multiple_choice", difficulty: "متوسط", question: "من العشرة المبشرين بالجنة؟", options: ["أبو عبيدة بن الجراح", "خالد بن الوليد", "عمرو بن العاص", "معاوية"], correct_index: 0 }),
  q({ category_slug: "sahaba", question_type: "multiple_choice", difficulty: "متوسط", question: "أول من أسلم من الصبيان:", options: ["علي بن أبي طalib", "زيد بن حارثة", "أسامة", "عبد الله بن عمر"], correct_index: 0 }),
  // الفقه
  q({ category_slug: "salah", question_type: "multiple_choice", difficulty: "سهل", question: "عدد ركعات صلاة الظهر:", options: ["4", "2", "3", "5"], correct_index: 0 }),
  q({ category_slug: "salah", question_type: "multiple_choice", difficulty: "متوسط", question: "من شروط صحة الصلاة:", options: ["الطهارة", "النية فقط", "الجماعة", "السجود على الحصير"], correct_index: 0 }),
  q({ category_slug: "tahara", question_type: "multiple_choice", difficulty: "سهل", question: "الوضوء ينقض بـ:", options: ["خروج شيء من السبيلين", "الأكل", "النوم فقط", "الكلام"], correct_index: 0 }),
  q({ category_slug: "zakat", question_type: "multiple_choice", difficulty: "متوسط", question: "نصاب الذهب:", options: ["85 جراماً", "100 جراماً", "50 جراماً", "200 جراماً"], correct_index: 0 }),
  q({ category_slug: "siyam", question_type: "true_false", difficulty: "سهل", question: "صوم رمضان ركن من أركان الإسلام.", options: ["صح", "خطأ"], correct_index: 0 }),
  q({ category_slug: "hajj", question_type: "multiple_choice", difficulty: "متوسط", question: "الوقوف بعرفة في:", options: ["9 ذي الحجة", "10 ذي الحجة", "8 ذي الحجة", "11 ذي الحجة"], correct_index: 0 }),
  q({ category_slug: "fiqh", question_type: "ruling", difficulty: "متوسط", question: "ما حكم أكل لحم الخنزير؟", options: ["حرام", "حلال", "مكروه", "مباح"], correct_index: 0 }),
  // أصول الفقه
  q({ category_slug: "usool-fiqh", question_type: "multiple_choice", difficulty: "متقدم", question: "الإجماع هو:", options: ["اتفاق المجتهدين من أمة محمد ﷺ", "اتفاق العامة", "رأي واحد", "قول الصحابي"], correct_index: 0 }),
  // اللغة
  q({ category_slug: "nahw", question_type: "multiple_choice", difficulty: "متوسط", question: "الفاعل مرفوع:", options: ["دائماً", "منصوب", "مجرور", "مجزوم"], correct_index: 0 }),
  q({ category_slug: "arabic", question_type: "multiple_choice", difficulty: "سهل", question: "جمع كلمة 'كتاب':", options: ["كتب", "كتابات", "كُتُب", "كتابون"], correct_index: 0 }),
  // الأدعية
  q({ category_slug: "morning-adhkar", question_type: "true_false", difficulty: "سهل", question: "قراءة آية الكرسي بعد الصلوات المفروضة سنة.", options: ["صح", "خطأ"], correct_index: 0 }),
  q({ category_slug: "dua", question_type: "multiple_choice", difficulty: "متوسط", question: "دعاء الاستفتاح يُقال:", options: ["في بداية الصلاة", "في السجود", "بعد التسليم", "في الركوع"], correct_index: 0 }),
  // الأخلاق
  q({ category_slug: "akhlaq", question_type: "multiple_choice", difficulty: "سهل", question: "من أعظم الأخلاق:", options: ["بر الوالدين", "الكسل", "الغضب", "البخل"], correct_index: 0 }),
  // التاريخ
  q({ category_slug: "rashidun-state", question_type: "multiple_choice", difficulty: "متوسط", question: "مدة الخلافة الراشدة:", options: ["30 سنة", "40 سنة", "10 سنوات", "100 سنة"], correct_index: 0 }),
  q({ category_slug: "andalus", question_type: "multiple_choice", difficulty: "متوسط", question: "سقطت الأندلس سنة:", options: ["1492م", "1453م", "1258م", "1324م"], correct_index: 0 }),
  // الكويت
  q({ category_slug: "kuwait-islamic", question_type: "multiple_choice", difficulty: "سهل", question: "مسجد الدسمة من أقدم مساجد:", options: ["الكويت", "السعودية", "البحرين", "عمان"], correct_index: 0 }),
  // ألغاز
  q({ category_slug: "quran-puzzles", question_type: "multiple_choice", difficulty: "متوسط", question: "أكمل: ﴿إِنَّ اللَّهَ مَعَ ...﴾", options: ["الصَّابِرِينَ", "الغافلين", "الكافرين", "الظالمين"], correct_index: 0 }),
  q({ category_slug: "fiqh-puzzles", question_type: "count", difficulty: "متوسط", question: "كم عدد أركان الإسلام؟", options: ["5", "4", "6", "7"], correct_index: 0 }),
  q({ category_slug: "fiqh-puzzles", question_type: "pillar", difficulty: "سهل", question: "ما الركن الثاني من أركان الإسلام؟", options: ["إقام الصلاة", "الشهادتان", "إيتاء الزكاة", "صوم رمضان"], correct_index: 0 }),
  // علماء
  q({ category_slug: "fiqh", question_type: "scholar_choice", difficulty: "متقدم", question: "صاحب كتاب 'رياض الصالحين':", options: ["النووي", "ابن تيمية", "ابن القيم", "الذهبي"], correct_index: 0 }),
  q({ category_slug: "hadith", question_type: "scholar_choice", difficulty: "متقدم", question: "مؤلف صحيح مسلم:", options: ["مسلم بن الحجاج", "البخاري", "أبو داود", "الترمذي"], correct_index: 0 }),
  // المزيد
  q({ category_slug: "quran", question_type: "complete_verse", difficulty: "متوسط", question: "أكمل: ﴿وَمَا خَلَقْتُ ...﴾", options: ["الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ", "السماوات", "الأرض", "الملائكة"], correct_index: 0 }),
  q({ category_slug: "hadith", question_type: "complete_hadith", difficulty: "متوسط", question: "أكمل: 'من كان يؤمن بالله...'", options: ["فليقل خيراً أو ليصمت", "فليصل", "فليصوم", "فليتصدق"], correct_index: 0 }),
  q({ category_slug: "sahaba", question_type: "companion_choice", difficulty: "متوسط", question: "من لقب بـ 'سيف الله المسلول'؟", options: ["خالد بن الوليد", "علي", "حمزة", "سعد"], correct_index: 0 }),
  q({ category_slug: "seera", question_type: "battle_choice", difficulty: "متوسط", question: "غزوة فيها نزول: ﴿إذ جاءك...﴾", options: ["الأحزاب (الخندق)", "بدر", "حنين", "تبوك"], correct_index: 0 }),
  q({ category_slug: "prophets", question_type: "first_last", difficulty: "سهل", question: "من أول الرسل إلى أهل الأرض؟", options: ["نوح عليه السلام", "آدم", "إبراهيم", "موسى"], correct_index: 0 }),
  q({ category_slug: "fiqh", question_type: "wajib", difficulty: "متوسط", question: "ما واجب الغسل من الجنابة؟", options: ["غسل كل البدن بالماء", "الوضوء فقط", "غسل الرأس", "التيمم"], correct_index: 0 }),
  q({ category_slug: "fiqh", question_type: "sunnah", difficulty: "سهل", question: "السنن الرواتب مع الفريضة:", options: ["12 ركعة", "8 ركعات", "10 ركعات", "6 ركعات"], correct_index: 0 }),
  q({ category_slug: "aqeeda", question_type: "multiple_choice", difficulty: "خبير", question: "القاعدة: 'البر والفاجر'", options: ["كلاهما يستحق رحمة الله في الدنيا", "الفاجر لا يرزق", "البر لا يُبتلى", "لا أثر للأعمال"], correct_index: 0 }),
  q({ category_slug: "tajweed", question_type: "multiple_choice", difficulty: "خبير", question: "الإدغام بغنة يكون مع حروف:", options: ["يرملون", "قطب جد", "حلقية", "شفوية"], correct_index: 0 }),
  q({ category_slug: "islamic-history", question_type: "order_events", difficulty: "متقدم", question: "ما الذي جاء أولاً؟", options: ["الهجرة النبوية", "فتح مكة", "غزوة بدر", "بيعة العقبة"], correct_index: 3 }),
  q({ category_slug: "quran", question_type: "multiple_choice", difficulty: "مبتدئ", question: "القرآن نزل على:", options: ["محمد ﷺ", "موسى", "عيسى", "إبراهيم"], correct_index: 0 }),
  q({ category_slug: "salah", question_type: "condition", difficulty: "متوسط", question: "من شروط وجوب الصلاة:", options: ["بلوغ سن التكليف", "الذكورة", "الغنى", "الحج"], correct_index: 0 }),
  q({ category_slug: "hadith", question_type: "who_said", difficulty: "متوسط", question: "من قال: 'الدين النصيحة'؟", options: ["النبي ﷺ", "أبو بكر", "عمر", "علي"], correct_index: 0 }),
  q({ category_slug: "fiqh", question_type: "multiple_choice", difficulty: "سهل", question: "عدد أركان الوضوء:", options: ["4", "3", "5", "6"], correct_index: 0 }),
  q({ category_slug: "seera", question_type: "multiple_choice", difficulty: "متوسط", question: "عمرة الحديبية كانت في السنة:", options: ["6 للهجرة", "8", "10", "2"], correct_index: 0 }),
  q({ category_slug: "quran", question_type: "multiple_choice", difficulty: "متوسط", question: "السورة التي تعدل ثلث القرآن:", options: ["الإخلاص", "الفاتحة", "الكافرون", "الناس"], correct_index: 0 }),
  q({ category_slug: "akhlaq", question_type: "multiple_choice", difficulty: "سهل", question: "الصدق يؤدي إلى:", options: ["البر", "الفقر", "الغنى المذموم", "الكبر"], correct_index: 0 }),
  q({ category_slug: "prophets", question_type: "multiple_choice", difficulty: "متوسط", question: "بنيان السفينة كان على يد:", options: ["نوح", "موسى", "سليمان", "إبراهيم"], correct_index: 0 }),
  q({ category_slug: "usool-fiqh", question_type: "multiple_choice", difficulty: "متقدم", question: "القياس يتطلب:", options: ["أصل وحكم وعلة", "رأي فقط", "عرف", "إجماع"], correct_index: 0 }),
  q({ category_slug: "dua", question_type: "multiple_choice", difficulty: "سهل", question: "دعاء كرب:", options: ["لا إله إلا أنت سبحانك إني كنت من الظالمين", "رب زدني علماً", "رب اغفر لي", "حسبنا الله"], correct_index: 0 }),
  q({ category_slug: "islamic-puzzles", question_type: "multiple_choice", difficulty: "متوسط", question: "كم عدد أسماء الله الحسنى الواردة في القرآن والسنة؟", options: ["99", "100", "77", "55"], correct_index: 0 }),
];

export function getQuestionsByCategory(slug: string): SinJeemQuestion[] {
  return SIN_JEEM_QUESTIONS.filter((q) => q.category_slug === slug);
}

export function getQuestionsByDifficulty(difficulty: string): SinJeemQuestion[] {
  return SIN_JEEM_QUESTIONS.filter((q) => q.difficulty === difficulty);
}
