#!/usr/bin/env node
/**
 * PR matrix report — تصنيف PRs المفتوحة لـ main (قابلية الدمج / تعارض / خطر).
 * يكتب Markdown + JSON تحت artifacts/release-train/
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { classifyPullRequest } from "./classify.mjs";
import { qualifyPullRequest } from "./qualify.mjs";
import { READY_LABEL, DOMAIN_LABELS } from "./constants.mjs";

function ghJson(args) {
  const r = spawnSync("gh", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "gh failed");
  return JSON.parse(r.stdout || "[]");
}

function bucketOf(pr, q, classification) {
  if (pr.isDraft) return "draft";
  if (pr.mergeable === "CONFLICTING" || pr.mergeStateStatus === "CONFLICTING") return "conflicting";
  if (classification?.blocked) return "level_c_risky";
  if ((pr.changedFiles || pr.files?.length || 0) > 40) return "oversized";
  if (q?.eligible) return "train_eligible";
  if (pr.mergeable === "MERGEABLE" && !pr.isDraft) return "mergeable_review";
  return "other";
}

const root = process.env.RELEASE_TRAIN_ROOT || process.cwd();
const outDir = join(root, "artifacts/release-train");
mkdirSync(outDir, { recursive: true });

const prs = ghJson([
  "pr",
  "list",
  "--base",
  "main",
  "--state",
  "open",
  "--limit",
  "80",
  "--json",
  "number,title,isDraft,mergeable,mergeStateStatus,labels,files,changedFiles,additions,deletions,headRefName,url,reviewDecision,statusCheckRollup,author",
]);

const rows = [];
const buckets = {};

for (const raw of prs) {
  const labels = (raw.labels || []).map((l) => l.name || l);
  const files = (raw.files || []).map((f) => f.path || f);
  const pr = {
    ...raw,
    labels,
    files,
    fileCount: files.length || raw.changedFiles || 0,
  };
  const classification = classifyPullRequest({
    files,
    title: pr.title,
    body: "",
    labels,
  });
  const q = qualifyPullRequest(pr, { ciGreen: true, requireCiGreen: false });
  const bucket = bucketOf(pr, q, classification);
  buckets[bucket] = (buckets[bucket] || 0) + 1;
  rows.push({
    number: pr.number,
    title: pr.title,
    bucket,
    draft: pr.isDraft,
    mergeable: pr.mergeable,
    reviewDecision: pr.reviewDecision,
    files: pr.fileCount,
    level: classification.level,
    levelReasons: classification.reasons,
    qualify: q.reason,
    labels,
    hasTrainReady: labels.map((l) => l.toLowerCase()).includes(READY_LABEL),
    domains: DOMAIN_LABELS.filter((d) => labels.map((l) => l.toLowerCase()).includes(d)),
    url: pr.url,
    head: pr.headRefName,
  });
}

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const jsonPath = join(outDir, `pr-matrix-${stamp}.json`);
const mdPath = join(outDir, `pr-matrix-${stamp}.md`);

writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), buckets, rows }, null, 2));

const md = [
  `# PR Matrix — ${new Date().toISOString()}`,
  "",
  "## Buckets",
  "",
  ...Object.entries(buckets).map(([k, v]) => `- **${k}**: ${v}`),
  "",
  "## Rows",
  "",
  "| PR | Bucket | Level | Files | Qualify | Labels | Title |",
  "|---|---|---|---|---|---|---|",
  ...rows.map(
    (r) =>
      `| #${r.number} | ${r.bucket} | ${r.level} | ${r.files} | ${r.qualify} | ${(r.labels || []).join(", ")} | ${String(r.title).replace(/\|/g, "/")} |`,
  ),
  "",
  "## Policy notes",
  "",
  "- لا تُدمَج PRs متعارضة أو Draft أو Level C أو >40 ملفًا عبر القطار.",
  "- #602/#618/#620/#626: متعارضة — استخراج انتقائي فقط، لا دمج أعمى.",
  `- وسوم القطار: \`${READY_LABEL}\` + واحد من: ${DOMAIN_LABELS.join(", ")}`,
  "",
].join("\n");

writeFileSync(mdPath, md);
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
console.log(JSON.stringify(buckets, null, 2));
