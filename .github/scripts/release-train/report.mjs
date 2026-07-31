/**
 * Release Train markdown report builder.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { formatKuwaitReleaseTag, REPORT_DIR, reportFilename } from "./constants.mjs";

/**
 * @param {object} data
 */
export function buildReportMarkdown(data) {
  const tag = data.trainTag || formatKuwaitReleaseTag(data.now || new Date());
  const merged = data.merged || [];
  const excluded = data.excluded || [];
  const health = data.health || { results: [] };
  const lines = [
    `# ${tag}`,
    "",
    `- **Run:** ${data.runUrl || "(local)"}`,
    `- **Started (UTC):** ${data.startedAt || ""}`,
    `- **Finished (UTC):** ${data.finishedAt || ""}`,
    `- **Baseline SHA:** \`${data.baselineSha || ""}\``,
    `- **Production SHA:** \`${data.productionSha || ""}\``,
    `- **Deployment status:** ${data.deployStatus || "unknown"}`,
    `- **Rollback:** ${data.rollbackStatus || "Not Needed"}`,
    "",
    "## Merged PRs",
    "",
  ];

  if (merged.length === 0) {
    lines.push("_None_");
  } else {
    lines.push("| PR | Title | Author | Domains | Level | Merge SHA |");
    lines.push("|---|---|---|---|---|---|");
    for (const m of merged) {
      lines.push(
        `| #${m.number} | ${escapeCell(m.title)} | ${m.author || ""} | ${(m.domains || []).join(", ")} | ${m.level || ""} | \`${m.mergeSha || ""}\` |`,
      );
    }
  }

  lines.push("", "## Excluded PRs", "");
  if (excluded.length === 0) {
    lines.push("_None_");
  } else {
    lines.push("| PR | Reason | Detail |");
    lines.push("|---|---|---|");
    for (const e of excluded) {
      lines.push(`| #${e.number || "?"} | ${escapeCell(e.reason)} | ${escapeCell((e.detail || e.reasons || []).toString())} |`);
    }
  }

  lines.push("", "## Health checks", "");
  lines.push("| Path | Status | OK | Detail | ms |");
  lines.push("|---|---|---|---|---|");
  for (const r of health.results || []) {
    lines.push(`| ${r.path} | ${r.status} | ${r.ok ? "✅" : "❌"} | ${escapeCell(r.detail)} | ${r.ms} |`);
  }
  if ((health.results || []).length === 0) {
    lines.push("| — | — | — | skipped | — |");
  }

  lines.push("", "## Notes", "");
  lines.push(data.notes || "_No additional notes._");
  lines.push("");
  return lines.join("\n");
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}

/**
 * Write report under artifacts/release-train/reports/
 * @param {object} data
 * @param {{ root?: string, now?: Date }} [opts]
 */
export function writeReport(data, opts = {}) {
  const root = opts.root || process.cwd();
  const now = opts.now || data.now || new Date();
  const name = reportFilename(now);
  const abs = join(root, REPORT_DIR, name);
  mkdirSync(dirname(abs), { recursive: true });
  const md = buildReportMarkdown({ ...data, now, trainTag: data.trainTag || formatKuwaitReleaseTag(now) });
  writeFileSync(abs, md, "utf8");
  return { path: abs, relative: join(REPORT_DIR, name), markdown: md };
}
