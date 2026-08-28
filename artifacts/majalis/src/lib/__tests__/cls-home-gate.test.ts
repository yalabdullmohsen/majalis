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
const fontsBold = readFileSync(resolve(root, "src/styles/fonts-ui-bold.css"), "utf8");
const lhciRc = require(resolve(root, "lighthouserc.cjs"));

assert.doesNotMatch(html, /mj-home-lcp-static|mj-app-mount/, "لا صدفة نصّية/ mount منفصل");
assert.doesNotMatch(html, /id="mj-boot-skeleton"/, "بلا هيكل تحميل كامل الشاشة");
assert.doesNotMatch(html, /#mj-boot-skeleton/, "بلا أنماط هيكل إقلاع حاجب");
assert.match(html, /id="mj-(launch-splash|startup-gate)"/, "Startup Gate تقنية");
assert.match(html, /MIN_MS\s*=\s*500/, "حد أدنى 500ms");
assert.match(html, /MAX_MS\s*=\s*1500/, "سقف انتظار 1500ms");
assert.match(critical, /\.hsh-steps[\s\S]*min-height:\s*22rem/, "حجز ارتفاع hsh-steps");
assert.match(critical, /\.hsh-step[\s\S]*min-height:\s*6\.25rem/, "حجز ارتفاع hsh-step");
assert.match(critical, /\.home-page-hero\.page-hero-mj[\s\S]*min-height:\s*11rem/, "حجز ارتفاع هيرو الرئيسية");
assert.match(critical, /\.hus-field[\s\S]*min-height:\s*52px/, "حجز شريط البحث");
assert.match(critical, /\.daily-wird-card[\s\S]*min-height:\s*28rem/, "حجز ورد اليوم يطابق المحتوى");
assert.match(critical, /\.navbar-v3__tagline-mark[\s\S]*aspect-ratio/, "حجز وردمارك الهيدر");
assert.doesNotMatch(
  readFileSync(resolve(root, "src/styles/components/home-brand-title.css"), "utf8"),
  /min-height:\s*unset/,
  "لا min-height:unset في هيرو الرئيسية",
);
assert.doesNotMatch(fontsUi, /amiri-700/, "لا Amiri 700 في fonts-ui الإقلاع");
assert.match(fontsUi, /amiri-400-ar[\s\S]*font-display:\s*block/, "Amiri 400 block — بلا FOUT");
assert.match(fontsBold, /amiri-700-ar[\s\S]*font-display:\s*optional/, "Amiri 700 optional مؤجّل — بلا CLS");
assert.match(fontsBold, /Aref Ruqaa[\s\S]*font-display:\s*optional/, "Aref Ruqaa 700 optional");
assert.equal(
  lhciRc.ci.assert.assertions["cumulative-layout-shift"][1].maxNumericValue,
  preview.cls,
  `LHCI CLS ≤${preview.cls} (main+10%)`,
);

console.log("cls-home-gate.test.ts: ok");
