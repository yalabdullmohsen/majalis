/**
 * Wave 26 — تلميع مسار المسلم الجديد والبطاقات والخزنة وخطط الحفظ.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave26-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.match(read("src/views/NewMuslimDayDetailPage.tsx"), /مسار المسلم الجديد/);
assert.match(read("src/views/NewMuslimDayDetailPage.tsx"), /STATUS\.contentLoading/);
assert.match(read("src/pages/account/ui/FlashCardsView.tsx"), /سجّل الدخول لمراجعة البطاقات وحفظ تقدّمك/);
assert.match(read("src/views/VaultPage.tsx"), /على هذا الجهاز\. سجّل الدخول للمزامنة بين أجهزتك/);
assert.match(read("src/views/TranscribePage.tsx"), /سجّل الدخول لمتابعة التفريغ/);
assert.ok(!read("src/views/TranscribePage.tsx").includes("يجب تسجيل الدخول أولاً"));
assert.ok(!read("src/views/NewMuslimDayDetailPage.tsx").includes('title="اليوم"'));

const plans = read("src/pages/quran/QuranMemorizationPlansPage.tsx");
assert.ok(!plans.includes("صفحتان تقريبًا في الجلسة مع اختبار أسبوعي وربط بالتسميع. محتوى معتمد"));
assert.match(plans, /صفحتان تقريبًا في الجلسة مع اختبار أسبوعي وربط بالتسميع\./);

console.log("content-quality-wave26-gate.test.ts: ok");
