/** @fileoverview توليد حقائق من قوالب موثقة */

import { QURAN_MISC, SURAH_NAMES } from './data/quran-data.mjs';

function fact(opts) {
  return {
    title: opts.title || opts.questionText.slice(0, 50),
    questionText: opts.questionText,
    correctAnswer: opts.correctAnswer,
    distractors: opts.distractors,
    explanation: opts.explanation,
    evidence: opts.evidence,
    reference: opts.reference,
    source: opts.source || opts.reference,
    bookName: opts.bookName || opts.reference,
    referenceNumber: opts.referenceNumber || null,
    categorySlug: opts.categorySlug,
    subCategory: opts.subCategory,
    difficulty: opts.difficulty,
    keywords: opts.keywords || [],
  };
}

function quranFact(item) {
  return fact({
    questionText: item.q,
    correctAnswer: item.a,
    distractors: item.d,
    explanation: `الإجابة الصحيحة: ${item.a}.`,
    evidence: item.ref,
    reference: 'القرآن الكريم',
    bookName: 'القرآن الكريم',
    referenceNumber: item.ref,
    categorySlug: 'quran',
    subCategory: item.sub,
    difficulty: item.diff,
    keywords: ['قرآن'],
  });
}

export function generateQuranFacts() {
  return QURAN_MISC.map(quranFact);
}

