// ══════════════════════════════════════════════════════
// منطق التكرار المتباعد — نسخة مبسّطة من SM-2
// الموضع: lib/srs.ts
// دالة نقية بلا اعتماد على شيء: قابلة للاختبار وحدها.
// ══════════════════════════════════════════════════════

export type Rating = 'hard' | 'later' | 'ok';

export interface CardState {
  interval: number; // بالأيام
  ease: number;     // معامل السهولة
  reps: number;     // عدد المراجعات الناجحة المتتالية
  lapses?: number;  // مرات النسيان
}

export interface Scheduled extends CardState {
  lapses: number;
  dueOn: string;   // YYYY-MM-DD
  again: boolean;  // هل تعود البطاقة في نفس الجلسة؟
}

/** بداية اليوم عند الساعة ٣ فجرًا بتوقيت المستخدم:
 *  من راجع الساعة ١١ ليلًا لا تظهر له البطاقة بعد ساعة. */
export function today(now: Date = new Date()): Date {
  const d = new Date(now);
  if (d.getHours() < 3) d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function schedule(card: CardState, rating: Rating, now: Date = new Date()): Scheduled {
  let { interval = 0, ease = 2.5 } = card;
  const reps = card.reps ?? 0;
  const lapses = card.lapses ?? 0;
  const base = today(now);

  if (rating === 'hard') {
    // تُصفَّر السلسلة وتعود البطاقة في نفس الجلسة
    ease = Math.max(1.3, ease - 0.2);
    return { interval: 1, ease, reps: 0, lapses: lapses + 1, dueOn: addDays(base, 1), again: true };
  }

  if (rating === 'later') {
    ease = Math.max(1.3, ease - 0.05);
    interval = interval ? Math.round(interval * 1.3) : 1;
  } else {
    ease = Math.min(2.8, ease + 0.1);
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
  }

  return { interval, ease, reps: reps + 1, lapses, dueOn: addDays(base, interval), again: false };
}

/** الفواصل الناتجة عند «أعرفه» دائمًا: ١ ← ٣ ← ٧ ← ١٦ ← ٣٥ ← ٧٥ يومًا تقريبًا */
export const MAX_SESSION = 20; // حدّ البطاقات في الجلسة الواحدة — الجلسة الطويلة تُنفّر
