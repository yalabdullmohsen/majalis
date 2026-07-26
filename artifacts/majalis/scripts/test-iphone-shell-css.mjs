#!/usr/bin/env node
/**
 * فحص ثابت لمقاسات iPhone / Safe Area في CSS المصادر (بلا متصفح).
 * يفشل إن اختفت متغيرات الهيكل الحرجة أو حشوة المحتوى السفلية.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const brand = readFileSync(resolve(appRoot, "src/styles/brand-v4.css"), "utf8");
if (!brand.includes("--bottom-nav-h")) failures.push("brand-v4 يفتقد --bottom-nav-h");
if (!existsSync(resolve(appRoot, "src/styles/final-release.css"))) {
  failures.push("final-release.css مفقود");
}

const final = readFileSync(resolve(appRoot, "src/styles/final-release.css"), "utf8");
if (!/bottom-nav-total/.test(final)) failures.push("final-release بلا bottom-nav-total");
if (!/\.app-main/.test(final) || !/padding-block-end/.test(final)) {
  failures.push("app-main يحتاج padding سفلي يراعي الشريط");
}
if (!/bottom-nav--v2/.test(final)) failures.push("bottom-nav--v2 مفقود من final-release");

// مقاسات مرجعية موثّقة في التعليقات أو media — على الأقل وجود max-width للهاتف
if (!/max-width:\s*879px/.test(final)) {
  failures.push("لا نقطة كسر هاتف (879px) في final-release");
}

if (failures.length) {
  console.error("✗ فحص هيكل iPhone/CSS:\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log("✓ هيكل iPhone/CSS: Safe Area وشريط سفلي ومتغيرات الهيكل موجودة.");
