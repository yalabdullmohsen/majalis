/**
 * Wave 12 — SEO اقتصاص عند حدود الكلمة + رسائل فراغ موحّدة + وضوح الرئيسية.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave12-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const genSeo = read("scripts/generate-seo.mjs");
assert.match(genSeo, /lastIndexOf\(" "\)/, "SEO clamp يقتص عند حدود الكلمة");
assert.doesNotMatch(
  genSeo,
  /t\.slice\(0,\s*max\s*-\s*1\)\.trimEnd\(\)…/,
  "بلا قطع منتصف كلمة في clamp",
);

const widget = read("src/components/widgets/Widget.tsx");
assert.match(widget, /EMPTY\.data/, "فراغ الودجت من ui-copy الموحّد");
assert.doesNotMatch(widget, /لا يوجد محتوى بعد/, "بلا عبارة فراغ ضعيفة");

const home = read("src/components/home/home-start-here-data.ts");
assert.match(home, /أذكار، درس قريب/, "مقدمة الرئيسية أوضح للزائر الجديد");

const uiCopy = read("src/lib/ui-copy.ts");
assert.match(uiCopy, /EMPTY\s*=/, "مصدر نصوص الفراغ");
assert.doesNotMatch(uiCopy, /قريبًا/, "ui-copy بلا «قريبًا»");

console.log("content-quality-wave12-gate.test.ts: ok");
