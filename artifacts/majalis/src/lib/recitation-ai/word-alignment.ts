/**
 * word-alignment.ts
 * محاذاة عالمية (Needleman-Wunsch) بين نافذتين قصيرتين من الكلمات:
 * ما سمعه المحرّك الصوتي مؤخرًا (heard window) مقابل الكلمات القادمة
 * المتوقَّعة من النص المرجعي (reference window). وحدة نقية بلا حالة
 * وبلا اعتماد على DOM أو شبكة — قابلة للاختبار مباشرة.
 *
 * تُستخدَم بواسطة VerseAlignmentEngine كـ"نافذة بحث منزلقة": بدل مقارنة
 * كل كلمة منطوقة بالكلمة التالية المتوقَّعة فقط (هش أمام حذف/تبديل/زيادة
 * كلمة واحدة)، تُحاذي دفعة صغيرة من الكلمات المسموعة مقابل نافذة أوسع من
 * المرجع فتُميّز بثقة أعلى بين: كلمة خاطئة (تبديل)، كلمة ناقصة (حذف من
 * المرجع)، كلمة زائدة (إدراج من عند المستخدم).
 */

export type AlignOpType = "match" | "substitute" | "delete" | "insert";

/** delete = كلمة مرجعية لم تُنطَق (ناقصة). insert = كلمة نُطقت ولا مقابل لها في المرجع (زائدة). */
export type AlignOp = {
  type: AlignOpType;
  refIndex: number | null;   // فهرس داخل refWindow، أو null لو insert
  heardIndex: number | null; // فهرس داخل heardWindow، أو null لو delete
};

const MATCH_SCORE = 2;
const SUBSTITUTE_PENALTY = -1;
const GAP_PENALTY = -1;

/**
 * يحاذي heardWindow (ما نُطق) مقابل refWindow (ما هو متوقَّع من المرجع)
 * بخوارزمية Needleman-Wunsch القياسية (محاذاة عالمية لكامل النافذتين).
 * كلا المدخلين نصوص **مطبَّعة مسبقًا** (عبر normalizeQuranWord) — هذه
 * الوحدة لا تُطبّع بنفسها لتبقى عامة وقابلة لإعادة الاستخدام/الاختبار.
 */
export function alignWindow(heardWindow: string[], refWindow: string[]): AlignOp[] {
  const n = refWindow.length;
  const m = heardWindow.length;

  // dp[i][j] = أفضل نتيجة لمحاذاة أول i كلمات مرجعية مع أول j كلمات مسموعة
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + GAP_PENALTY;
  for (let j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + GAP_PENALTY;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchScore = refWindow[i - 1] === heardWindow[j - 1] ? MATCH_SCORE : SUBSTITUTE_PENALTY;
      const diag = dp[i - 1][j - 1] + matchScore;
      const up = dp[i - 1][j] + GAP_PENALTY;   // حذف: كلمة مرجعية بلا مقابل مسموع
      const left = dp[i][j - 1] + GAP_PENALTY; // إدراج: كلمة مسموعة بلا مقابل مرجعي
      dp[i][j] = Math.max(diag, up, left);
    }
  }

  // Traceback — نبني العمليات من النهاية للبداية ثم نعكس الترتيب
  const ops: AlignOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const matchScore = refWindow[i - 1] === heardWindow[j - 1] ? MATCH_SCORE : SUBSTITUTE_PENALTY;
      if (dp[i][j] === dp[i - 1][j - 1] + matchScore) {
        ops.push({
          type: refWindow[i - 1] === heardWindow[j - 1] ? "match" : "substitute",
          refIndex: i - 1,
          heardIndex: j - 1,
        });
        i -= 1;
        j -= 1;
        continue;
      }
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + GAP_PENALTY) {
      ops.push({ type: "delete", refIndex: i - 1, heardIndex: null });
      i -= 1;
      continue;
    }
    // الاحتمال الأخير: إدراج
    ops.push({ type: "insert", refIndex: null, heardIndex: j - 1 });
    j -= 1;
  }

  ops.reverse();
  return ops;
}

/**
 * محاذاة "احتواء" (fitting alignment): تُحاذي heardWindow **بكامله** مقابل
 * **جزء بادئ** من refWindow، دون إجبار المحاذاة على استهلاك بقية refWindow
 * غير المسموعة بعد. ضرورية لمحرك التدفق اللحظي: refWindow دومًا أوسع من
 * heardWindow (نافذة استشراف LOOKAHEAD)، وبقية الكلمات المرجعية غير
 * المستهلَكة ليست "ناقصة" — هي ببساطة لم تُنطَق بعد. الفارق الوحيد عن
 * alignWindow: نقطة انطلاق التتبّع العكسي هي أفضل خلية في **آخر عمود**
 * (كل الكلمات المسموعة استُهلكت) بدل الزاوية اليمنى السفلى حصرًا؛ نفس
 * جدول dp وبنفس عقوبات الحذف/الإدراج/التبديل تمامًا.
 */
export function alignFittingWindow(heardWindow: string[], refWindow: string[]): AlignOp[] {
  const n = refWindow.length;
  const m = heardWindow.length;

  if (m === 0) return [];

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) dp[i][0] = dp[i - 1][0] + GAP_PENALTY;
  for (let j = 1; j <= m; j++) dp[0][j] = dp[0][j - 1] + GAP_PENALTY;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchScore = refWindow[i - 1] === heardWindow[j - 1] ? MATCH_SCORE : SUBSTITUTE_PENALTY;
      const diag = dp[i - 1][j - 1] + matchScore;
      const up = dp[i - 1][j] + GAP_PENALTY;
      const left = dp[i][j - 1] + GAP_PENALTY;
      dp[i][j] = Math.max(diag, up, left);
    }
  }

  // أفضل خلية في العمود الأخير (j=m، كل المسموع استُهلك) — لا نُجبر
  // استهلاك refWindow كاملاً؛ الباقي (i* حتى n) يبقى "لم يُنطَق بعد".
  let bestI = 0;
  let bestScore = dp[0][m];
  for (let i = 1; i <= n; i++) {
    if (dp[i][m] > bestScore) { bestScore = dp[i][m]; bestI = i; }
  }

  const ops: AlignOp[] = [];
  let i = bestI;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const matchScore = refWindow[i - 1] === heardWindow[j - 1] ? MATCH_SCORE : SUBSTITUTE_PENALTY;
      if (dp[i][j] === dp[i - 1][j - 1] + matchScore) {
        ops.push({
          type: refWindow[i - 1] === heardWindow[j - 1] ? "match" : "substitute",
          refIndex: i - 1,
          heardIndex: j - 1,
        });
        i -= 1;
        j -= 1;
        continue;
      }
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + GAP_PENALTY) {
      ops.push({ type: "delete", refIndex: i - 1, heardIndex: null });
      i -= 1;
      continue;
    }
    ops.push({ type: "insert", refIndex: null, heardIndex: j - 1 });
    j -= 1;
  }

  ops.reverse();
  return ops;
}
