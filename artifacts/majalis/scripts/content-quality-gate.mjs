#!/usr/bin/env node
/**
 * content:quality / verify:content
 * يعيد الفحص بعد الإصلاح ويكتب reports/content-audit-report.md
 * يفشل عند critical/high أو روابط محتوى مكسورة.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  ROOT,
  SCAN_DIRS,
  walkFiles,
  readText,
  loadDictionaries,
  collectIssues,
  severityRank,
} from "./lib/content-qa-core.mjs";

function run(rel) {
  const r = spawnSync(process.execPath, [path.join(ROOT, rel)], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

function readJson(rel, fb) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return fb;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function esc(s) {
  return String(s ?? "")
    .replace(/\|/g, "/")
    .replace(/\n/g, " ")
    .slice(0, 90);
}

// أحدث نتائج
run("scripts/content-audit.mjs");
run("scripts/content-links-check.mjs");

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

const fixLog = readJson("reports/content-fix-log.json", {
  filesTouched: 0,
  totalEdits: 0,
  changed: [],
});
const fixFiles = fixLog.cumulative?.filesTouched ?? fixLog.filesTouched ?? 0;
const fixEdits = fixLog.cumulative?.totalEdits ?? fixLog.totalEdits ?? 0;
const fixChanged = fixLog.cumulative?.changed ?? fixLog.changed ?? [];
const links = readJson("reports/content-links-report.json", {
  broken: [],
  brokenCount: 0,
});
for (const b of links.broken || []) issues.push(b);

const bySev = {
  critical: issues.filter((i) => i.severity === "critical").length,
  high: issues.filter((i) => i.severity === "high").length,
  medium: issues.filter((i) => i.severity === "medium").length,
  low: issues.filter((i) => i.severity === "low").length,
};

const lines = [];
lines.push("# تقرير تدقيق المحتوى — سُنّة / majalis");
lines.push("");
lines.push("> كُتب **بعد** الإصلاح الآمن وإعادة الفحص.");
lines.push("");
lines.push(`التاريخ: ${new Date().toISOString()}`);
lines.push("");
lines.push("## الملخص");
lines.push("");
lines.push(`- الملفات المفحوصة: **${scanned}**`);
lines.push(
  `- الإصلاحات الآمنة: **${fixEdits}** تعديلًا في **${fixFiles}** ملفًا`,
);
lines.push(`- الروابط المكسورة (محتوى): **${links.brokenCount || 0}**`);
lines.push(
  `- المتبقي: **${issues.length}** (critical=${bySev.critical}, high=${bySev.high}, medium=${bySev.medium}, low=${bySev.low})`,
);
lines.push("");
lines.push("## ما تم إصلاحه");
lines.push("");
lines.push("| الملف | نوع الإصلاح | عدد التعديلات |");
lines.push("|---|---|---|");
if (!fixChanged.length) {
  lines.push("| — | لا إصلاحات لزمَت / أو أُصلحت سابقًا | 0 |");
} else {
  for (const c of fixChanged.slice(0, 250)) {
    lines.push(
      `| \`${c.file}\` | ${esc((c.kinds || []).slice(0, 3).join("؛ "))} | ${c.edits} |`,
    );
  }
}
lines.push("");
lines.push("## الأخطاء المتبقية فقط");
lines.push("");
lines.push("| الملف | النص | المشكلة | التصحيح المقترح | الخطورة | سبب عدم الإصلاح التلقائي |");
lines.push("|---|---|---|---|---|---|");
const rows = [
  ...issues.filter((i) => i.severity === "critical" || i.severity === "high"),
  ...issues.filter((i) => i.severity === "medium" || i.severity === "low").slice(0, 40),
];
if (!rows.length) {
  lines.push("| — | — | لا مشاكل متبقية مانعة | — | — | — |");
} else {
  for (const i of rows.slice(0, 160)) {
    lines.push(
      `| \`${i.file}\` | ${esc(i.text)} | ${esc(i.problem)} | ${esc(i.suggested)} | ${i.severity} | ${esc(i.reason)} |`,
    );
  }
}
lines.push("");
lines.push("## يحتاج مراجعة شرعية");
lines.push("");
lines.push(
  "لم تُغيَّر مسائل خلافية أو أحكام غير قطعية. استُثني لفظ «القِران» في سياق المناسك من استبدال «القرآن».",
);
lines.push("");
lines.push("## مصادر التصحيحات القطعية");
lines.push("");
lines.push(
  "- رسم «القرآن / السنة / أهل السنة والجماعة» وفق الاستعمال الكتابي المعتمد عند أهل السنة.",
);
lines.push(
  "- أسماء: ابن تيمية، ابن القيم، الإمام النووي، عائشة، أبي بكر، أبي هريرة — ضبط إملائي شائع في المصادر السنية.",
);
lines.push("");
lines.push("## نتيجة البوابة");
lines.push("");
const fail = bySev.critical > 0 || bySev.high > 0 || (links.brokenCount || 0) > 0;
lines.push(
  fail
    ? "**فشل** — بقيت critical/high أو روابط محتوى مكسورة."
    : "**نجاح** — لا critical/high ولا روابط محتوى مكسورة.",
);
lines.push("");

fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "reports/content-audit-report.md"), lines.join("\n"), "utf8");

console.log(
  JSON.stringify(
    {
      ok: !fail,
      scannedFiles: scanned,
      remaining: issues.length,
      bySeverity: bySev,
      brokenLinks: links.brokenCount || 0,
      report: "reports/content-audit-report.md",
    },
    null,
    2,
  ),
);

if (fail) process.exitCode = 1;
