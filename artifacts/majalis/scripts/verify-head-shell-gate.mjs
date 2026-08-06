#!/usr/bin/env node
/**
 * بوابة رأس الصفحة (الجولة الثالثة — A0):
 * 1) يمنع عودة user-scalable / maximum-scale في viewport فعلي.
 * 2) يمنع meta keywords.
 * 3) يفرض صيغة viewport الوحيدة المسموحة في HTML.
 *
 * التشغيل: node scripts/verify-head-shell-gate.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWED_VIEWPORT = "width=device-width, initial-scale=1, viewport-fit=cover";

function walk(path, out = []) {
  let st;
  try {
    st = statSync(path);
  } catch {
    return out;
  }
  if (st.isFile()) {
    out.push(path);
    return out;
  }
  if (!st.isDirectory()) return out;
  for (const name of readdirSync(path)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    walk(join(path, name), out);
  }
  return out;
}

/** أزل تعليقات المصدر حتى لا تُحسب إشارات التوثيق مخالفات */
function stripComments(src, file) {
  if (file.endsWith(".css")) {
    return src.replace(/\/\*[\s\S]*?\*\//g, "");
  }
  if (/\.(tsx?|jsx?|mjs)$/.test(file)) {
    return src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
  }
  if (file.endsWith(".html")) {
    return src.replace(/<!--[\s\S]*?-->/g, "");
  }
  return src;
}

const issues = [];
const htmlFiles = [
  join(appRoot, "index.html"),
  ...walk(join(appRoot, "seo-prerender")).filter((f) => f.endsWith(".html")),
];
const codeFiles = [
  ...walk(join(appRoot, "src")),
  ...walk(join(appRoot, "scripts")),
].filter((f) => /\.(tsx?|jsx?|mjs|css)$/.test(f));

for (const file of htmlFiles) {
  const rel = relative(appRoot, file);
  const src = stripComments(readFileSync(file, "utf8"), file);

  if (/<meta\s+name=["']keywords["']/i.test(src)) {
    issues.push(`${rel}: meta keywords غير مسموح`);
  }

  const vp = src.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
  if (!vp) {
    issues.push(`${rel}: وسم viewport مفقود`);
  } else if (vp[1] !== ALLOWED_VIEWPORT) {
    issues.push(`${rel}: viewport غير مسموح «${vp[1]}»`);
  } else if (/user-scalable|maximum-scale/i.test(vp[1])) {
    issues.push(`${rel}: viewport يمنع التكبير`);
  }
}

for (const file of codeFiles) {
  const rel = relative(appRoot, file);
  const src = stripComments(readFileSync(file, "utf8"), file);
  // قيم viewport فعلية فقط (سلسلة content / قالب)
  if (/["'`][^"'`]*user-scalable\s*=\s*no[^"'`]*["'`]/i.test(src)
    || /["'`][^"'`]*maximum-scale\s*=\s*1[^"'`]*["'`]/i.test(src)) {
    issues.push(`${rel}: سلسلة viewport تمنع التكبير`);
  }
  if (/name:\s*["']keywords["']|["']keywords["']\s*,\s*[^)]*upsertMeta|upsertMeta\(\s*["']name["']\s*,\s*["']keywords["']/i.test(src)) {
    issues.push(`${rel}: كتابة meta keywords في وقت التشغيل`);
  }
}

if (issues.length) {
  console.error("❌ بوابة رأس الصفحة فشلت:\n");
  for (const issue of issues.slice(0, 50)) console.error(`  - ${issue}`);
  if (issues.length > 50) console.error(`  … و${issues.length - 50} أخرى`);
  process.exit(1);
}

console.log(
  `✓ بوابة رأس الصفحة: ${htmlFiles.length} HTML · viewport مسموح · بلا keywords · بلا منع تكبير`,
);
