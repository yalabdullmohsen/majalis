/**
 * Detect quiz / QA / import-test rows mislabeled as fawaid (benefits).
 */

const QUIZ_FAWAID_PATTERNS = [
  /\[import-\d+\]\s*$/i,
  /^فائدة:\s*.+\s—\s*(?:من|ما|في|إلى|كم|أين|متى|هل)\s/i,
  /^فائدة:\s*.+\s—\s*.+\?\s*$/,
  /\b(?:e2e|mock|placeholder|test data)\b/i,
  /^فائدة:\s/i,
  /\b(?:question|verification)\b/i,
];

const QUIZ_KEYWORDS = /(?:^|\s)(?:question|سؤال|اختبار|quiz|e2e|mock|placeholder|import)(?:\s|$)/i;

/**
 * @param {string} text
 */
export function isQuizLikeFawaidText(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (QUIZ_KEYWORDS.test(t)) return true;
  return QUIZ_FAWAID_PATTERNS.some((re) => re.test(t));
}

/**
 * @param {string} text
 */
export function isValidFawaidText(text) {
  const t = String(text || "").trim();
  if (t.length < 24) return false;
  return !isQuizLikeFawaidText(t);
}
