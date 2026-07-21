/** مرادفات البحث — عربي/إنجليزي/اختصارات شائعة */
const SYNONYM_GROUPS: string[][] = [
  // الفقه والأحكام
  ["فقه", "أحكام", "fiqh", "فقهي", "الفقه"],
  ["حكم", "أحكام", "حلال", "حرام", "مباح", "مكروه"],
  ["فتوى", "فتاوى", "fatwa", "استفتاء", "إفتاء"],
  ["زكاة", "صدقة", "زكاه", "الزكاة", "الصدقة"],
  ["صلاة", "الصلاة", "prayer", "نماز", "صلوات"],
  ["صيام", "صوم", "الصوم", "الصيام", "fasting", "رمضان"],
  ["حج", "عمرة", "الحج", "hajj", "umrah", "مكة"],
  ["وضوء", "طهارة", "غسل", "نجاسة", "الوضوء"],
  ["نكاح", "زواج", "طلاق", "marriage", "divorce"],

  // القرآن والتفسير
  ["قرآن", "quran", "مصحف", "سور", "القرآن", "كريم"],
  ["تفسير", "tafsir", "تفسيري", "تأويل", "معنى"],
  ["تجويد", "tajweed", "تلاوة", "حفظ", "قراءة"],
  ["سورة", "سور", "آية", "آيات", "juz", "جزء", "حزب"],
  ["أسماء الحسنى", "اسم الله", "صفات الله"],

  // الحديث والسنة
  ["حديث", "سنة", "hadith", "sunna", "سنّة", "السنة"],
  ["صحيح", "ضعيف", "موضوع", "حسن", "صحيح البخاري", "مسلم"],
  ["مصطلح الحديث", "علم الحديث", "رواة", "إسناد", "سند"],

  // العقيدة والتوحيد
  ["عقيدة", "توحيد", "aqeedah", "عقائد", "العقيدة"],
  ["إيمان", "يقين", "ركن", "أركان الإيمان", "شرك"],
  ["الأسماء والصفات", "صفات الله", "تنزيه"],

  // السيرة والتاريخ
  ["سيرة", "نبي", "النبي", "محمد", "prophet", "seerah"],
  ["صحابة", "صحابي", "sahabah", "companions", "آل البيت"],
  ["تاريخ إسلامي", "خلفاء", "إسلام", "دولة إسلامية"],
  ["غزوة", "معركة", "جهاد", "فتح"],

  // التعليم والدروس
  ["دروس", "درس", "lesson", "lessons", "محاضرة"],
  ["دورة", "دورات", "course", "courses", "ملتقى", "برنامج"],
  ["شيخ", "مشايخ", "speaker", "sheikh", "عالم", "علماء"],
  ["طالب علم", "طلب العلم", "تعليم", "تعلّم"],

  // المساجد والمواقع
  ["مسجد", "جامع", "mosque", "مساجد"],
  ["كويت", "kuwait", "الكويت", "المحافظة"],
  ["قبلة", "مكة", "المدينة", "الحرم"],

  // الأذكار والعبادة
  ["أذكار", "ذكر", "adhkar", "تسبيح", "دعاء", "استغفار"],
  ["دعاء", "أدعية", "duas", "دعوة"],
  ["تسبيح", "تحميد", "تهليل", "تكبير"],
  ["ورد", "حزب", "ذكر اليوم", "الأذكار اليومية"],

  // الفوائد والمحتوى
  ["فوائد", "فائدة", "benefit", "fawaid", "فوائد علمية"],
  ["مكتبة", "كتب", "library", "book", "كتاب"],
  ["سؤال", "أسئلة", "qa", "question", "استفسار"],
  ["مقال", "بحث", "مقالات", "article", "دراسة"],

  // الأخلاق والتزكية
  ["أخلاق", "خلق", "تزكية", "نفس", "سلوك"],
  ["صبر", "شكر", "توكل", "تقوى", "ورع"],
  ["بر الوالدين", "صلة الرحم", "العلاقات"],

  // الجنة والآخرة
  ["جنة", "نار", "آخرة", "يوم القيامة", "paradise", "hell"],
  ["موت", "قبر", "برزخ", "حساب", "ميزان"],

  // الفتنة والنوازل
  ["نازلة", "نوازل", "معاصرة", "فقه المعاصر", "قضايا"],
  ["حرام", "حلال", "مستجد", "معاملات", "عقود"],
];

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

const LOOKUP = new Map<string, Set<string>>();

for (const group of SYNONYM_GROUPS) {
  const normalized = group.map(normalizeKey);
  const bucket = new Set(normalized);
  for (const term of normalized) {
    const existing = LOOKUP.get(term) || new Set<string>();
    for (const item of bucket) existing.add(item);
    LOOKUP.set(term, existing);
  }
}

/** يوسّع الاستعلام بمرادفاته للبحث الذكي */
export function expandSearchTerms(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const terms = new Set<string>([trimmed]);
  const parts = trimmed.split(/\s+/).filter(Boolean);

  for (const part of parts) {
    const key = normalizeKey(part);
    terms.add(part);
    const synonyms = LOOKUP.get(key);
    if (synonyms) {
      for (const syn of synonyms) terms.add(syn);
    }
  }

  const fullKey = normalizeKey(trimmed);
  const fullSynonyms = LOOKUP.get(fullKey);
  if (fullSynonyms) {
    for (const syn of fullSynonyms) terms.add(syn);
  }

  return [...terms];
}
