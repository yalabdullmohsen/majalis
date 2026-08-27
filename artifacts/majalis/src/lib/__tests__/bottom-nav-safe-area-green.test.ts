/**
 * بوابة: الشريط السفلي يطابق لون الصفحة (--surface-app) لا أسود/أخضر داكن.
 * node --import tsx src/lib/__tests__/bottom-nav-safe-area-green.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const html = read("index.html");
assert.match(html, /viewport-fit=cover/);

const finalCss = read("src/styles/final-release.css");
assert.match(
  finalCss,
  /padding-bottom:\s*var\(--inset-bottom\)/,
  "الشريط السفلي يستخدم var(--inset-bottom) لمنطقة الأمان",
);
assert.match(finalCss, /backdrop-filter:\s*none/);
assert.match(
  finalCss,
  /\.bottom-nav[\s\S]*?background-color:\s*var\(--surface-app/,
  "خلفية الشريط السفلي تطابق --surface-app",
);
assert.doesNotMatch(
  finalCss,
  /\.bottom-nav[\s\S]{0,400}?background-color:\s*#ffffff\s*!important/,
  "الشريط السفلي لا يفرض أبيض مستقل",
);
assert.doesNotMatch(
  finalCss,
  /\.bottom-nav[\s\S]{0,800}?background-image:\s*linear-gradient\([\s\S]*?--mj-splash/,
  "لا تدرّج أسود/أخضر تحت الشريط السفلي",
);
assert.match(finalCss, /#root,\s*\n\.app-shell/);
assert.match(
  finalCss,
  /html\s*\{[\s\S]*?background:\s*var\(--surface-app/,
  "html بسطح التطبيق لا mj-splash",
);

const foundation = read("src/styles/m2030/foundation.css");
assert.match(foundation, /background-color:\s*var\(--surface-app/);
assert.doesNotMatch(
  foundation,
  /body\s*\{[\s\S]*?--mj-splash,\s*#0E1A15/,
  "body بلا bleed أسود",
);

const nav = read("src/styles/m2030/navigation.css");
assert.match(nav, /\.bottom-nav[\s\S]*?background-color:\s*var\(--surface-app/);
assert.doesNotMatch(
  nav,
  /\.bottom-nav[\s\S]{0,500}?--mj-splash,\s*#0E1A15/,
  "navigation بلا تدرّج splash أسود",
);

const native = read("src/styles/capacitor-native-ux.css");
assert.match(native, /html\.capacitor-native[\s\S]*--surface-app/);
assert.doesNotMatch(
  native,
  /html\.capacitor-native[\s\S]{0,200}--mj-splash,\s*#0E1A15/,
  "Capacitor بلا خلفية splash سوداء",
);

const capTs = read("capacitor.config.ts");
assert.match(capTs, /ios:\s*\{[\s\S]*?backgroundColor:\s*"#F2F4F3"/);
assert.doesNotMatch(capTs, /ios:\s*\{[\s\S]*?backgroundColor:\s*"#ffffff"/);
assert.doesNotMatch(capTs, /ios:\s*\{[\s\S]*?backgroundColor:\s*"#0E1A15"/);

const capJson = read("capacitor.config.json");
assert.match(capJson, /"backgroundColor":\s*"#F2F4F3"/);
assert.doesNotMatch(capJson, /"backgroundColor":\s*"#ffffff"/);

const iosCap = read("ios/App/App/capacitor.config.json");
assert.match(iosCap, /"backgroundColor":\s*"#F2F4F3"/);
assert.doesNotMatch(iosCap, /"backgroundColor":\s*"#ffffff"/);

console.log("bottom-nav-safe-area-green.test.ts: ok");
