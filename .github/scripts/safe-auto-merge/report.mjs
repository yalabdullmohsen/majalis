/**
 * Markdown report for safe auto-merge eligibility (posted on PRs).
 */
import {
  CONTENT_SAFE_PATH_PATTERNS,
  MAX_DELETED_FILES,
  MAX_FILES_FOR_AUTO_MERGE,
  MAX_TOTAL_DELETIONS,
  REPORT_MARKER_BEGIN,
  REPORT_MARKER_END,
  SAFE_LABELS,
} from "./constants.mjs";

/**
 * @param {ReturnType<import('./eligibility.mjs').evaluateEligibility>} result
 * @param {{ prNumber?: number|string, headSha?: string }} meta
 */
export function formatEligibilityReport(result, meta = {}) {
  let status;
  if (result.eligible) {
    status = "✅ **مؤهل للدمج التلقائي** — الفحوصات خضراء؛ سيُفعَّل Auto-merge (squash)";
  } else if (result.waiting) {
    status = "⏳ **بانتظار الفحوصات** — لا فشل نهائي؛ لن يُعطَّل Auto-merge بسبب الانتظار";
  } else {
    status = "🛑 **غير مؤهل للدمج التلقائي** — مراجعة يدوية / شروط ناقصة";
  }

  const typeLine = `\`${result.prType}\`${
    result.labels?.safeMatched?.length
      ? ` · labels: ${result.labels.safeMatched.map((l) => `\`${l}\``).join(", ")}`
      : ""
  }${result.isContentAudit ? " · **content-audit**" : ""}`;

  const blockers =
    result.hardBlockers?.length > 0
      ? result.hardBlockers.map((b) => `- ${b}`).join("\n")
      : result.blockers?.length > 0 && !result.waiting
        ? result.blockers.map((b) => `- ${b}`).join("\n")
        : "_لا يوجد منع نهائي_";

  const waitingLines =
    result.waitBlockers?.length > 0
      ? result.waitBlockers.map((b) => `- ${b}`).join("\n")
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

  const offPolicy =
    result.nonContentFiles?.length > 0
      ? result.nonContentFiles
          .slice(0, 20)
          .map((p) => `- \`${p}\``)
          .join("\n")
      : null;

  const c = result.checks || {};
  const checkLine = (label, row) =>
    `- **${label}:** \`${row?.state || "missing"}\`${row?.name ? ` (${row.name})` : ""}${
      row?.ignoredPreview ? " · _Ignored Build Step_" : ""
    }`;

  const vercelKind = result.vercelPreviewKind || "unknown";
  const vercelHuman =
    vercelKind === "ignored"
      ? "✅ تجاهُل عادي (Ignored/Skipped) — **لا يمنع** content-safe"
      : vercelKind === "green"
        ? "✅ Preview أخضر"
        : vercelKind === "pending"
          ? "⏳ Preview قيد الانتظار"
          : vercelKind === "missing"
            ? "ℹ️ لم يُبلَّغ بعد"
            : vercelKind === "failed"
              ? "❌ فشل Preview حقيقي (يمنع غير content-safe)"
              : "ℹ️ غير معروف";

  const prodLine = result.willDeployProductionAfterMerge
    ? "✅ نعم — بعد الدمج إلى `main` ينشر **Vercel Production** (`majalis-majalis`) تلقائيًا"
    : "⛔ لا — لن يُدمَج تلقائيًا؛ لا نشر Production من هذا المسار";

  const fileBits = result.fileSummary || {};
  const flags = [
    result.hasMigration ? "migration/SQL" : null,
    result.hasIos ? "iOS" : null,
    result.hasCicd ? "CI/CD" : null,
    result.authHits?.length ? "auth/security" : null,
    result.isContentAudit ? "content-audit" : null,
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
    `| إشارات | ${flags || "—"} |`,
    `| Vercel Preview | ${vercelHuman} |`,
    `| نشر Production بعد الدمج | ${prodLine} |`,
    `| head | \`${meta.headSha || "?"}\` |`,
    meta.prNumber ? `| PR | #${meta.prNumber} |` : null,
    "",
    "### أسباب المنع النهائي",
    blockers,
    "",
    "### بانتظار الفحوصات (لا فشل نهائي)",
    waitingLines,
    "",
    "### تحذيرات",
    warnings,
    "",
    "### نتائج الفحوصات",
    checkLine("CI / Verify build (typecheck + lint + test/content-guard + build)", c.verifyBuild),
    checkLine("Preview smoke", c.previewSmoke),
    checkLine("Vercel check (build + git diff clean)", c.vercelCheck),
    checkLine("Vercel deployment (majalis-majalis)", c.vercelDeploy),
    checkLine("postgres-integration", c.postgres),
    checkLine("Color contrast (when present)", c.colorContrast),
    checkLine("iOS static (when present / required)", c.iosStatic),
    "",
    "### الملفات الخطرة",
    danger,
    "",
    offPolicy
      ? ["### ملفات خارج نطاق content-safe", offPolicy, ""].join("\n")
      : "",
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
    `- Path lane: \`${result.pathLane?.lane || "?"}\` (build=${result.pathLane?.needBuild ? "yes" : "no"}, mushaf=${result.pathLane?.needMushaf ? "yes" : "no"}, postgres=${result.pathLane?.needPostgres ? "yes" : "no"})`,
    `- Labels اختيارية للتصنيف (ليست شرطًا للتغييرات منخفضة المخاطر): ${SAFE_LABELS.map((l) => `\`${l}\``).join(", ")}`,
    `- فحوص skipped مقبولة فقط إن قال path-lane إنها غير مطلوبة — لا تخطّي فحص مطلوب.`,
    `- \`content-safe\` / \`safe:content\`: مسارات مسموحة فقط — \`${CONTENT_SAFE_PATH_PATTERNS.map((r) => r.source).join(" | ")}\``,
    "- Vercel Preview ignored/skipped **لا يمنع** تدقيق المحتوى الآمن.",
    "- Production ينشر فقط بعد الدمج إلى `main` (مشروع **majalis-majalis**).",
    "- `release-train-ready` ينتظر قطار الإصدار فقط (لا دمج فوري).",
    "- TestFlight / Supabase migrations: يدوي فقط.",
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
