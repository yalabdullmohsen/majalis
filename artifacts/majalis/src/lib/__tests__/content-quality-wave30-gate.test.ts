/**
 * Wave 30 — فراغات بحث الرئيسية/الذكي/المشايخ + SEO sober لـ /register و/family.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave30-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const hus = read("src/components/home/HomeUniversalSearch.tsx");
assert.match(hus, /EMPTY\.searchShort/);
assert.doesNotMatch(hus, /لا نتائج مطابقة/);

const smart = read("src/components/majlis/SmartSearchPanel.tsx");
assert.match(smart, /EMPTY\.searchShort/);
assert.doesNotMatch(smart, /لا نتائج مطابقة/);

const teachers = read("src/pages/lessons/TeachersIndexPage.tsx");
assert.match(teachers, /EMPTY\.search/);
assert.doesNotMatch(teachers, /لا يوجد مشايخ مطابقون/);

const gsm = read("src/components/GlobalSearchModal.tsx");
assert.match(gsm, /STATUS\.loadError/);
assert.match(gsm, /STATUS\.networkError/);
assert.doesNotMatch(gsm, /تعذر تنفيذ البحث/);

const seo = read("src/lib/seo-routes.json");
assert.doesNotMatch(seo, /ابدأ رحلتك في طلب العلم الشرعي/);
assert.match(seo, /إنشاء حساب في سُنّة للوصول إلى المحتوى المحفوظ/);
assert.match(seo, /إدارة التعلم العائلي وضوابط المحتوى/);

console.log("content-quality-wave30-gate.test.ts: ok");
