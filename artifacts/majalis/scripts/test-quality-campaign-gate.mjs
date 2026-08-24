#!/usr/bin/env node
/**
 * بوابة حملة الجودة: طبقة DS الدلالية + شريط الأوفلاين (2026-08-25).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const violations = [];

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf-8");
}

const tokens = read("src/styles/design-tokens.css");
for (const name of [
  "--ds-background",
  "--ds-surface",
  "--ds-surfaceElevated",
  "--ds-textPrimary",
  "--ds-textSecondary",
  "--ds-accent",
  "--ds-border",
  "--ds-muted",
  "--ds-danger",
  "--ds-success",
]) {
  if (!tokens.includes(name)) violations.push(`design-tokens: ناقص ${name}`);
}

const banner = read("src/components/OfflineBanner.tsx");
if (!banner.includes("أنت غير متصل، سيتم عرض المحتوى المحفوظ")) {
  violations.push("OfflineBanner: رسالة الأوفلاين غير مطابقة");
}

const offlineCss = read("src/styles/components/language-offline.css");
if (/color:\s*var\(--mj-bg\)/.test(offlineCss) && offlineCss.includes(".offline-banner")) {
  violations.push("offline-banner: لا تستخدم --mj-bg لنص الشريط (يفشل في الوضع الليلي)");
}
if (!offlineCss.includes("on-dark-body")) {
  violations.push("offline-banner: يجب استخدام on-dark-body فوق السطح الداكن");
}

const indexCss = read("src/index.css");
if (/\.offline-banner\s*\{/.test(indexCss)) {
  violations.push("index.css: لا تكرار لـ .offline-banner — المصدر language-offline.css");
}

const sw = read("public/sw.js");
if (!sw.includes("staleWhileRevalidate")) {
  violations.push("sw.js: استراتيجية SWR مطلوبة لـ /data/*.json");
}
if (!sw.includes("/offline.html")) {
  violations.push("sw.js: يجب precache لـ offline.html");
}

if (violations.length) {
  console.error(`✗ بوابة جودة الحملة: ${violations.length} مخالفة\n`);
  violations.forEach((v) => console.error("  • " + v));
  process.exit(1);
}
console.log("✓ بوابة جودة الحملة: DS tokens + offline banner + SW");
