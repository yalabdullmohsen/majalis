/**
 * بوابة: عدّاد صفحات سريع عند الضغط على رقم الصفحة (بلا تأخير لوحة مفاتيح).
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-fast-page-dial-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const controls = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
const dialCss = read("src/features/mushaf-reader/page-goto-dial.css");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const page = read("src/features/mushaf-reader/MushafPage.tsx");

assert.match(page, /onPageNumberPress/, "رقم الصفحة قابل للضغط");
assert.match(reader, /setGotoOpen\(true\)/, "يفتح انتقال الصفحة");
assert.match(reader, /data-goto=\{gotoOpen/, "علامة data-goto على الجذر");
assert.match(reader, /setChromeOpen\(true\)/, "يبقي الكروم حتى لا يُخفى العدّاد");
assert.match(controls, /mushaf-goto-dial/, "عدّاد صفحات");
assert.match(controls, /page-goto-dial\.css/, "أنماط العدّاد منفصلة عن هندسة المصحف");
assert.match(controls, /page-goto-visibility\.css/, "ظهور العدّاد خارج mushaf-reader.css");
assert.match(controls, /DIAL_ITEM_H/, "محاكاة ارتفاع عنصر العدّاد");
assert.match(controls, /بلا focus تلقائي/, "لا يفتح لوحة المفاتيح فورًا");
assert.doesNotMatch(
  controls.match(/useEffect\(\(\) => \{[\s\S]*?gotoOpen[\s\S]*?\}, \[gotoOpen[\s\S]*?\]\)/)?.[0] ?? "",
  /\.focus\(/,
  "أثر الفتح لا يستدعي focus",
);
assert.match(controls, /mushaf-goto-prev/);
assert.match(controls, /mushaf-goto-next/);
assert.match(controls, /jumpToPage/);
assert.match(dialCss, /\.nm-goto__dial\b/);
assert.match(dialCss, /scroll-snap-type:\s*y\s+mandatory/);
assert.match(dialCss, /\.nm-goto__dial-item\[data-active="1"\]/);

const visCss = read("src/styles/components/page-goto-visibility.css");
assert.match(visCss, /data-goto="1"/);
assert.match(visCss, /\.nm-goto/);
assert.doesNotMatch(
  reader,
  /setGotoOpen\(true\);\s*setChromeOpen\(false\)/,
  "لا يغلق الكروم فور فتح العدّاد (كان يخفي العدّاد في وضع التركيز)",
);

console.log("mushaf-fast-page-dial-gate.test.ts: ok");
