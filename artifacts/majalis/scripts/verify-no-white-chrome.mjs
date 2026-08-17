/**
 * يمنع bg-white / #fff / bg-background في قوالب الكروم (تخطيط + شيت/درج/حوار).
 * تشغيل: node scripts/verify-no-white-chrome.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORBIDDEN = /\bbg-white\b|#fff(?:fff)?\b|\bbg-background\b/i;
const SKIP_COMMENT = /color:\s*#fff\b/; // نص على داكن مسموح في تعليقات/أيقونات فوق أخضر

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|css)$/.test(name)) acc.push(p);
  }
  return acc;
}

const files = [
  ...walk(join(root, "src/components/layout")),
  join(root, "src/components/ui/sheet.tsx"),
  join(root, "src/components/ui/drawer.tsx"),
  join(root, "src/components/ui/dialog.tsx"),
  join(root, "src/components/ui/alert-dialog.tsx"),
];

const hits = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(root, file);
  for (const [i, line] of text.split("\n").entries()) {
    if (!FORBIDDEN.test(line)) continue;
    if (SKIP_COMMENT.test(line) && /color:\s*#fff/.test(line) && !/background/.test(line)) continue;
    hits.push(`${rel}:${i + 1}: ${line.trim()}`);
  }
}

assert.equal(
  hits.length,
  0,
  `استخدم رموز @theme (--mj-surface / --mj-bg) لا bg-white أو bg-background:\n${hits.join("\n")}`,
);

console.log(`verify-no-white-chrome.mjs: ok (${files.length} ملف)`);
