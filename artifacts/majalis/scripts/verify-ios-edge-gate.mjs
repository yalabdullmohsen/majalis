#!/usr/bin/env node
/**
 * بوابة iOS edge-to-edge:
 * - viewport موحّد بلا maximum-scale / user-scalable في المحتوى
 * - theme-color سطحي من site.config (#F2F4F3 / #101614)
 * - رموز --inset-* في theme.css
 * - لا 100vh في src
 * - env(safe-area-*) فقط داخل theme.css
 *
 * تشغيل: node scripts/verify-ios-edge-gate.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const issues = [];

function read(rel) {
  return readFileSync(resolve(appRoot, rel), "utf8");
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(p, out);
    } else if (/\.(css|tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

const site = JSON.parse(read("site.config.json"));
const theme = site.themeColor;
const themeDark = site.themeColorDark;
if (theme !== "#F2F4F3") issues.push(`themeColor يجب #F2F4F3 (وجد ${theme})`);
if (themeDark !== "#101614") issues.push(`themeColorDark يجب #101614 (وجد ${themeDark})`);

const indexHtml = read("index.html");
const VP = "width=device-width, initial-scale=1, viewport-fit=cover";
if (!indexHtml.includes(`content="${VP}"`)) {
  issues.push(`index.html: viewport يجب أن يكون بالضبط: ${VP}`);
}
if (/content="[^"]*(?:maximum-scale|user-scalable\s*=\s*no)/i.test(indexHtml)) {
  issues.push("index.html: maximum-scale / user-scalable في viewport ممنوعان");
}

const themeCss = read("src/app/styles/theme.css");
for (const tok of [
  "--inset-top",
  "--inset-bottom",
  "--inset-left",
  "--inset-right",
  "--gutter",
  "--header-h",
  "--nav-h",
  "--content-pb",
]) {
  if (!themeCss.includes(tok)) issues.push(`theme.css ناقص الرمز ${tok}`);
}

const srcRoot = resolve(appRoot, "src");
for (const file of walk(srcRoot)) {
  const rel = relative(srcRoot, file).replace(/\\/g, "/");
  const src = readFileSync(file, "utf8");
  if (/(?<![\w-])100vh(?![\w-])/.test(src)) {
    issues.push(`${rel}: استخدم 100svh/100dvh بدل 100vh`);
  }
  if (/content\s*=\s*["'][^"']*(?:maximum-scale|user-scalable\s*=\s*no)/i.test(src)) {
    issues.push(`${rel}: viewport مقيَّد ممنوع`);
  }
  if (rel !== "app/styles/theme.css") {
    const codeLines = src.split("\n").filter((l) => {
      const t = l.trim();
      if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return false;
      return /env\(\s*safe-area-inset-/i.test(l);
    });
    if (codeLines.length) {
      issues.push(`${rel}: env(safe-area-*) فقط في theme.css — استخدم var(--inset-*)`);
    }
  }
}

if (!existsSync(resolve(appRoot, "src/styles/ios-edge.css"))) {
  issues.push("ios-edge.css مطلوب");
}

if (issues.length) {
  console.error(`❌ بوابة iOS edge فشلت (${issues.length}):\n`);
  for (const i of issues.slice(0, 50)) console.error(`  - ${i}`);
  if (issues.length > 50) console.error(`  … و${issues.length - 50} أخرى`);
  process.exit(1);
}
console.log("✓ بوابة iOS edge-to-edge نجحت");
