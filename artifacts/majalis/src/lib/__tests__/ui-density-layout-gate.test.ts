/**
 * بوابة كثافة البطاقات وتوازن التخطيط.
 * تشغيل: node --import tsx src/lib/__tests__/ui-density-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const hubCss = read("src/styles/components/hub-card.css");
const lobbyCss = read("src/components/lobby/section-lobby.css");
const quranCss = read("src/styles/pages/quran-hub.css");
const prayerView = read("src/pages/worship/ui/PrayerTimesView.tsx");
const back = read("src/components/common/AppBackButton.tsx");
const immersive = read("src/lib/immersive-chrome.ts");
const hubCard = read("src/components/ui/HubCard.tsx");

console.log("=== hub density ===");
assert.match(hubCss, /--sec-entry-min-h:\s*0/, "لا min-height مفرط على hub-card");
assert.doesNotMatch(
  hubCss,
  /\.hub-card__desc\s*\{[^}]*min-height:\s*calc/,
  "وصف البطاقة بلا ارتفاع وهمي لسطرين",
);
assert.match(hubCss, /\.hub-card--compact/, "compact");
assert.match(hubCss, /\.hub-card--detailed/, "detailed");
assert.match(hubCss, /\.hub-card--featured/, "featured");
assert.match(hubCss, /\.hub-card__go[\s\S]*?pointer-events:\s*none/, "سهم مدمج بلا تفاعل");
assert.doesNotMatch(hubCss, /\.hub-card__go\s*\{[^}]*position:\s*absolute/, "السهم ليس عائمًا مطلقًا");
assert.match(hubCss, /\.hub-card__go[\s\S]*?border-radius:\s*0/, "سهم بلا دائرة ضخمة");
assert.match(hubCard, /"detailed"/);
assert.match(hubCard, /"featured"/);

console.log("=== lobby / orphan ===");
assert.match(lobbyCss, /grid-auto-rows:\s*auto/, "صفوف الشبكة حسب المحتوى");
assert.doesNotMatch(lobbyCss, /grid-auto-rows:\s*1fr/, "لا stretch صفوف ثابت");
assert.match(
  lobbyCss,
  /\.section-lobby__grid\s*>\s*:last-child:nth-child\(odd\)[\s\S]*?max-width:\s*none/,
  "اليتيم بعرض الصف",
);

console.log("=== quran open mushaf ===");
assert.match(quranCss, /\.quran-open-mushaf__cta\s*\{[^}]*flex-direction:\s*row/, "CTA أفقي");
assert.doesNotMatch(
  quranCss,
  /\.quran-open-mushaf__cta-btn\s*\{[^}]*width:\s*3rem/,
  "لا زر دائري 3rem",
);

console.log("=== prayer clock vs remaining ===");
assert.match(prayerView, /pts-hero__clock-label/, "تسمية وقت الأذان");
assert.match(prayerView, /pts-hero__countdown-label/, "تسمية المتبقي");
assert.match(prayerView, /وقت الأذان/);
assert.match(prayerView, /متبقي|مضى/);

console.log("=== floating back ===");
assert.match(immersive, /hasInPageBackChrome/, "كشف صفحات بهيدر رجوع");
assert.match(back, /hasInPageBackChrome/, "إخفاء السهم العائم");

console.log("ui-density-layout-gate.test.ts: ok");
