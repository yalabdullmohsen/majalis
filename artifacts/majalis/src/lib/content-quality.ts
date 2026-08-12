/** Filters weak or placeholder seed content from public display. */

const WEAK_FAWAID_AUTHORS = new Set(["فائدة مختارة"]);

const WEAK_FAWAID_PATTERNS = [
  /^ملخص منظم/,
  /^متن كلاسيكي/,
  /^تفريغ:/,
  /^ملخص مرئي/,
];

/** مصادر تُصرّح بضعف المرفوع المستدَل به — تُحجب من العرض العام. */
const WEAK_SOURCE_RE = /ضعّف|ضعيف (الجامع|الترمذي|أبي داود|الترغيب)|إسناده ضعيف|بلا إسناد ثابت|لم يثبت بلفظه/;

export function isQualityFawaid(item: {
  text?: string;
  author_name?: string | null;
  source?: string | null;
}): boolean {
  const text = (item.text || "").trim();
  if (text.length < 24) return false;
  if (item.author_name && WEAK_FAWAID_AUTHORS.has(item.author_name)) return false;
  if (WEAK_FAWAID_PATTERNS.some((pattern) => pattern.test(text))) return false;
  // استثناء: فوائد تحذيرية تبيّن ضعف لفظ مشهور دون الاستدلال به
  const isWarning =
    /لا يثبت|فضعيف|فلا يُستدل|ضعيف الإسناد|لم يثبت/.test(text) &&
    /ضعيف|ضعّف|لا يثبت/.test(item.source || "");
  if (!isWarning && item.source && WEAK_SOURCE_RE.test(item.source)) return false;
  return true;
}

export function filterQualityFawaid<T extends { text?: string; author_name?: string | null; source?: string | null }>(
  items: T[],
): T[] {
  return items.filter(isQualityFawaid);
}
