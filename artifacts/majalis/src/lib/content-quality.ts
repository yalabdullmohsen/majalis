/** Filters weak or placeholder seed content from public display. */

const WEAK_FAWAID_AUTHORS = new Set(["فائدة مختارة"]);

const WEAK_FAWAID_PATTERNS = [
  /^ملخص منظم/,
  /^متن كلاسيكي/,
  /^تفريغ:/,
  /^ملخص مرئي/,
];

export function isQualityFawaid(item: {
  text?: string;
  author_name?: string | null;
}): boolean {
  const text = (item.text || "").trim();
  if (text.length < 24) return false;
  if (item.author_name && WEAK_FAWAID_AUTHORS.has(item.author_name)) return false;
  return !WEAK_FAWAID_PATTERNS.some((pattern) => pattern.test(text));
}

export function filterQualityFawaid<T extends { text?: string; author_name?: string | null }>(
  items: T[],
): T[] {
  return items.filter(isQualityFawaid);
}
