/**
 * Wave 12 — Content Excellence continuous: typos + hero lead + empty copy.
 * node --import tsx src/lib/__tests__/content-excellence-wave12-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const teacher = read("src/pages/lessons/TeacherDetailPage.tsx");
assert.doesNotMatch(teacher, /المشيخ|مشيخًا/, "بلا خطأ «المشيخ» الظاهر للمستخدم");
assert.match(teacher, /الشيخ غير موجود/);
assert.match(teacher, /بهذا المعرّف/);

const hero = read("src/components/home/HomeHeroLcp.tsx");
assert.match(hero, /description=/, "هيرو الرئيسية يحمل جملة داعمة");
assert.match(hero, /رفيقك اليومي/);
assert.doesNotMatch(hero, /منصة علمية موثّقة/);
assert.doesNotMatch(hero, /مصحف، دروس، فقه/);

const empty = read("src/lib/ui-copy.ts");
assert.match(empty, /لا يتوفر محتوى هنا الآن/);
assert.doesNotMatch(empty, /ابدأ رحلتك في طلب العلم/);

console.log("content-excellence-wave12-gate.test.ts: ok");
