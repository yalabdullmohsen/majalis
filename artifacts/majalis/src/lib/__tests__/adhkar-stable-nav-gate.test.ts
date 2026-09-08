/**
 * بوابة: أزرار تنقّل الأذكار ثابتة الموضع (بطاقة/عداد/تحكم بارتفاع ثابت).
 * تشغيل: node --import tsx src/lib/__tests__/adhkar-stable-nav-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const view = read("src/pages/worship/ui/AdhkarView.tsx");
const nav = read("src/pages/worship/ui/AdhkarFocusNav.tsx");
const css = read("src/styles/pages/adhkar.css");
const tasbih = read("src/styles/pages/tasbih.css");

assert.match(view, /AdhkarFocusNav/, "يستخدم مكوّن التنقل الموحّد");
assert.match(view, /adhkar-focus-card/, "بطاقة الذكر موجودة");
assert.doesNotMatch(
  view,
  /key=\{animKey\}\s+className="adhkar-focus-card/,
  "لا يُعاد تركيب البطاقة كاملة عند تغيير الذكر (يمنع قفزة التخطيط)",
);

assert.match(nav, /data-adhkar-controls="1"/);
assert.match(nav, /data-adhkar-next="1"/);
assert.match(nav, /aria-label="الذكر التالي"/);
assert.match(nav, /aria-label="الذكر السابق"/);
assert.match(nav, /التفاصيل/);

assert.match(css, /\.adhkar-focus-card\s*\{[\s\S]*?min-height:\s*12\.5rem/);
assert.match(css, /\.adhkar-focus-card\s*\{[\s\S]*?height:\s*12\.5rem/);
assert.match(css, /\.adhkar-focus-controls\s*\{[\s\S]*?min-height:\s*7\.25rem/);
assert.match(css, /\.adhkar-focus-nav\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
assert.match(css, /\.adhkar-focus-btn\s*\{[\s\S]*?min-height:\s*44px/);
assert.match(css, /\.adhkar-focus-btn:active:not\(:disabled\)\s*\{[\s\S]*?scale\(0\.98\)/);
assert.doesNotMatch(
  css,
  /@keyframes adhkarFadeIn\s*\{[^}]*translateY/,
  "رسوم الظهور بلا translateY يدفع التخطيط",
);

assert.match(css, /\.adhkar-page--focus \.adhkar-tapper-zone\s*\{[\s\S]*?height:\s*11\.5rem/);
assert.match(tasbih, /\.adhkar-tapper-zone\s*\{[\s\S]*?height:\s*11\.5rem/);
assert.match(view, /styles\/pages\/tasbih\.css/, "تحميل أنماط العداد مع صفحة الأذكار");

console.log("adhkar-stable-nav-gate.test.ts: ok");
