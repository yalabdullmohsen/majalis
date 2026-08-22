/**
 * بوابة CLS — تمنع عودة صدفة HTML وتحصّن حجز hsh-steps.
 * القياس الفعلي = LHCI (3 جولات). هذه البوابة = حماية من التراجع الهيكلي.
 * تشغيل: node --import tsx src/lib/__tests__/cls-home-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const { getPreviewThresholds } = require(resolve(root, "scripts/lhci-thresholds.cjs"));
const preview = getPreviewThresholds();

const html = readFileSync(resolve(root, "index.html"), "utf8");
const critical = readFileSync(resolve(root, "src/styles/critical-first-paint.css"), "utf8");
const fontsUi = readFileSync(resolve(root, "src/styles/fonts-ui.css"), "utf8");
const lhciRc = require(resolve(root, "lighthouserc.cjs"));

assert.doesNotMatch(html, /mj-home-lcp-static|mj-app-mount/, "لا صدفة نصّية/ mount منفصل");
assert.match(html, /id="mj-boot-skeleton"/, "هيكل إقلاع فوري");
assert.match(html, /#mj-boot-skeleton\s*\{[\s\S]*position:\s*fixed/, "الهيكل ثابت لا يزيح #root");
assert.match(critical, /\.home-start-here[\s\S]*min-height:\s*9\.5rem/, "حجز ارتفاع ابدأ من هنا");
assert.match(fontsUi, /amiri-700-ar[\s\S]*font-display:\s*optional/, "Amiri 700 optional — بلا CLS");
assert.match(fontsUi, /Aref Ruqaa[\s\S]*font-display:\s*optional/, "Aref Ruqaa optional — بلا CLS");
assert.equal(
  lhciRc.ci.assert.assertions["cumulative-layout-shift"][1].maxNumericValue,
  preview.cls,
  `LHCI CLS ≤${preview.cls} (main+10%)`,
);

console.log("cls-home-gate.test.ts: ok");
