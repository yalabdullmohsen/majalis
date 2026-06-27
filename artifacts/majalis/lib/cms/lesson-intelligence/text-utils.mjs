/**
 * Text normalization + fuzzy matching utilities.
 */
export function normalizeArabicText(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ة]/g, "ه")
    .replace(/[ى]/g, "ي")
    .replace(/\s+/g, " ")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, "");
}

export function levenshtein(a, b) {
  const s = normalizeArabicText(a);
  const t = normalizeArabicText(b);
  if (!s || !t) return Math.max(s.length, t.length);
  const m = s.length;
  const n = t.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function fuzzySimilarity(a, b) {
  const na = normalizeArabicText(a);
  const nb = normalizeArabicText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length, 1);
  return Math.max(0, 1 - dist / maxLen);
}

export function tokenOverlapScore(a, b) {
  const partsA = normalizeArabicText(a).split(" ").filter(Boolean);
  const partsB = normalizeArabicText(b).split(" ").filter(Boolean);
  if (!partsA.length || !partsB.length) return 0;
  const overlap = partsA.filter((p) => partsB.some((q) => q.includes(p) || p.includes(q))).length;
  return overlap / Math.max(partsA.length, partsB.length, 1);
}

export function compositeLessonKey(parsed) {
  return [
    parsed.title,
    parsed.speaker_name || parsed.sheikh_name,
    parsed.mosque || parsed.location,
    parsed.start_date || parsed.gregorian_date || parsed.day_of_week,
    parsed.lesson_time || parsed.time,
  ]
    .filter(Boolean)
    .join("|");
}
