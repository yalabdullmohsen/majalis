/**
 * توليد تقرير صيانة تلقائية (JSON + Markdown).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AUTOMATION_CONTRACT, RISK } from "./policy.mjs";

/**
 * @param {Array<object>} findings
 * @param {{ generatedAt?: string, root?: string }} meta
 */
export function buildReport(findings, meta = {}) {
  const generatedAt = meta.generatedAt || new Date().toISOString();
  const byRisk = {
    [RISK.SAFE_AUTO]: [],
    [RISK.LOW_PR]: [],
    [RISK.NEEDS_REVIEW]: [],
    [RISK.NEEDS_CONTENT_REVIEW]: [],
    [RISK.BLOCKED]: [],
  };
  for (const f of findings) {
    const r = f.risk || RISK.NEEDS_REVIEW;
    if (!byRisk[r]) byRisk[r] = [];
    byRisk[r].push(f);
  }

  const summary = {
    generatedAt,
    total: findings.length,
    counts: Object.fromEntries(Object.entries(byRisk).map(([k, v]) => [k, v.length])),
  };

  return { summary, byRisk, findings, contract: AUTOMATION_CONTRACT };
}

/**
 * @param {ReturnType<typeof buildReport>} report
 */
export function toMarkdown(report) {
  const lines = [];
  lines.push("# تقرير الصيانة التلقائية");
  lines.push("");
  lines.push(`- **الوقت:** ${report.summary.generatedAt}`);
  lines.push(`- **إجمالي الإيجادات:** ${report.summary.total}`);
  for (const [k, n] of Object.entries(report.summary.counts)) {
    lines.push(`- **${k}:** ${n}`);
  }
  lines.push("");
  lines.push("## الإيجادات");
  if (!report.findings.length) {
    lines.push("_لا إيجادات في هذه الجولة._");
  } else {
    for (const f of report.findings) {
      lines.push(
        `- \`[${f.risk || "?"}/${f.severity || "info"}]\` **${f.kind}** — ${f.message}${f.path ? ` (\`${f.path}\`)` : ""}`,
      );
    }
  }
  lines.push("");
  lines.push("## ماذا يعمل تلقائيًا");
  for (const x of report.contract.automatic) lines.push(`- ${x}`);
  lines.push("");
  lines.push("## ما لا يُنفَّذ تلقائيًا");
  for (const x of report.contract.neverAutomatic) lines.push(`- ${x}`);
  lines.push("");
  lines.push("## يحتاج موافقة بشرية");
  for (const x of report.contract.humanApproval) lines.push(`- ${x}`);
  lines.push("");
  lines.push("## الدمج والنشر");
  lines.push(
    "- PR منخفض الخطورة + فحوصات خضراء → `safe-auto-merge` / Auto-merge squash → `auto-deploy` يتحقق من `/version.json`.",
  );
  lines.push(
    "- PR عالي الخطورة أو `needs-content-review` → لا دمج تلقائي حتى موافقة.",
  );
  return `${lines.join("\n")}\n`;
}

/**
 * @param {string} outDir
 * @param {ReturnType<typeof buildReport>} report
 */
export function writeReportFiles(outDir, report) {
  mkdirSync(outDir, { recursive: true });
  const stamp = report.summary.generatedAt.slice(0, 10);
  const jsonPath = join(outDir, `auto-maintenance-${stamp}.json`);
  const mdPath = join(outDir, `auto-maintenance-${stamp}.md`);
  const latestJson = join(outDir, "auto-maintenance-latest.json");
  const latestMd = join(outDir, "auto-maintenance-latest.md");
  const json = JSON.stringify(report, null, 2);
  const md = toMarkdown(report);
  writeFileSync(jsonPath, json);
  writeFileSync(mdPath, md);
  writeFileSync(latestJson, json);
  writeFileSync(latestMd, md);
  return { jsonPath, mdPath, latestJson, latestMd };
}
