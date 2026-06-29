/** @fileoverview ثوابت بنك الأسئلة v2 — سؤال وجواب */

export const BANK_VERSION = 2;
export const BANK_SCHEMA = 'sin-jeem-v2';

/** الحد الأقصى للتشابه بين سؤالين (90%) */
export const MAX_SIMILARITY = 0.9;

/** عدد الأسئلة المستهدف */
export const TARGET_QUESTION_COUNT = 527;

/** زمن الإجابة الافتراضي بالثواني */
export const DEFAULT_TIME_LIMIT = 30;

/** درجة السؤال الافتراضية */
export const DEFAULT_POINTS = 10;

/** مستويات الصعوبة */
export const DIFFICULTY_LEVELS = ['مبتدئ', 'متوسط', 'متقدم', 'خبير'];

/** المراجع المعتمدة */
export const APPROVED_REFERENCE_PREFIXES = [
  'القرآن الكريم',
  'صحيح البخاري',
  'صحيح مسلم',
  'سنن',
  'السنن',
  'رياض الصالحين',
  'العقيدة',
  'الفقه',
  'التفسير',
  'السيرة',
  'الشمائل',
  'متن',
  'كتاب',
];

/** التصنيفات الرئيسية المعتمدة */
export const MAIN_CATEGORIES = [
  { slug: 'quran', nameAr: 'القرآن الكريم', sub: ['عدد السور', 'أسماء السور', 'مكي ومدني', 'آيات'] },
  { slug: 'tafsir', nameAr: 'التفسير', sub: ['تفسير الآيات', 'أسباب النزول', 'مفسرون'] },
  { slug: 'tajweed', nameAr: 'التجويد', sub: ['أحكام', 'مخارج', 'صفات'] },
  { slug: 'aqeedah', nameAr: 'العقيدة', sub: ['توحيد', 'إيمان', 'أسماء الله'] },
  { slug: 'hadith', nameAr: 'الحديث', sub: ['متون', 'رواة', 'كتب'] },
  { slug: 'hadith-terms', nameAr: 'مصطلح الحديث', sub: ['سند', 'متن', 'درجات'] },
  { slug: 'fiqh', nameAr: 'الفقه', sub: ['طهارة', 'صلاة', 'صيام', 'زكاة', 'حج'] },
  { slug: 'usool-fiqh', nameAr: 'أصول الفقه', sub: ['أدلة', 'قواعد', 'اجتهاد'] },
  { slug: 'seerah', nameAr: 'السيرة', sub: ['مكة', 'المدينة', 'غزوات'] },
  { slug: 'shamail', nameAr: 'الشمائل', sub: ['صفات', 'أخلاق'] },
  { slug: 'sahaba', nameAr: 'الصحابة', sub: ['خلفاء', 'صحابيات'] },
  { slug: 'tabieen', nameAr: 'التابعون', sub: ['علماء', 'رواة'] },
  { slug: 'islamic-history', nameAr: 'التاريخ الإسلامي', sub: ['خلفاء', 'دول', 'معارك'] },
  { slug: 'arabic', nameAr: 'اللغة العربية', sub: ['نحو', 'بلاغة', 'مفردات'] },
  { slug: 'faraid', nameAr: 'الفرائض', sub: ['مواريث', 'حصص'] },
  { slug: 'adab', nameAr: 'الآداب الإسلامية', sub: ['آداب', 'سلوك'] },
  { slug: 'adhkar', nameAr: 'الأذكار', sub: ['صباح', 'مساء', 'نوم'] },
  { slug: 'dawah', nameAr: 'الدعوة', sub: ['منهج', 'آداب'] },
  { slug: 'akhlaq', nameAr: 'الأخلاق', sub: ['فضائل', 'رذائل'] },
  { slug: 'fiqh-rules', nameAr: 'القواعد الفقهية', sub: ['قواعد', 'أمثلة'] },
  { slug: 'maqasid', nameAr: 'المقاصد', sub: ['مقاصد', 'مصالح'] },
  { slug: 'mutoon', nameAr: 'المتون العلمية', sub: ['متون', 'مؤلفون'] },
  { slug: 'ulama', nameAr: 'العلماء', sub: ['فقهاء', 'محدثون'] },
  { slug: 'mosques', nameAr: 'المساجد', sub: ['مساجد', 'أوقاف'] },
  { slug: 'kuwait', nameAr: 'الكويت', sub: ['مساجد', 'علماء'] },
  { slug: 'islamic-culture', nameAr: 'الثقافة الإسلامية', sub: ['حضارة', 'فنون'] },
];

export const CATEGORY_SLUGS = [
  'quran', 'tafsir', 'quran-sciences', 'tajweed', 'aqeeda', 'hadith', 'hadith-sciences',
  'seera', 'prophets', 'sahaba', 'um-muminin', 'tabiin', 'scholars', 'fiqh', 'usool-fiqh',
  'fiqh-rules', 'faraid', 'arabic', 'dua', 'morning-adhkar', 'islamic-history', 'kuwait-islamic',
  'mosques', 'mutoon', 'scientific-miracles', 'islamic-puzzles', 'maki-madani', 'nawawi-40',
  'nuh', 'ibrahim', 'musa', 'isa', 'muhammad', 'khulafa-rashidun', 'ghazwat', 'salah', 'tahara',
  'siyam', 'andalus', 'quran-puzzles', 'fiqh-puzzles', 'bukhari', 'riyadh-salihin', 'zakat', 'hajj',
  'tawheed', 'names-attributes', 'shirk', 'nahw', 'balagha', 'akhlaq', 'rashidun-state', 'hijra',
  'adam', 'asbab-nuzul', 'gharib', 'bida', 'iman', 'waqf-ibtida', 'nasikh-mansukh', 'tajweed-ahkam',
  'makhraj', 'sifat', 'mudud', 'qalqala', 'ashara-mubashshara', 'sahaba-seera', 'fiqh-puzzle',
  'prophets', 'seira_timeline',
];

/** مراحل المراجعة العشر */
export const REVIEW_STAGES = [
  'linguistic',
  'sharia',
  'logic',
  'options',
  'reference',
  'evidence',
  'no-dispute',
  'no-ambiguity',
  'single-answer',
  'category-fit',
];
