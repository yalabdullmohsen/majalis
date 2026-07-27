/**
 * wer.ts
 * حساب Word Error Rate نصيًا لمحاذاة المرجع ↔ الفرضية (Levenshtein على مستوى
 * الكلمات). يُستخدم في harness الاختبارات — ليس مقياسًا صوتيًا مباشرًا.
 */
export type WerResult = {
  wer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  referenceLength: number;
};

export function computeWer(reference: string[], hypothesis: string[]): WerResult {
  const n = reference.length;
  const m = hypothesis.length;
  if (n === 0) {
    return {
      wer: m === 0 ? 0 : 1,
      substitutions: 0,
      deletions: 0,
      insertions: m,
      referenceLength: 0,
    };
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  const back: ("eq" | "sub" | "del" | "ins")[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill("eq"),
  );

  for (let i = 0; i <= n; i++) {
    dp[i][0] = i;
    if (i > 0) back[i][0] = "del";
  }
  for (let j = 0; j <= m; j++) {
    dp[0][j] = j;
    if (j > 0) back[0][j] = "ins";
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (reference[i - 1] === hypothesis[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        back[i][j] = "eq";
      } else {
        const sub = dp[i - 1][j - 1] + 1;
        const del = dp[i - 1][j] + 1;
        const ins = dp[i][j - 1] + 1;
        const best = Math.min(sub, del, ins);
        dp[i][j] = best;
        if (best === sub) back[i][j] = "sub";
        else if (best === del) back[i][j] = "del";
        else back[i][j] = "ins";
      }
    }
  }

  let i = n;
  let j = m;
  let substitutions = 0;
  let deletions = 0;
  let insertions = 0;
  while (i > 0 || j > 0) {
    const op = back[i][j];
    if (op === "eq") {
      i--;
      j--;
    } else if (op === "sub") {
      substitutions++;
      i--;
      j--;
    } else if (op === "del") {
      deletions++;
      i--;
    } else {
      insertions++;
      j--;
    }
  }

  return {
    wer: (substitutions + deletions + insertions) / n,
    substitutions,
    deletions,
    insertions,
    referenceLength: n,
  };
}
