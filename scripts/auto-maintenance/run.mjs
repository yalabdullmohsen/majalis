#!/usr/bin/env node
/**
 * نقطة دخول الصيانة التلقائية.
 *
 *   node scripts/auto-maintenance/run.mjs
 *   node scripts/auto-maintenance/run.mjs --no-network
 *   AUTO_MAINTENANCE_SKIP_NETWORK=1 node scripts/auto-maintenance/run.mjs
 *
 * لا يفتح PR بنفسه إلا مع --propose-pr ومع GH_TOKEN (في CI).
 * لا يلمس محتوى شرعيًا.
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runAllScans } from "./scanners.mjs";
import { buildReport, writeReportFiles } from "./report.mjs";
import { RISK, LABELS, canAutoApply } from "./policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = new Set(process.argv.slice(2));
const noNetwork = args.has("--no-network") || process.env.AUTO_MAINTENANCE_SKIP_NETWORK === "1";
const proposePr = args.has("--propose-pr");
const failOnBlocked = args.has("--fail-on-blocked");

const findings = await runAllScans(root, { network: !noNetwork });
const report = buildReport(findings, { generatedAt: new Date().toISOString(), root });
const outDir = resolve(root, "reports/auto-maintenance");
const paths = writeReportFiles(outDir, report);

console.log(`auto-maintenance: ${report.summary.total} findings`);
console.log(`  report: ${paths.latestMd}`);
for (const [k, n] of Object.entries(report.summary.counts)) {
  if (n) console.log(`  ${k}: ${n}`);
}

const autoEligible = findings.filter((f) => canAutoApply(f) || f.risk === RISK.SAFE_AUTO);
if (autoEligible.length) {
  console.log(`\nقابل لإصلاح آمن (عدد ${autoEligible.length}) — لا تطبيق تلقائي في هذه الجولة بدون مراجعة مسار CI.`);
}

if (proposePr && process.env.GH_TOKEN) {
  const day = new Date().toISOString().slice(0, 10);
  const branch = `auto/fix-${day}-maintenance-scan`;
  console.log(`\n[--propose-pr] فرع مقترح: ${branch}`);
  console.log(`وسوم مقترحة: ${LABELS.MAINTENANCE_SAFE}, ${LABELS.SAFE_AUTO_MERGE}`);
  const blocked = findings.filter(
    (f) => f.risk === RISK.BLOCKED || f.risk === RISK.NEEDS_CONTENT_REVIEW,
  );
  if (blocked.length) {
    console.log(`تحذير: ${blocked.length} إيجاد يحتاج مراجعة — لا تفعّل auto-merge.`);
    console.log(`أضف وسم: ${LABELS.NEEDS_CONTENT_REVIEW} أو ${LABELS.RISKY_MANUAL}`);
  }
  // إنشاء الفرع/الـPR يبقى عبر workflow (gh) — هنا نطبع القالب فقط
  console.log("عنوان PR المقترح: fix(auto): إصلاح أخطاء مكتشفة تلقائيًا");
} else if (proposePr) {
  console.warn("[--propose-pr] يحتاج GH_TOKEN — تُخطّى خطوة فتح الـPR");
}

if (failOnBlocked) {
  const blocked = findings.filter((f) => f.risk === RISK.BLOCKED && f.severity === "critical");
  // أسرار ظاهرة فقط تفشل؛ ملخص npm audit لا يفشل البوابة اليومية
  const secrets = blocked.filter((f) => f.kind === "secret-rotation");
  if (secrets.length) {
    console.error("فشل: أسرار ظاهرة مكتشفة");
    process.exit(2);
  }
}

process.exit(0);
