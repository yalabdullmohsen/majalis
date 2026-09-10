/**
 * بوابة: لا تكديس تعريف + قائمة، ولا FAB فوق تصفية الحديث.
 * تشغيل: node --import tsx src/lib/__tests__/hadith-layout-chrome-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const sahih = read("src/pages/hadith/HadithSahihPage.tsx");
const daif = read("src/pages/hadith/HadithDaifPage.tsx");
const mawdu = read("src/pages/hadith/HadithMawduPage.tsx");
const chrome = read("src/lib/immersive-chrome.ts");
const back = read("src/components/common/AppBackButton.tsx");
const css = read("src/styles/pages/hadith.css");
const view = read("src/pages/hadith/ui/HadithView.tsx");

assert.doesNotMatch(sahih, /HadithClassGuide/, "الصحيح بلا تعريف مكدّس");
assert.doesNotMatch(daif, /HadithClassGuide/, "الضعيف بلا تعريف مكدّس");
assert.doesNotMatch(mawdu, /HadithClassGuide/, "الموضوع بلا تعريف مكدّس");
assert.match(sahih, /AppBackButton/, "رجوع داخلي في الصحيح");
assert.match(sahih, /hadith-science/, "رابط مصطلح الحديث بدل صفحة تعريف مكدّسة");
assert.match(sahih, /hadith-route/, "غلاف مسار موحّد");

assert.match(chrome, /p === "\/hadith"/, "compact header لمسار الحديث");
assert.match(chrome, /hadith-science/, "compact لمصطلح الحديث");

assert.match(back, /isCompactHeaderPath/, "إخفاء FAB يعتمد compact");
assert.match(back, /path\.startsWith\("\/hadith"\)|\/hadith/, "إخفاء FAB على الحديث");

assert.match(css, /flex-wrap:\s*nowrap/, "أقسام الحديث صف أفقي بلا تفريد الموضوع");
assert.match(css, /aria-checked/, "حالة شريحة التصنيف عبر aria-checked");
assert.match(view, /hadith-quick-cat--active/, "صنف نشط على الشريحة");

console.log("hadith-layout-chrome-gate.test.ts: ok");
