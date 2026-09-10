#!/usr/bin/env node
/**
 * تقرير تغطية تثبيت نظام التصميم على pages/views.
 * يطابق قواعد ESLint (قيم مباشرة في JSX style/className) — لا بيانات المحتوى.
 *
 *   node scripts/ds-coverage-report.mjs
 *   node scripts/ds-coverage-report.mjs --assert
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const assertMode = process.argv.includes("--assert");
const allowPath = join(root, "eslint-ds-legacy-allowlist.json");
const allow = new Set(JSON.parse(readFileSync(allowPath, "utf8")));

/** نفس روح قيود eslint.config.js designSystemLockRules */
const violRe = [
  /style=\{\{[^}]*fontSize:\s*["'`][^"'`]*?(px|rem|em|%)/i,
  /style=\{\{[^}]*fontSize:\s*`/,
  /style=\{\{[^}]*(?:color|background(?:Color)?|borderColor):\s*["'](?:#|rgb|hsl)/i,
  /className=["'`][^"'`]*text-\[[0-9]/,
  /className=["'`][^"'`]*(?:^|[\s:])(?:text-black|text-white|bg-white|bg-black)(?:\s|$)/,
  /className=\{`[^`]*(?:^|[\s:])(?:text-black|text-white|bg-white|bg-black)(?:\s|$)/,
];

function walk(d, acc = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) {
      if (e === "__tests__" || e === "node_modules") continue;
      walk(p, acc);
    } else if (/\.tsx?$/.test(e) && !/\.test\./.test(e)) acc.push(p);
  }
  return acc;
}

const files = [...walk(join(root, "src/pages")), ...walk(join(root, "src/views"))].filter(
  (f) => !/Mushaf|ImmersiveQuran/.test(f),
);

const violators = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (violRe.some((r) => r.test(src))) {
    violators.push(relative(root, f).replaceAll("\\", "/"));
  }
}

const missingFromAllow = violators.filter((v) => !allow.has(v));
const staleInAllow = [...allow].filter((a) => !violators.includes(a));
const clean = files.length - violators.length;
const coveragePct = Math.round((1000 * clean) / Math.max(files.length, 1)) / 10;

const report = {
  scope: "src/pages + src/views (بدون Mushaf/ImmersiveQuran)",
  metric: "خلو من قيم مباشرة في JSX style/className (مواءمة ESLint DS lock)",
  total: files.length,
  clean,
  violators: violators.length,
  coveragePct,
  allowlistSize: allow.size,
  allowlist: [...allow].sort(),
  missingFromAllow,
  staleInAllow,
  migratedShared: [
    "PageHero",
    "SectionHero",
    "TopicPage",
    "HubCard",
    "CompactSectionHeader",
    "SectionAccordionLayout",
    "ContentCard",
  ],
};

const outJson = join(root, "docs/ds-coverage-report.json");
writeFileSync(outJson, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `DS coverage: ${coveragePct}% (${clean}/${files.length} نظيف) · allowlist=${allow.size} · دين جديد=${missingFromAllow.length} · راكد=${staleInAllow.length}`,
);

if (assertMode) {
  if (missingFromAllow.length) {
    console.error("ملفات مخالفة خارج الـ allowlist:\n", missingFromAllow.join("\n"));
    process.exit(1);
  }
  /* الـ allowlist قد يبقى أوسع من الـ heuristic (أسلوب متعدد الأسطر) — لا نفرض stale كفشل،
   * لكن نطبع تحذيرًا لتقليص يدوي. */
  if (staleInAllow.length) {
    console.warn("تنبيه: allowlist بلا مخالفة heuristic (راجع يدويًا):\n", staleInAllow.join("\n"));
  }
}
