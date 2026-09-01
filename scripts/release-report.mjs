#!/usr/bin/env node
/**
 * تقرير إصدار تلقائي — reports/release-report.md
 *
 * Usage:
 *   node scripts/release-report.mjs
 *   node scripts/release-report.mjs --build-ok --build-failed
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  REPORTS_DIR,
  ensureReportsDir,
  shortSha,
  PRODUCTION_BASE,
} from "./release-guard-lib.mjs";

function readJson(name) {
  const p = resolve(REPORTS_DIR, name);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

const buildOkFlag = process.argv.includes("--build-ok");
const buildFailedFlag = process.argv.includes("--build-failed");

const predeploy = readJson(".release-predeploy.json");
const postdeploy = readJson(".release-postdeploy.json");
const now = new Date().toISOString();
const sha = shortSha();

const failures = [
  ...(predeploy?.failures || []),
  ...(postdeploy?.failures || []),
];
const warnings = [
  ...(predeploy?.warnings || []),
  ...(postdeploy?.warnings || []),
];

let buildOk = predeploy?.postBuild ? predeploy?.buildOk : buildOkFlag;
if (buildFailedFlag) buildOk = false;

const smokeOk = postdeploy?.ok ?? false;
const predeployOk = predeploy?.ok ?? false;

const seoWarnings = (warnings || []).filter((w) => /sitemap|robots|noindex|canonical/i.test(w));
const pwaWarnings = (warnings || []).filter((w) => /sw\.js|manifest|cache|PWA/i.test(w));
const secWarnings = (warnings || []).filter((w) => /security|HSTS|header/i.test(w));
const perfWarnings = (warnings || []).filter((w) => /LCP|performance|slow/i.test(w));

const coreOk = predeployOk && smokeOk && buildOk !== false;
const recommendation = coreOk && failures.length === 0 ? "PASS" : "BLOCK_RELEASE";

const lines = [
  "# تقرير الإصدار — سُنّة",
  "",
  `| الحقل | القيمة |`,
  `|-------|--------|`,
  `| وقت الفحص | ${now} |`,
  `| الإصدار (مختصر) | \`${sha}\` |`,
  `| الإنتاج | ${PRODUCTION_BASE} |`,
  `| predeploy | ${predeployOk ? "✅ نجح" : predeploy ? "❌ فشل" : "⏭ لم يُشغَّل"} |`,
  `| build | ${buildOk === true ? "✅ نجح" : buildOk === false ? "❌ فشل" : "⏭ لم يُسجَّل"} |`,
  `| smoke (postdeploy) | ${smokeOk ? "✅ نجح" : postdeploy ? "❌ فشل" : "⏭ لم يُشغَّل"} |`,
  `| **التوصية** | **${recommendation}** |`,
  "",
];

if (failures.length) {
  lines.push("## روابط/فحوصات فاشلة", "");
  for (const f of failures) lines.push(`- ${f}`);
  lines.push("");
}

if (seoWarnings.length) {
  lines.push("## تحذيرات SEO", "");
  for (const w of seoWarnings) lines.push(`- ${w}`);
  lines.push("");
}

if (pwaWarnings.length) {
  lines.push("## تحذيرات PWA", "");
  for (const w of pwaWarnings) lines.push(`- ${w}`);
  lines.push("");
}

if (secWarnings.length) {
  lines.push("## تحذيرات Security headers", "");
  for (const w of secWarnings) lines.push(`- ${w}`);
  lines.push("");
}

if (perfWarnings.length) {
  lines.push("## تحذيرات الأداء", "");
  for (const w of perfWarnings) lines.push(`- ${w}`);
  lines.push("");
}

if (warnings.length && !seoWarnings.length && !pwaWarnings.length && !secWarnings.length && !perfWarnings.length) {
  lines.push("## تحذيرات أخرى", "");
  for (const w of warnings) lines.push(`- ${w}`);
  lines.push("");
}

lines.push("## ملاحظات", "");
lines.push("- الاسم الرسمي: **سُنّة** — لا Majlisilm في الواجهة العامة.");
lines.push("- عند BLOCK_RELEASE: راجع `docs/rollback.md` قبل أي نشر يدوي.");
lines.push("- فحص النطاق (apex): `docs/domain-checklist.md`.");
lines.push("");

ensureReportsDir();
const outPath = resolve(REPORTS_DIR, "release-report.md");
writeFileSync(outPath, lines.join("\n"), "utf8");

writeFileSync(
  resolve(REPORTS_DIR, ".release-report.json"),
  JSON.stringify({ at: now, shortSha: sha, recommendation, failures, warnings }, null, 2) + "\n",
  "utf8",
);

console.log(`▶ release-report → ${outPath}`);
console.log(`   التوصية: ${recommendation}\n`);

if (recommendation === "BLOCK_RELEASE") process.exit(1);
