#!/usr/bin/env node
/**
 * بوابة iOS edge-to-edge (دفعة ١ — الأساس):
 * - viewport موحّد بلا maximum-scale / user-scalable في المحتوى
 * - theme-color سطحي من site.config (#F2F4F3 / #101614)
 * - رموز --inset-* موجودة في theme.css
 * - لا 100vh في ملفات الكروم الأساسية
 *
 * دفعة ٢ ستوسّع الحظر على كل src + env() خارج theme.
 *
 * تشغيل: node scripts/verify-ios-edge-gate.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const issues = [];

function read(rel) {
  return readFileSync(resolve(appRoot, rel), "utf8");
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
if (!indexHtml.includes(`content="${theme}"`) || !indexHtml.includes(`content="${themeDark}"`)) {
  issues.push("index.html: theme-color يجب أن يطابق سطح الصفحة من site.config");
}

const themeCss = read("src/styles/theme.css");
for (const tok of [
  "--inset-top",
  "--inset-bottom",
  "--inset-left",
  "--inset-right",
  "--gutter",
  "--gutter-end",
  "--header-h",
  "--nav-h",
  "--content-pb",
]) {
  if (!themeCss.includes(tok)) issues.push(`theme.css ناقص الرمز ${tok}`);
}

const chromeFiles = [
  "src/index.css",
  "src/styles/final-release.css",
  "src/styles/ios-edge.css",
  "src/styles/brand-v4.css",
  "src/styles/components/app-bottom-sheet.css",
];
for (const rel of chromeFiles) {
  if (!existsSync(resolve(appRoot, rel))) {
    issues.push(`${rel} مفقود`);
    continue;
  }
  const src = read(rel);
  if (/(?<![\w-])100vh(?![\w-])/.test(src)) {
    issues.push(`${rel}: استخدم 100svh/100dvh بدل 100vh`);
  }
  if (/content\s*=\s*["'][^"']*(?:maximum-scale|user-scalable\s*=\s*no)/i.test(src)) {
    issues.push(`${rel}: viewport مقيَّد ممنوع`);
  }
}

const ensure = read("src/lib/ensure-chrome-meta.ts");
if (!ensure.includes("VIEWPORT_CONTENT") || !ensure.includes("viewport-fit=cover")) {
  issues.push("ensure-chrome-meta.ts يجب أن يفرض viewport-fit=cover");
}
if (!existsSync(resolve(appRoot, "src/styles/ios-edge.css"))) {
  issues.push("ios-edge.css مطلوب");
}
if (!existsSync(resolve(appRoot, "src/components/SafeAreaDebugOverlay.tsx"))) {
  issues.push("SafeAreaDebugOverlay مطلوب");
}

if (issues.length) {
  console.error(`❌ بوابة iOS edge فشلت (${issues.length}):\n`);
  for (const i of issues) console.error(`  - ${i}`);
  process.exit(1);
}
console.log("✓ بوابة iOS edge-to-edge (دفعة ١) نجحت");
