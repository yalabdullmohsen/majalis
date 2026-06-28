import {
  ROTATION_CATEGORIES,
  CATEGORY_LABELS,
  DIFFICULTY_SLOTS,
  DAILY_TARGET,
} from "./config.mjs";

/**
 * @returns {string} YYYY-MM-DD in UTC
 */
export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Build balanced daily generation plan.
 * @param {number} [targetCount=DAILY_TARGET]
 * @param {string} [dayKey=todayKey()]
 */
export function buildDailyPlan(targetCount = DAILY_TARGET, dayKey = todayKey()) {
  const shuffled = shuffleWithSeed([...ROTATION_CATEGORIES], hashDate(dayKey));
  const difficulties = shuffleWithSeed([...DIFFICULTY_SLOTS], hashDate(`${dayKey}:diff`));

  /** @type {{ category_slug: string; category_name_ar: string; difficulty: string }[]} */
  const plan = [];

  for (let i = 0; i < targetCount; i++) {
    const category_slug = shuffled[i % shuffled.length];
    plan.push({
      category_slug,
      category_name_ar: CATEGORY_LABELS[category_slug] || category_slug,
      difficulty: difficulties[i] || DIFFICULTY_SLOTS[i % DIFFICULTY_SLOTS.length],
    });
  }

  return plan;
}

function hashDate(dateKey) {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) {
    h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return h;
}

function shuffleWithSeed(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
