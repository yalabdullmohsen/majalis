/**
 * بوابة: حديث + المزيد + بحث — UX جوال.
 * تشغيل: node --import tsx src/lib/__tests__/hadith-more-search-ux.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MORE_FEATURED_SECTIONS, MORE_STANDARD_SECTIONS } from "@/features/more/moreSections";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const hadithView = read("src/pages/hadith/ui/HadithView.tsx");
assert.match(hadithView, /hadith-page--hub/);
assert.match(hadithView, /الحديث وعلومه/);
assert.match(hadithView, /ابحث في متن الحديث أو المصدر/);
assert.match(hadithView, /hadith-scientific-notice/);
assert.match(hadithView, /لا يُحتج بالحديث الضعيف/);
assert.match(hadithView, /لا يجوز نسبته|لا يُنسب الموضوع|بيان وضعه/);
assert.match(hadithView, /label="تصفية"|تصفية/);
assert.doesNotMatch(hadithView, /hadith-page--stacked/);

const hadithCss = read("src/styles/pages/hadith.css");
assert.match(hadithCss, /--bottom-nav-height/);
assert.match(hadithCss, /hadith-hub-grid/);
assert.match(hadithCss, /font-size:\s*max\(1\.125rem,\s*18px\)/);

const more = read("src/pages/account/MorePage.tsx");
assert.match(more, /MORE_FEATURED_SECTIONS/);
assert.doesNotMatch(more, /onClose|button.*إغلاق|aria-label=["']إغلاق/);
assert.match(more, /الأقسام الأساسية/);

const titles = MORE_FEATURED_SECTIONS.map((s) => s.title);
for (const t of [
  "المكتبة",
  "أعلام وتراجم",
  "الحديث وعلومه",
  "قصص الأنبياء",
  "الأمم السابقة",
  "السيرة النبوية",
  "الفوائد والبطاقات",
  "سين جيم",
  "البحث",
  "الإعدادات",
]) {
  assert.ok(titles.includes(t), `المزيد يتضمن «${t}»`);
}
const secondary = MORE_STANDARD_SECTIONS.map((s) => s.title);
assert.ok(secondary.includes("الأدعية"));
assert.ok(secondary.includes("المصطلحات"));
assert.equal(secondary.includes("الموضوعات"), false, "الموضوعات العلمية أُزيلت من المزيد");
assert.ok(secondary.includes("المفضلة"));

const moreCss = read("src/styles/pages/more-page.css");
assert.match(moreCss, /--bottom-nav-height/);
assert.match(moreCss, /grid-template-columns:\s*repeat\(2/);
assert.match(moreCss, /-webkit-line-clamp:\s*2/);

const searchCss = read("src/styles/pages/search.css");
assert.match(searchCss, /100dvh/);
assert.match(searchCss, /--bottom-nav-height/);
assert.match(searchCss, /position:\s*sticky/);

const gsm = read("src/styles/components/global-search-modal.css");
assert.match(gsm, /inset:\s*0/);
assert.match(gsm, /100dvh/);

const bridge = read("src/lib/search-keyboard-bridge.ts");
assert.match(bridge, /scrollIntoView/);

console.log("hadith-more-search-ux.test.ts: ok");
