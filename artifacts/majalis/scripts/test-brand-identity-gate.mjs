#!/usr/bin/env node
/**
 * بوابة هوية بصرية — تمنع رجوع ألوان خارج الهوية (بنفسجي/نيلي/رمادي بارد/
 * زمرد تراثي) في طبقات الصفحات والمكوّنات عالية الظهور.
 *
 * لا تفحص كل المستودع (بذور بيانات/admin قد تبقي ألوان تصنيف مؤقتة)؛
 * النطاق: CSS الصفحات + مكوّنات الواجهة العامة + ملفات الهوية.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const stylesRoot = join(root, "src", "styles");

/** ألوان ممنوعة في نطاق الهوية العامة (hex بلا #، case-insensitive). */
const BANNED = [
  { hex: "7c3aed", why: "purple accent — استخدم --brand / --accent" },
  { hex: "8b5cf6", why: "violet accent — استخدم --brand-hover" },
  { hex: "4f46e5", why: "indigo — استخدم --brand" },
  { hex: "312e81", why: "indigo deep — استخدم --brand-deep" },
  { hex: "6366f1", why: "indigo-500 — استخدم --brand" },
  { hex: "0e6e52", why: "legacy mushaf emerald — استخدم --brand-deep" },
  { hex: "2563eb", why: "tailwind blue — خارج الهوية" },
  { hex: "3b82f6", why: "tailwind blue — خارج الهوية" },
];

/** رصد كثافة hex خام خارج طبقات الهوية (تحذير فقط — الهجرة تدريجية). */
const HARDCODE_HEX_RE = /#[0-9a-f]{3,8}\b/gi;
const TOKEN_FILE_RE = /brand-v4|design-system|elite-2026|modern-2026|majalis-v2|index\.css$/i;

const SCAN_DIRS = [
  join(stylesRoot, "pages"),
  join(stylesRoot, "components"),
];
const SCAN_FILES = [
  join(stylesRoot, "brand-v4.css"),
  join(stylesRoot, "brand-v4-components.css"),
  join(stylesRoot, "brand-v4-contrast-fixes.css"),
  join(stylesRoot, "pages", "prayer-times.css"),
  join(stylesRoot, "quran.css"),
  join(stylesRoot, "mushaf-v2.css"),
  join(stylesRoot, "recitation-ai.css"),
];

/** ملفات مستثناة مؤقتًا (admin / أدوات داخلية). */
const ALLOW_PATH_RE = /\/(admin|prophet-stories-admin)\b/i;

function walkCss(dir, out = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkCss(p, out);
    else if (name.endsWith(".css")) out.push(p);
  }
  return out;
}

const files = new Set(SCAN_FILES);
for (const d of SCAN_DIRS) walkCss(d).forEach((f) => files.add(f));

const hits = [];
for (const file of files) {
  if (ALLOW_PATH_RE.test(file)) continue;
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lower = src.toLowerCase();
  for (const ban of BANNED) {
    const re = new RegExp(`#${ban.hex}\\b`, "i");
    if (re.test(lower)) {
      const line = lower.split("\n").findIndex((l) => re.test(l)) + 1;
      hits.push({
        file: relative(root, file),
        line,
        hex: `#${ban.hex}`,
        why: ban.why,
      });
    }
  }
}

const brandV4 = readFileSync(join(stylesRoot, "brand-v4.css"), "utf8");
const requiredTokens = [
  "--color-bg",
  "--color-bg-soft",
  "--color-surface",
  "--color-surface-elevated",
  "--color-text",
  "--color-text-muted",
  "--color-primary",
  "--color-primary-strong",
  "--color-primary-soft",
  "--color-accent",
  "--color-border",
  "--color-danger",
  "--color-success",
  "--shadow-soft",
  "--radius-card",
  "--space-page",
];
const missingTokens = requiredTokens.filter((t) => !brandV4.includes(`${t}:`));

/** ملفات صفحات/مكوّنات ما زالت تعتمد hex خامًا كثيرًا (خارج طبقات الهوية). */
const hardcodeFiles = [];
for (const file of files) {
  if (ALLOW_PATH_RE.test(file) || TOKEN_FILE_RE.test(file)) continue;
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const matches = src.match(HARDCODE_HEX_RE) || [];
  if (matches.length >= 6) {
    hardcodeFiles.push({
      file: relative(root, file),
      count: matches.length,
    });
  }
}
hardcodeFiles.sort((a, b) => b.count - a.count);

console.log("=== brand-identity-gate ===\n");
if (missingTokens.length) {
  console.error("  ✗ missing tokens in brand-v4.css:");
  for (const t of missingTokens) console.error(`    - ${t}`);
}
if (hits.length) {
  console.error(`  ✗ ${hits.length} banned color literal(s):\n`);
  for (const h of hits.slice(0, 40)) {
    console.error(`    ${h.file}:${h.line}  ${h.hex} — ${h.why}`);
  }
  if (hits.length > 40) console.error(`    … +${hits.length - 40} more`);
}
if (hardcodeFiles.length) {
  console.log(
    `  ⚠ ${hardcodeFiles.length} page/component CSS files still hard-code ≥6 hex (migrate gradually):`,
  );
  for (const h of hardcodeFiles.slice(0, 8)) {
    console.log(`    ${h.file} (${h.count} hex)`);
  }
  if (hardcodeFiles.length > 8) console.log(`    … +${hardcodeFiles.length - 8} more`);
}

if (missingTokens.length || hits.length) {
  console.error("\nBrand identity gate FAILED.\n");
  process.exit(1);
}

console.log("  ✓ required --color-* tokens present");
console.log(`  ✓ no banned hex in ${files.size} scanned CSS files`);
console.log("\nBrand identity gate passed.\n");
