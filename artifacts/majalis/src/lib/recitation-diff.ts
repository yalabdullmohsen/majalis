import { normalizeArabic } from "@/shared/arabic-normalize";

export type RecitationWordResult = { text: string; matched: boolean };
export type RecitationDiffResult = {
  words: RecitationWordResult[];
  matchPercent: number;
};

/**
 * يقارن نص الآية الأصلي بما تعرّف عليه محرّك الصوت من تلاوة المستخدم،
 * عبر محاذاة أطول تتابع مشترك (LCS) على مستوى الكلمات المطبَّعة —
 * أدق من مجرد تقاطع Set لأنها تراعي الترتيب ولا تُطابق كلمة مكررة
 * بوهم مضاعف. النص المعروض (words[].text) يبقى بتشكيله الأصلي الكامل؛
 * المطابقة فقط تُجرى على النسخة المطبَّعة (بلا تشكيل).
 */
export function diffRecitation(canonicalText: string, spokenText: string): RecitationDiffResult {
  const canonicalRaw = canonicalText.split(/\s+/).filter(Boolean);
  const canonicalNorm = canonicalRaw.map((w) => normalizeArabic(w));
  const spokenNorm = normalizeArabic(spokenText).split(/\s+/).filter(Boolean);

  const n = canonicalNorm.length;
  const m = spokenNorm.length;

  if (n === 0) return { words: [], matchPercent: 0 };
  if (m === 0) return { words: canonicalRaw.map((text) => ({ text, matched: false })), matchPercent: 0 };

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = canonicalNorm[i - 1] === spokenNorm[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const matched = new Array(n).fill(false);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (canonicalNorm[i - 1] === spokenNorm[j - 1]) {
      matched[i - 1] = true;
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }

  const words = canonicalRaw.map((text, idx) => ({ text, matched: matched[idx] }));
  const matchCount = matched.filter(Boolean).length;
  return { words, matchPercent: Math.round((matchCount / n) * 100) };
}
