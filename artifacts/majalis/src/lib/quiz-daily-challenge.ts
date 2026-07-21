/**
 * "تحدي اليوم" — اختيار حتمي (deterministic) حسب التاريخ من بنك الأسئلة
 * الحالي فعليًا (المرحلة 6). لا توليد جديد بالذكاء الاصطناعي إطلاقًا —
 * فقط اختيار فهرس ثابت لكل يوم من أسئلة موجودة سلفًا في src/data/
 * islamicQuizData.ts (نفس البنك الذي تستهلكه لعبة /quiz فعليًا).
 *
 * ملاحظة صادقة: البنك الفعلي المقيس مباشرة (لا افتراضًا) = 480 سؤالاً عبر
 * 8 تصنيفات × 3 مستويات نقاط، وليس "~1800" كما ورد تقديرًا في المواصفة
 * الأصلية — التقدير الوارد هناك لم يطابق العدد الحقيقي عند القياس.
 */
import { ALL_QUESTIONS, GAME_CATEGORIES, type PointValue, type QuizQuestion } from "@/data/islamicQuizData";

export type DailyChallengeQuestion = {
  question: QuizQuestion;
  categoryId: string;
  categoryName: string;
  points: PointValue;
};

type FlatEntry = { question: QuizQuestion; categoryId: string; points: PointValue };

let flatPoolCache: FlatEntry[] | null = null;

function flatPool(): FlatEntry[] {
  if (flatPoolCache) return flatPoolCache;
  const pool: FlatEntry[] = [];
  const points: PointValue[] = [200, 400, 600];
  for (const categoryId of Object.keys(ALL_QUESTIONS)) {
    const cat = ALL_QUESTIONS[categoryId];
    for (const p of points) {
      for (const question of cat[p] ?? []) {
        pool.push({ question, categoryId, points: p });
      }
    }
  }
  // ترتيب مستقر بمعرّف السؤال كي يبقى الفهرس اليومي ثابتًا عبر عمليات
  // إعادة بناء مختلفة للتطبيق (لا يعتمد على ترتيب استيراد وقت التشغيل).
  pool.sort((a, b) => a.question.id.localeCompare(b.question.id));
  flatPoolCache = pool;
  return pool;
}

/** رقم يوم ثابت من تاريخ محلي "YYYY-MM-DD" — لا يعتمد على المنطقة الزمنية للمتصفح وقت الحساب. */
function dayNumberFromDateKey(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** سؤال اليوم — نفس السؤال لكل المستخدمين طوال نفس اليوم التقويمي، يتغيّر غدًا. */
export function getDailyChallenge(date: Date = new Date()): DailyChallengeQuestion | null {
  const pool = flatPool();
  if (pool.length === 0) return null;
  const dateKey = date.toISOString().slice(0, 10);
  const idx = dayNumberFromDateKey(dateKey) % pool.length;
  const entry = pool[idx];
  const categoryName = GAME_CATEGORIES.find((c) => c.id === entry.categoryId)?.name ?? entry.categoryId;
  return { question: entry.question, categoryId: entry.categoryId, categoryName, points: entry.points };
}

/** إجمالي عدد الأسئلة الفعلي في البنك — للعرض الصادق بدل رقم تقديري ثابت بالواجهة. */
export function totalQuestionBankSize(): number {
  return flatPool().length;
}
