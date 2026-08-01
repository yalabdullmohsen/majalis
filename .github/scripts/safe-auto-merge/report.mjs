/**
 * Markdown report for safe auto-merge eligibility (posted on PRs).
 */
import {
  MAX_DELETED_FILES,
  MAX_FILES_FOR_AUTO_MERGE,
  MAX_TOTAL_DELETIONS,
  REPORT_MARKER_BEGIN,
  REPORT_MARKER_END,
  SAFE_LABELS,
} from "./constants.mjs";

/**
 * @param {import('./eligibility.mjs').evaluateEligibility extends Function ? any : never} result
 * @param {{ prNumber?: number|string, headSha?: string }} meta
 */
export function formatEligibilityReport(result, meta = {}) {
  const status = result.eligible
    ? "✅ **مؤهل للدمج التلقائي** (بعد نجاح الفحوصات واستقرار الـ head SHA)"
    : "🛑 **غير مؤهل — مراجعة يدوية / شروط ناقصة**";

  const typeLine = `\`${result.prType}\`${
    result.labels?.safeMatched?.length
      ? ` · labels: ${result.labels.safeMatched.map((l) => `\`${l}\``).join(", ")}`
      : ""
  }`;

  const blockers =
    result.blockers?.length > 0
      ? result.blockers.map((b) => `- ${b}`).join("\n")
      : "_لا يوجد_";

  const warnings =
    result.warnings?.length > 0
      ? result.warnings.map((w) => `- ${w}`).join("\n")
      : "_لا يوجد_";

  const danger =
    result.dangerousFiles?.length > 0
      ? result.dangerousFiles
          .slice(0, 20)
          .map((d) => `- \`${d.path}\``)
          .join("\n")
      : "_لا توجد ملفات خطرة وفق السياسة_";

  const c = result.checks || {};
  const checkLine = (label, row) =>
    `- **${label}:** \`${row?.state || "missing"}\`${row?.name ? ` (${row.name})` : ""}`;

  const fileBits = result.fileSummary || {};
  const flags = [
    result.hasMigration ? "migration/SQL" : null,
    result.hasIos ? "iOS" : null,
    result.hasCicd ? "CI/CD" : null,
    result.authHits?.length ? "auth/security" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    REPORT_MARKER_BEGIN,
    "## تقرير الدمج التلقائي الآمن",
    "",
    status,
    "",
    `| | |`,
    `|---|---|`,
    `| نوع PR | ${typeLine} |`,
    `| الملفات | ${fileBits.fileCount ?? "?"} (حد ${MAX_FILES_FOR_AUTO_MERGE}) |`,
    `| الحذف | ${fileBits.totalDeletions ?? 0} سطر / ${fileBits.deletedFiles ?? 0} ملف (حدود ${MAX_TOTAL_DELETIONS}/${MAX_DELETED_FILES}) |`,
    `| إشارات خطر | ${flags || "—"} |`,
    `| head | \`${meta.headSha || "?"}\` |`,
    meta.prNumber ? `| PR | #${meta.prNumber} |` : null,
    "",
    "### أسباب المنع",
    blockers,
    "",
    "### تحذيرات",
    warnings,
    "",
    "### نتائج الفحوصات",
    checkLine("CI / Verify build", c.verifyBuild),
    checkLine("Preview smoke", c.previewSmoke),
    checkLine("Vercel check (build + git diff clean)", c.vercelCheck),
    checkLine("Vercel deployment", c.vercelDeploy),
    checkLine("postgres-integration", c.postgres),
    checkLine("Color contrast (when present)", c.colorContrast),
    checkLine("iOS static (when present / required)", c.iosStatic),
    "",
    "### الملفات الخطرة",
    danger,
    "",
    result.needsManualReview
      ? [
          "### مراجعة يدوية مطلوبة",
          "- لا يُفعَّل Auto-merge لهذا الـPR.",
          "- لا يُغلق الـPR تلقائيًا — يرجى مراجعة بشرية قبل الدمج.",
          result.suggestedAddLabels?.length
            ? `- وسوم مقترحة: ${result.suggestedAddLabels.map((l) => `\`${l}\``).join(", ")}`
            : null,
          "",
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    "### سياسة سريعة",
    `- Labels المسموحة للدمج التلقائي: ${SAFE_LABELS.map((l) => `\`${l}\``).join(", ")}`,
    "- `release-train-ready` ينتظر قطار الإصدار فقط (لا دمج فوري).",
    "- بعد الدمج: Vercel ينشر الموقع من `main` — **بدون** TestFlight و**بدون** `supabase db push`.",
    "- TestFlight: tag `v*.*.*` أو `workflow_dispatch` فقط.",
    "- Supabase: `workflow_dispatch` + `apply=true` (+ `confirm_include_all` لـ `--include-all`).",
    "",
    REPORT_MARKER_END,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Upsert report body into an existing comment body if present.
 * @param {string} existing
 * @param {string} report
 */
export function upsertReportBody(existing, report) {
  const prev = String(existing || "");
  if (prev.includes(REPORT_MARKER_BEGIN) && prev.includes(REPORT_MARKER_END)) {
    const re = new RegExp(
      `${escapeRegExp(REPORT_MARKER_BEGIN)}[\\s\\S]*?${escapeRegExp(REPORT_MARKER_END)}`,
      "m",
    );
    return prev.replace(re, report.trim());
  }
  return report.trim();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
