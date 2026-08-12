/**
 * تصنيف نية السؤال وأنماط اللغة الطبيعية
 */

/** أنماط الأسئلة الشخصية (تُوجَّه لعالم) */
const PERSONAL_FATWA_RX = [
  /أفتني/,
  /يجوز لي\s*أنا/,
  /واجب\s*علي\s*أنا/,
  /حالتي/,
  /واقعتي/,
  /طلاقي|نذري|حلفت|يميني/,
  /ميراث\s*أهلي/,
  /قضيتي|محكمتي/,
];

/** أنماط اكتشاف نوع السؤال */
const INTENT_PATTERNS = [
  { intent: "quran",   rx: /آية|سورة|القرآن|تفسير|سبب.+نزول|معنى.+آية/i },
  { intent: "hadith",  rx: /حديث|سنة|رواية|صحيح|البخاري|مسلم|السنن|الراوي/i },
  { intent: "fiqh",    rx: /ما حكم|هل يجوز|فتوى|فقه|مسألة|الفقهاء|باب/i },
  { intent: "scholar", rx: /شيخ|عالم|ترجمة|من هو|سيرة.+عالم/i },
  { intent: "compare", rx: /قارن|الفرق بين|مقارنة|قولان|خلاف|آراء/i },
  { intent: "summary", rx: /لخّص|اجمع|ما هي أدلة|أهم.+ما يُذكر/i },
  { intent: "source",  rx: /أين ورد|من.+قال|مصدر|دليل|شاهد/i },
];

/**
 * @typedef {"quran"|"hadith"|"fiqh"|"scholar"|"compare"|"summary"|"source"|"general"} QueryIntent
 */

/**
 * @returns {{ intent: QueryIntent, isPersonal: boolean, contentTypes: string[] }}
 */
export function analyzeIntent(query) {
  const q = String(query || "").trim();

  const isPersonal = PERSONAL_FATWA_RX.some((rx) => rx.test(q));

  const matched = INTENT_PATTERNS.find((p) => p.rx.test(q));
  const intent = matched?.intent || "general";

  // أنواع المحتوى المُقترحة حسب النية
  const contentTypes = {
    quran:   ["quran_verse", "tafsir"],
    hadith:  ["hadith"],
    fiqh:    ["fiqh_decision", "fatwa", "ruling"],
    scholar: ["lesson", "article"],
    compare: ["fiqh_decision", "fatwa", "lesson"],
    summary: null, // كل الأنواع
    source:  null,
    general: null,
  }[intent] || null;

  return { intent, isPersonal, contentTypes };
}

/**
 * تصنيف أسلوب الإجابة المطلوب
 */
export function detectOutputMode(query) {
  const q = String(query || "");
  if (/قارن|مقارنة|الفرق بين/i.test(q))  return "compare";
  if (/لخّص|اجمع|ملخص/i.test(q))         return "summary";
  if (/أدلة|شواهد|دليل/i.test(q))         return "evidence";
  if (/من.+قال|أين ورد/i.test(q))         return "source_find";
  return "answer";
}
