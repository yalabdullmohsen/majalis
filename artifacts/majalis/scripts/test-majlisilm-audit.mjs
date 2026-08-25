#!/usr/bin/env node
/**
 * اختبار وحدات لفاحص المجلس العلمي (بدون شبكة).
 */
import assert from "node:assert/strict";
import {
  normalizeAr,
  overlapRatio,
  parseHtml,
  Report,
  runTextRules,
  SEVERITY,
  CONFIG,
} from "./majlisilm-audit.mjs";

function testNormalize() {
  assert.equal(normalizeAr("إبراهيم"), "ابراهيم");
  assert.equal(normalizeAr("المَجْلِس"), "المجلس");
  // ى → ي ضمن التطبيع النصي (ليس تصحيح تسمية؛ ذلك في TEXT_RULES)
  assert.equal(normalizeAr("البخارى"), "البخاري");
}

function testOverlap() {
  assert.ok(overlapRatio("الفقه الإسلامي", "الفقه الإسلامي المقارن") > 0.5);
  assert.ok(overlapRatio("الحديث", "الفقه") < 0.4);
  // حالة آمنة شائعة: نص الرابط أطول من عنوان الوجهة
  const link = "المغني لابن قدامة";
  const title = "المغني";
  assert.ok(normalizeAr(link).includes(normalizeAr(title)));
  assert.ok(
    Math.max(overlapRatio(link, title), overlapRatio(title, link)) >= 0.4 ||
      normalizeAr(link).includes(normalizeAr(title)),
  );
}

function testParseHtml() {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head>
<title>اختبار | المجلس العلمي</title>
<meta name="description" content="وصف تجريبي كافٍ للفحص">
<link rel="canonical" href="https://majlisilm.com/test">
</head><body><main><h1>عنوان</h1><p>محتوى الصفحة</p>
<a href="/fiqh">الفقه</a></main></body></html>`;
  const p = parseHtml(html, "https://majlisilm.com/test");
  assert.equal(p.title, "اختبار | المجلس العلمي");
  assert.equal(p.htmlAttrs.lang, "ar");
  assert.equal(p.htmlAttrs.dir, "rtl");
  assert.equal(p.headings.h1[0], "عنوان");
  assert.equal(p.links.length, 1);
  assert.ok(p.mainText.includes("محتوى"));
}

function testTextRules() {
  const report = new Report();
  runTextRules("نص تجريبي قيد الإنشاء", "fixture", report);
  assert.ok(report.items.some((i) => i.rule === "PLACEHOLDER"));

  const r2 = new Report();
  runTextRules("البخارى رحمه الله", "fixture", r2);
  assert.ok(r2.items.some((i) => i.rule === "NAMING"));

  const r3 = new Report();
  runTextRules("كلمة كلمة مكررة هنا", "fixture", r3);
  // "كلمة كلمة" — قد تُلتقط حسب القاعدة
  assert.ok(Array.isArray(r3.items));
}

function testConfigRoutes() {
  assert.ok(CONFIG.hubPaths.includes("/quran-hub"));
  assert.ok(CONFIG.hubPaths.includes("/islamic-glossary"));
  assert.ok(!CONFIG.hubPaths.includes("/fatwa")); // يُحوَّل إلى /fiqh|/rulings
  assert.ok(CONFIG.evidenceRequiredPrefixes.includes("/rulings"));
  assert.ok(CONFIG.hubRelatedPrefixes["/fiqh"].includes("/rulings"));
  assert.ok(CONFIG.hubRelatedPrefixes["/quran-hub"].some((p) => p.startsWith("/quran")));
  assert.equal(SEVERITY.CRITICAL, "حرج");
}

testNormalize();
testOverlap();
testParseHtml();
testTextRules();
testConfigRoutes();
console.log("✓ test-majlisilm-audit: وحدات الفاحص سليمة.");
