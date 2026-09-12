/**
 * بوابة: استعادة قائمة/قارئ الأربعين النووية والمكوّنات المشتركة.
 * تشغيل: node --import tsx src/lib/__tests__/hadith-list-responsive-recovery-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  hasInPageBackChrome,
  isCompactHeaderPath,
  isHadithReaderPath,
} from "../immersive-chrome";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const view = read("pages/hadith/ui/ArbaeenNawawiView.tsx");
const card = read("components/hadith/HadithListCard.tsx");
const cardCss = read("styles/components/hadith-list-card.css");
const pageCss = read("styles/pages/arbaeen-nawawi.css");
const hadithCss = read("styles/pages/hadith.css");
const floating = read("components/FloatingBackButton.tsx");

console.log("=== حاوية آمنة بلا overflow-x:hidden ===");
assert.match(view, /an-page--safe/);
assert.match(view, /an-content/);
assert.match(pageCss, /\.an-page--safe/);
assert.match(pageCss, /width:\s*100%/);
assert.match(pageCss, /max-width:\s*100%/);
assert.match(pageCss, /min-width:\s*0/);
assert.doesNotMatch(
  pageCss,
  /\.an-page--safe[\s\S]{0,280}?overflow-x:\s*hidden/,
  "لا overflow-x:hidden كعلاج لتجاوز الأربعين",
);

console.log("=== بطاقة قائمة مشتركة — متن متعدد الأسطر ===");
assert.match(view, /HadithListCard/);
assert.match(card, /hlc__preview/);
assert.match(cardCss, /-webkit-line-clamp:\s*3/);
assert.match(cardCss, /white-space:\s*normal/);
assert.doesNotMatch(
  cardCss,
  /\.hlc__preview[\s\S]{0,200}?white-space:\s*nowrap/,
);
assert.doesNotMatch(
  pageCss,
  /\.an-row__preview[\s\S]{0,200}?white-space:\s*nowrap/,
);

console.log("=== رجوع داخلي + إخفاء الشريط العام على مسارات الحديث ===");
assert.doesNotMatch(view, /FloatingBackButton/);
assert.match(view, /AppBackButton/);
assert.match(view, /variant="inline"/);
assert.equal(isHadithReaderPath("/arbaeen-nawawi"), true);
assert.equal(isCompactHeaderPath("/arbaeen-nawawi"), true);
assert.equal(hasInPageBackChrome("/arbaeen-nawawi"), true);
assert.equal(hasInPageBackChrome("/hadith/sahih"), true);
assert.match(floating, /FLOATING_BACK_DISABLED/);

console.log("=== بحث واحد داخل الصفحة + ملخص مضغوط ===");
assert.match(view, /ابحث في أحاديث الأربعين النووية/);
assert.equal((view.match(/type="search"/g) ?? []).length, 1);
assert.match(view, /an-summary/);
assert.doesNotMatch(view, /className="[^"]*an-hero/);
assert.match(view, /حديث واحد من|progressLabel/);

console.log("=== حافة سفلية + سلامة قوائم الحديث المشتركة ===");
assert.match(pageCss, /--bottom-nav-total|bottom-nav-total/);
assert.match(pageCss, /safe-area-inset-bottom|env\(safe-area-inset-bottom/);
assert.match(hadithCss, /Shared hadith list safety/);
assert.match(hadithCss, /white-space:\s*normal/);

console.log("=== لا ارتفاع ثابت لبطاقة القائمة ===");
assert.doesNotMatch(cardCss, /\.hlc\s*\{[^}]*\bheight:\s*\d/);

console.log("hadith-list-responsive-recovery-gate.test.ts: ok");
