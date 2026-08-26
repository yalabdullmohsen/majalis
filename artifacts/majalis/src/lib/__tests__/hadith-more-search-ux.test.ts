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
assert.match(hadithView, /TopicPage/);
assert.doesNotMatch(hadithView, /hadith-hub-search/);
assert.match(hadithView, /hadith-scientific-notice/);
assert.match(hadithView, /لا يُحتج بالحديث الضعيف/);
assert.match(hadithView, /لا يجوز نسبته|لا يُنسب الموضوع|بيان وضعه/);
assert.match(hadithView, /label="تصفية"|تصفية/);
assert.doesNotMatch(hadithView, /hadith-page--stacked/);

const hadithCss = read("src/styles/pages/hadith.css");
assert.match(hadithCss, /--bottom-nav-height/);
assert.match(hadithCss, /hadith-hub-grid|hub-card-grid/);
assert.match(hadithCss, /font-size:\s*max\(1\.125rem,\s*18px\)/);

const more = read("src/pages/account/SectionsPage.tsx");
assert.match(more, /MoreHubFromRegistry|SectionsHubFromRegistry/);
assert.doesNotMatch(more, /onClose|button.*إغلاق|aria-label=["']إغلاق/);
assert.match(more, /الأقسام/);

const titles = MORE_FEATURED_SECTIONS.map((s) => s.title);
assert.equal(titles.length, 6);
for (const t of [
  "العقيدة",
  "الحديث وعلومه",
  "الفقه والأحكام",
  "السيرة النبوية",
  "قصص الأنبياء",
  "الأمم السابقة",
]) {
  assert.ok(titles.includes(t), `المزيد يتضمن «${t}»`);
}
const secondary = MORE_STANDARD_SECTIONS.map((s) => s.title);
assert.ok(
  secondary.includes("الأدعية") ||
    secondary.includes("الأذكار والأدعية") ||
    secondary.includes("الأدعية الشرعية"),
  "المزيد يتضمن الأذكار/الأدعية",
);
assert.ok(
  secondary.some((t) => t.includes("المصطلحات") || t.includes("القاموس")),
  "المزيد يتضمن القاموس/المصطلحات",
);
assert.equal(secondary.includes("الموضوعات"), false, "لا قسم الموضوعات في المزيد");
assert.equal(secondary.includes("البحث"), false, "لا بطاقة بحث في المزيد");

const moreCss = read("src/styles/pages/more-page.css");
assert.match(moreCss, /--bottom-nav-height/);

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
