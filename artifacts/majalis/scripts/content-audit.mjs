#!/usr/bin/env node
/**
 * content:audit — فحص مركزي (قراءة فقط) → reports/content-audit-raw.json
 * ملاحظة: جرد المخزون القديم نُقل إلى scripts/content-inventory.mjs
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  SCAN_DIRS,
  walkFiles,
  readText,
  loadDictionaries,
  collectIssues,
  severityRank,
} from "./lib/content-qa-core.mjs";

const dicts = loadDictionaries();
const files = walkFiles(SCAN_DIRS);
const issues = [];
let scanned = 0;

for (const rel of files) {
  let text;
  try {
    text = readText(rel);
  } catch {
    continue;
  }
  scanned += 1;
  issues.push(...collectIssues(rel, text, dicts));
}

issues.sort(
  (a, b) =>
    severityRank(b.severity) - severityRank(a.severity) ||
    a.file.localeCompare(b.file, "ar"),
);

const summary = {
  generatedAt: new Date().toISOString(),
  scannedFiles: scanned,
  issueCount: issues.length,
  bySeverity: {
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  },
  autoFixable: issues.filter((i) => i.autoFixable).length,
};

fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "reports/content-audit-raw.json"),
  JSON.stringify({ summary, issues }, null, 2),
  "utf8",
);

console.log(JSON.stringify({ ok: true, ...summary, raw: "reports/content-audit-raw.json" }, null, 2));
