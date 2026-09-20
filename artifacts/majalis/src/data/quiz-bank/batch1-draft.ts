/**
 * دفعة Batch 1 — مسودات فقط (DRAFT).
 * لا أسئلة PUBLISHED هنا. لا إجابات مخترعة للنشر.
 * تُملأ لاحقًا بعد SOURCE_VERIFIED + مراجعة بشرية.
 *
 * الفئات المستهدفة: قرآن · حديث · عقيدة · فقه · سيرة · نحو · بلاغة
 */
import type { QuizBankQuestion } from "./types";

/** قائمة فارغة عمدًا — الصياغة الأولية تُضاف كمراجعات DRAFT عبر طابور بشري */
export const QUIZ_BATCH1_DRAFT_QUESTIONS: readonly QuizBankQuestion[] = [];

export const QUIZ_BATCH1_CATEGORY_IDS = [
  "quran",
  "hadith",
  "aqeeda",
  "fiqh",
  "sira",
  "nahw",
  "balagha",
] as const;
