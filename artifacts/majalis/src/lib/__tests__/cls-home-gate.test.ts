/**
 * بوابة CLS — تمنع عودة صدفة HTML وتحصّن حجز hsh-steps.
 * القياس الفعلي = LHCI (3 جولات). هذه البوابة = حماية من التراجع الهيكلي.
 * تشغيل: node --import tsx src/lib/__tests__/cls-home-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const critical = readFileSync(resolve(root, "src/styles/critical-first-paint.css"), "utf8");
const fontsUi = readFileSync(resolve(root, "src/styles/fonts-ui.css"), "utf8");
const lhci = readFileSync(resolve(root, "lighthouserc.cjs"), "utf8");

assert.doesNotMatch(html, /mj-home-lcp-static|mj-app-mount/, "لا صدفة/ mount منفصل");
assert.match(critical, /\.hsh-steps[\s\S]*min-height:\s*22rem/, "حجز ارتفاع hsh-steps");
assert.match(critical, /\.hsh-step[\s\S]*min-height:\s*6\.25rem/, "حجز ارتفاع hsh-step");
assert.match(fontsUi, /amiri-700-ar[\s\S]*font-display:\s*optional/, "Amiri 700 optional — بلا CLS");
assert.match(fontsUi, /Aref Ruqaa[\s\S]*font-display:\s*optional/, "Aref Ruqaa optional — بلا CLS");
assert.match(lhci, /cumulative-layout-shift.*maxNumericValue: 0\.02/, "LHCI CLS ≤0.020");

console.log("cls-home-gate.test.ts: ok");