/** حقائق مُختارة موثقة — تُوسَّع عبر ملفات الفئات */
export function generateCuratedFacts() {
  return [
    // ── التفسير ──
    fact({ questionText: 'من مؤلف تفسير جامع البيان؟', correctAnswer: 'ابن جرير الطبري', distractors: ['ابن كثير', 'القرطبي', 'الرازي'], explanation: 'جامع البيان للطبري من أقدم التفاسير المأثورة.', evidence: 'تفسير جامع البيان', reference: 'كتب التفسير المعتمدة', bookName: 'جامع البيان', categorySlug: 'tafsir', subCategory: 'مفسرون', difficulty: 'متوسط', keywords: ['تفسير', 'طبري'] }),
    fact({ questionText: 'من مؤلف تفسير البيان في آيات الأحكام؟', correctAnswer: 'الشيخ محمد الأمين الشنقيطي', distractors: ['ابن تيمية', 'السعدي', 'ابن عثيمين'], explanation: 'ألف الشنقيطي تفسير أضواء البيان.', evidence: 'أضواء البيان', reference: 'كتب التفسير المعتمدة', bookName: 'أضواء البيان', categorySlug: 'tafsir', subCategory: 'مفسرون', difficulty: 'متقدم', keywords: ['شنقيطي'] }),
    fact({ questionText: 'من مؤلف تفسير تيسير الكريم الرحمن؟', correctAnswer: 'الشيخ عبدالرحمن السعدي', distractors: ['ابن كثير', 'الطبري', 'القرطبي'], explanation: 'تفسير السعدي مشهور ببساطة أسلوبه.', evidence: 'تيسير الكريم الرحمن', reference: 'كتب التفسير المعتمدة', bookName: 'تيسير الكريم الرحمن', categorySlug: 'tafsir', subCategory: 'مفسرون', difficulty: 'متوسط', keywords: ['السعدي'] }),

    // ── التجويد ──
    fact({ questionText: 'ما حكم النون الساكنة إذا جاء بعدها باء؟', correctAnswer: 'الإقلاب', distractors: ['الإظهار', 'الإدغام', 'الإخفاء'], explanation: 'الإقلاب تحويل النون الساكنة إلى ميم مع الغنة.', evidence: 'أحكام النون الساكنة', reference: 'كتب التجويد', bookName: 'متن الجزرية', categorySlug: 'tajweed', subCategory: 'أحكام', difficulty: 'متوسط', keywords: ['تجويد', 'إقلاب'] }),
    fact({ questionText: 'ما حكم الميم الساكنة إذا جاء بعدها باء؟', correctAnswer: 'الإخفاء الشفوي', distractors: ['الإظهار الشفوي', 'الإدغام', 'الإقلاب'], explanation: 'يُخفى الميم الساكنة مع بقاء الغنة.', evidence: 'أحكام الميم الساكنة', reference: 'كتب التجويد', bookName: 'متن الجزرية', categorySlug: 'tajweed', subCategory: 'أحكام', difficulty: 'متوسط', keywords: ['ميم', 'إخفاء'] }),
    fact({ questionText: 'من أي مخارج الحروف يخرج حرف القاف؟', correctAnswer: 'أقصى اللسان مع الحنك الأعلى', distractors: ['شفة سفلى', 'وسط اللسان', 'الشفتان'], explanation: 'القاف من حروف الحلق واللسان.', evidence: 'المخارج', reference: 'كتب التجويد', bookName: 'متن الجزرية', categorySlug: 'tajweed', subCategory: 'مخارج', difficulty: 'متقدم', keywords: ['مخارج'] }),

    // ── العقيدة ──
    fact({ questionText: 'كم عدد أركان الإيمان؟', correctAnswer: '6', distractors: ['5', '7', '4'], explanation: 'الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر.', evidence: 'حديث جبريل', reference: 'صحيح مسلم', bookName: 'صحيح مسلم', referenceNumber: '8', categorySlug: 'aqeeda', subCategory: 'إيمان', difficulty: 'مبتدئ', keywords: ['إيمان'] }),
    fact({ questionText: 'كم عدد أركان الإسلام؟', correctAnswer: '5', distractors: ['4', '6', '7'], explanation: 'شهادة، صلاة، زكاة، صيام، حج.', evidence: 'حديث جبريل', reference: 'صحيح مسلم', bookName: 'صحيح مسلم', categorySlug: 'aqeeda', subCategory: 'إيمان', difficulty: 'مبتدئ', keywords: ['إسلام'] }),
    fact({ questionText: 'ما أول ما يُحاسب عليه العبد يوم القيامة؟', correctAnswer: 'الصلاة', distractors: ['الزكاة', 'الصيام', 'الحج'], explanation: 'إن صلحت صلح سائر عمله.', evidence: 'حديث عن أبي هريرة', reference: 'سنن الترمذي', bookName: 'سنن الترمذي', categorySlug: 'aqeeda', subCategory: 'توحيد', difficulty: 'متوسط', keywords: ['حساب', 'صلاة'] }),

    // ── الحديث ──
    fact({ questionText: 'من جمع صحيح البخاري؟', correctAnswer: 'الإمام محمد بن إسماعيل البخاري', distractors: ['مسلم بن الحجاج', 'أبو داود', 'الترمذي'], explanation: 'البخاري أشهر جامعي الصحيح.', evidence: 'صحيح البخاري', reference: 'صحيح البخاري', bookName: 'صحيح البخاري', categorySlug: 'bukhari', subCategory: 'كتب', difficulty: 'مبتدئ', keywords: ['بخاري'] }),
    fact({ questionText: 'من جمع صحيح مسلم؟', correctAnswer: 'مسلم بن الحجاج النيسابوري', distractors: ['البخاري', 'ابن ماجه', 'النسائي'], explanation: 'صحيح مسلم ثاني كتاب بعد القرآن.', evidence: 'صحيح مسلم', reference: 'صحيح مسلم', bookName: 'صحيح مسلم', categorySlug: 'muslim', subCategory: 'كتب', difficulty: 'مبتدئ', keywords: ['مسلم'] }),
    fact({ questionText: 'من صاحب رياض الصالحين؟', correctAnswer: 'النووي', distractors: ['البخاري', 'ابن حجر', 'الترمذي'], explanation: 'رياض الصالحين للإمام النووي.', evidence: 'رياض الصالحين', reference: 'رياض الصالحين', bookName: 'رياض الصالحين', categorySlug: 'riyadh-salihin', subCategory: 'متون', difficulty: 'متوسط', keywords: ['نووي'] }),

    // ── مصطلح الحديث ──
    fact({ questionText: 'ما معنى الحديث الصحيح؟', correctAnswer: 'ما اتصل سنده ولم يشذ ولم يُعلّ', distractors: ['ما رواه البخاري فقط', 'ما في السنن', 'كل ما في الكتب'], explanation: 'تعريف الحافظ ابن حجر.', evidence: 'نزهة النظر', reference: 'كتب مصطلح الحديث', bookName: 'نزهة النظر', categorySlug: 'hadith-sciences', subCategory: 'درجات', difficulty: 'متقدم', keywords: ['صحيح'] }),
    fact({ questionText: 'ما المراد بالمتن في الحديث؟', correctAnswer: 'نص الحديث دون السند', distractors: ['سلسلة الرواة', 'كتاب الحديث', 'شرح الحديث'], explanation: 'المتن هو لفظ النبي ﷺ.', evidence: 'مصطلح الحديث', reference: 'كتب مصطلح الحديث', bookName: 'علوم الحديث', categorySlug: 'hadith-sciences', subCategory: 'متن', difficulty: 'متوسط', keywords: ['متن'] }),

    // ── السيرة ──
    fact({ questionText: 'في أي عام وُلد النبي ﷺ؟', correctAnswer: 'عام الفيل', distractors: ['عام الحزن', 'عام الهجرة', 'عام الفتح'], explanation: 'وُلد ﷺ عام الفيل.', evidence: 'السيرة النبوية', reference: 'كتب السيرة الموثوقة', bookName: 'الرحيق المختوم', categorySlug: 'seera', subCategory: 'مكة', difficulty: 'متوسط', keywords: ['مولد'] }),
    fact({ questionText: 'كم كان عمر النبي ﷺ عند الهجرة؟', correctAnswer: '53 سنة', distractors: ['40 سنة', '50 سنة', '60 سنة'], explanation: 'هاجر ﷺ في سن الثالثة والخمسين.', evidence: 'السيرة', reference: 'كتب السيرة الموثوقة', bookName: 'الرحيق المختوم', categorySlug: 'hijra', subCategory: 'الهجرة', difficulty: 'متوسط', keywords: ['هجرة'] }),
    fact({ questionText: 'ما أول غزوة في الإسلام؟', correctAnswer: 'غزوة بدر', distractors: ['أحد', 'الخندق', 'حنين'], explanation: 'بدر في السنة الثانية للهجرة.', evidence: 'السيرة', reference: 'كتب السيرة الموثوقة', bookName: 'الرحيق المختوم', categorySlug: 'ghazwat', subCategory: 'غزوات', difficulty: 'متوسط', keywords: ['بدر'] }),

    // ── الأنبياء ──
    fact({ questionText: 'من أول الأنبياء؟', correctAnswer: 'آدم عليه السلام', distractors: ['نوح', 'إبراهيم', 'موسى'], explanation: 'آدم أبو البشر وأول الأنبياء.', evidence: 'القرآن الكريم', reference: 'القرآن الكريم', bookName: 'القرآن الكريم', categorySlug: 'prophets', subCategory: 'آدم', difficulty: 'مبتدئ', keywords: ['آدم'] }),
    fact({ questionText: 'من النبي الذي ابتلعه الحوت؟', correctAnswer: 'يونس عليه السلام', distractors: ['موسى', 'نوح', 'إبراهيم'], explanation: 'قصة يونس في سورة الصافات.', evidence: 'سورة الصافات', reference: 'القرآن الكريم', bookName: 'القرآن الكريم', categorySlug: 'prophets', subCategory: 'يونس', difficulty: 'مبتدئ', keywords: ['يونس'] }),
    fact({ questionText: 'من النبي الذي كلّمه الله؟', correctAnswer: 'موسى عليه السلام', distractors: ['عيسى', 'إبراهيم', 'محمد ﷺ'], explanation: 'كَلّم الله موسى تكليماً.', evidence: 'سورة النساء', reference: 'القرآن الكريم', bookName: 'القرآن الكريم', categorySlug: 'musa', subCategory: 'موسى', difficulty: 'مبتدئ', keywords: ['موسى'] }),

    // ── الصحابة ──
    fact({ questionText: 'من أول الخلفاء الراشدين؟', correctAnswer: 'أبو بكر الصديق', distractors: ['عمر', 'عثمان', 'علي'], explanation: 'بويع أبو بكر بعد وفاة النبي ﷺ.', evidence: 'التاريخ الإسلامي', reference: 'كتب السيرة الموثوقة', bookName: 'الرحيق المختوم', categorySlug: 'khulafa-rashidun', subCategory: 'خلفاء', difficulty: 'مبتدئ', keywords: ['أبو بكر'] }),
    fact({ questionText: 'من لقب بذي النورين؟', correctAnswer: 'عثمان بن عفان', distractors: ['عمر', 'علي', 'طلحة'], explanation: 'تزوج ابنتي النبي ﷺ.', evidence: 'السيرة', reference: 'كتب السيرة الموثوقة', bookName: 'الرحيق المختوم', categorySlug: 'sahaba', subCategory: 'صحابيات', difficulty: 'متوسط', keywords: ['عثمان'] }),
    fact({ questionText: 'كم عدد العشرة المبشرين بالجنة؟', correctAnswer: '10', distractors: ['8', '12', '7'], explanation: 'وردت أسماؤهم في حديث صحيح.', evidence: 'حديث العشرة', reference: 'صحيح البخاري', bookName: 'صحيح البخاري', categorySlug: 'sahaba', subCategory: 'صحابيات', difficulty: 'مبتدئ', keywords: ['عشرة'] }),

    // ── الفقه ──
    fact({ questionText: 'كم عدد ركعات صلاة الظهر؟', correctAnswer: '4', distractors: ['2', '3', '5'], explanation: 'الظهر أربع ركعات.', evidence: 'السنة', reference: 'كتب الفقه المعتمدة', bookName: 'زاد المستقنع', categorySlug: 'salah', subCategory: 'صلاة', difficulty: 'مبتدئ', keywords: ['ظهر'] }),
    fact({ questionText: 'ما حكم الوضوء للصلاة؟', correctAnswer: 'واجب', distractors: ['سنة', 'مستحب', 'مكروه'], explanation: 'الطهارة شرط صحة الصلاة.', evidence: 'القرآن والسنة', reference: 'كتب الفقه المعتمدة', bookName: 'زاد المستقنع', categorySlug: 'tahara', subCategory: 'طهارة', difficulty: 'مبتدئ', keywords: ['وضوء'] }),
    fact({ questionText: 'ما نصاب الذهب للزكاة؟', correctAnswer: '85 جراماً', distractors: ['50 جراماً', '100 جراماً', '200 جراماً'], explanation: 'نصاب الذهب عشرون مثقالاً.', evidence: 'الفقه', reference: 'كتب الفقه المعتمدة', bookName: 'زاد المستقنع', categorySlug: 'zakat', subCategory: 'زكاة', difficulty: 'متوسط', keywords: ['زكاة'] }),
    fact({ questionText: 'ما حكم صيام يوم عرفة للمقيم؟', correctAnswer: 'سنة مؤكدة', distractors: ['واجب', 'محرم', 'مكروه'], explanation: 'صيام عرفة يكفر سنتين.', evidence: 'حديث صحيح', reference: 'صحيح مسلم', bookName: 'صحيح مسلم', categorySlug: 'siyam', subCategory: 'صيام', difficulty: 'متوسط', keywords: ['عرفة'] }),
    fact({ questionText: 'ما ركن الحج الأعظم؟', correctAnswer: 'الوقوف بعرفة', distractors: ['الطواف', 'السعي', 'رمي الجمار'], explanation: 'الحج عرفة.', evidence: 'حديث', reference: 'سنن أبي داود', bookName: 'سنن أبي داود', categorySlug: 'hajj', subCategory: 'حج', difficulty: 'متوسط', keywords: ['حج'] }),

    // ── أصول الفقه ──
    fact({ questionText: 'ما أقوى أدلة الشرع بعد القرآن؟', correctAnswer: 'السنة المتواترة', distractors: ['القياس', 'الإجماع', 'الاستحسان'], explanation: 'السنة حجة مع القرآن.', evidence: 'أصول الفقه', reference: 'كتب أصول الفقه', bookName: 'الورقات', categorySlug: 'usool-fiqh', subCategory: 'أدلة', difficulty: 'متقدم', keywords: ['أدلة'] }),
    fact({ questionText: 'ما معنى القياس في أصول الفقه؟', correctAnswer: 'إلحاق فرع بأصل لعلة', distractors: ['حذف دليل', 'إلغاء حكم', 'تأويل نص'], explanation: 'القياس من الأدلة الاجتهادية.', evidence: 'أصول الفقه', reference: 'كتب أصول الفقه', bookName: 'الورقات', categorySlug: 'usool-fiqh', subCategory: 'قواعد', difficulty: 'متقدم', keywords: ['قياس'] }),

    // ── القواعد الفقهية ──
    fact({ questionText: 'ما القاعدة: المشقة تجلب التيسير؟', correctAnswer: 'يُرفع الحرج عند الضرورة', distractors: ['يُلغى كل حكم', 'لا أثر للمشقة', 'المشقة تُلغي العبادة'], explanation: 'من القواعد الكلية.', evidence: 'القواعد الفقهية', reference: 'كتب الفقه المعتمدة', bookName: 'الأشباه والنظائر', categorySlug: 'fiqh-rules', subCategory: 'قواعد', difficulty: 'متقدم', keywords: ['قواعد'] }),

    // ── الفرائض ──
    fact({ questionText: 'ما نصيب الزوج من زوجته إن لم يكن له ولد؟', correctAnswer: 'النصف', distractors: ['الربع', 'الثلث', 'السدس'], explanation: 'قال تعالى: ولهن الربع...', evidence: 'سورة النساء', reference: 'القرآن الكريم', bookName: 'القرآن الكريم', referenceNumber: '4:12', categorySlug: 'faraid', subCategory: 'مواريث', difficulty: 'متقدم', keywords: ['مواريث'] }),

    // ── اللغة ──
    fact({ questionText: 'ما إعراب كلمة «محمد» في: جاء محمدٌ؟', correctAnswer: 'فاعل مرفوع', distractors: ['مفعول به', 'مبتدأ', 'خبر'], explanation: 'جاء فعل وفاعله محمد.', evidence: 'النحو', reference: 'كتب اللغة العربية', bookName: 'الآجرومية', categorySlug: 'arabic', subCategory: 'نحو', difficulty: 'متوسط', keywords: ['نحو'] }),

    // ── الأذكار ──
    fact({ questionText: 'ما الذكر بعد السلام من الصلاة؟', correctAnswer: 'أستغفر الله', distractors: ['سبحان الله', 'الحمد لله', 'لا إله إلا الله'], explanation: 'من السنة بعد الصلاة.', evidence: 'حديث', reference: 'صحيح مسلم', bookName: 'صحيح مسلم', categorySlug: 'morning-adhkar', subCategory: 'صباح', difficulty: 'مبتدئ', keywords: ['أذكار'] }),

    // ── التاريخ ──
    fact({ questionText: 'من أول من لُقّب بالخليفة؟', correctAnswer: 'أبو بكر الصديق', distractors: ['عمر', 'معاوية', 'علي'], explanation: 'بويع أبو بكر خليفة.', evidence: 'التاريخ', reference: 'كتب السيرة الموثوقة', bookName: 'الرحيق المختوم', categorySlug: 'islamic-history', subCategory: 'خلفاء', difficulty: 'متوسط', keywords: ['خلافة'] }),
    fact({ questionText: 'متى فتحت الأندلس؟', correctAnswer: '92 هـ', distractors: ['50 هـ', '150 هـ', '200 هـ'], explanation: 'فتح طارق بن زياد.', evidence: 'التاريخ', reference: 'كتب التاريخ الإسلامي', bookName: 'تاريخ الأندلس', categorySlug: 'andalus', subCategory: 'دول', difficulty: 'خبير', keywords: ['أندلس'] }),

    // ── الكويت ──
    fact({ questionText: 'ما أقدم مسجد في الكويت؟', correctAnswer: 'مسجد البحر', distractors: ['مسجد الصحابة', 'مسجد الدسمة', 'مسجد الفحيحيل'], explanation: 'مسجد البحر من أقدم مساجد الكويت.', evidence: 'تراث الكويت', reference: 'كتب التاريخ الإسلامي', bookName: 'مساجد الكويت', categorySlug: 'kuwait-islamic', subCategory: 'مساجد', difficulty: 'متوسط', keywords: ['كويت'] }),

    // ── المساجد ──
    fact({ questionText: 'ما أول مسجد بُني في الإسلام؟', correctAnswer: 'مسجد قباء', distractors: ['المسجد النبوي', 'المسجد الحرام', 'مسجد الأقصى'], explanation: 'بُني قباء قبل الهجرة.', evidence: 'السيرة', reference: 'صحيح البخاري', bookName: 'صحيح البخاري', categorySlug: 'mosques', subCategory: 'مساجد', difficulty: 'مبتدئ', keywords: ['قباء'] }),

    // ── المتون ──
    fact({ questionText: 'من صاحب متن الأربعين النووية؟', correctAnswer: 'النووي', distractors: ['البخاري', 'ابن حجر', 'الترمذي'], explanation: 'جمع النووي أربعين حديثاً.', evidence: 'الأربعين النووية', reference: 'المتون العلمية', bookName: 'الأربعين النووية', categorySlug: 'nawawi-40', subCategory: 'متون', difficulty: 'مبتدئ', keywords: ['نووي'] }),
    fact({ questionText: 'من صاحب متن الآجرومية؟', correctAnswer: 'ابن آجروم', distractors: ['ابن مالك', 'الزمخشري', 'السيوطي'], explanation: 'متن مشهور في النحو.', evidence: 'الآجرومية', reference: 'المتون العلمية', bookName: 'الآجرومية', categorySlug: 'mutoon', subCategory: 'متون', difficulty: 'متوسط', keywords: ['نحو'] }),

    // ── العلماء ──
    fact({ questionText: 'من لقب بشيخ الإسلام؟', correctAnswer: 'ابن تيمية', distractors: ['الشافعي', 'ابن حنبل', 'مالك'], explanation: 'لقب شهير لابن تيمية.', evidence: 'التراجم', reference: 'كتب التاريخ الإسلامي', bookName: 'سير أعلام النبلاء', categorySlug: 'scholars', subCategory: 'فقهاء', difficulty: 'متوسط', keywords: ['ابن تيمية'] }),

    // ── التابعون ──
    fact({ questionText: 'من أحد كبار التابعين المحدثين؟', correctAnswer: 'سعيد بن المسيب', distractors: ['أبو بكر', 'عمر', 'علي'], explanation: 'من فقهاء التابعين.', evidence: 'التراجم', reference: 'كتب التاريخ الإسلامي', bookName: 'سير أعلام النبلاء', categorySlug: 'tabiin', subCategory: 'علماء', difficulty: 'متقدم', keywords: ['تابعون'] }),

    // ── الأخلاق ──
    fact({ questionText: 'ما أفضل الأعمال؟', correctAnswer: 'الصبر والصدق', distractors: ['الصيام فقط', 'الحج فقط', 'الزكاة فقط'], explanation: 'ورد في حديث صحيح.', evidence: 'حديث', reference: 'صحيح البخاري', bookName: 'صحيح البخاري', categorySlug: 'akhlaq', subCategory: 'فضائل', difficulty: 'مبتدئ', keywords: ['أخلاق'] }),
  ];
}

import { getBulkFacts } from './bulk.mjs';

export function getAllFacts() {
  return [...generateQuranFacts(), ...generateCuratedFacts(), ...getBulkFacts()];
}
