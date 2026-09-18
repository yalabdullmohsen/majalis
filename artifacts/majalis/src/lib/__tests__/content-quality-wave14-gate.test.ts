/**
 * Wave 14 — توسيع توحيد EMPTY على صفحات المعرفة العامة.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave14-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/views/HikamSalafPage.tsx", /EMPTY\.search/],
  ["src/views/ProphetStoriesPage.tsx", /EMPTY\.search/],
  ["src/views/SahabahPage.tsx", /EMPTY\.search/],
  ["src/views/FadailAamalPage.tsx", /EMPTY\.search/],
  ["src/views/SunanYawmiyyaPage.tsx", /EMPTY\.search/],
  ["src/views/MutashabihatPage.tsx", /EMPTY\.searchShort/],
  ["src/views/NationsPage.tsx", /EMPTY\.search/],
  ["src/views/SinsAndRightsPage.tsx", /EMPTY\.data/],
  ["src/views/MiraclesPage.tsx", /EMPTY\.data/],
  ["src/views/UpdatesPage.tsx", /EMPTY\.data/],
  ["src/views/ArbaeenLovePage.tsx", /EMPTY\.data/],
  ["src/views/DiscoverIslamDoubtsPage.tsx", /EMPTY\.data/],
  ["src/views/DiscoverIslamQuestionsPage.tsx", /EMPTY\.search/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم EMPTY`);
  assert.doesNotMatch(src, /لا توجد نتائج، جرِّب/, `${rel} بلا فراغ يدوي ضعيف`);
}

const vault = read("src/views/VaultPage.tsx");
assert.match(vault, /EMPTY\.citations/, "ملاحظات الخزنة من EMPTY");

console.log("content-quality-wave14-gate.test.ts: ok");
