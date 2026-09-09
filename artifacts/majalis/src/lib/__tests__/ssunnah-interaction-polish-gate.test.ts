/**
 * بوابة مرحلة 3 — تفاعل، شيت، حالات، حفظ تمرير.
 * Run: node --import tsx src/lib/__tests__/ssunnah-interaction-polish-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const native = read("src/styles/components/native-feel.css");
const sheet = read("src/styles/components/app-bottom-sheet.css");
const polish = read("src/styles/ssunnah-ux-polish.css");
const app = read("src/App.tsx");
const ui = read("src/components/ui-common.tsx");
const search = read("src/pages/account/ui/SearchView.tsx");
const asyncV = read("src/components/AsyncDataView.tsx");

assert.match(native, /translateY\(1px\)/, "ضغط البطاقات: translateY خفيف لا scale كبير");
assert.doesNotMatch(
  native,
  /\.mj-pressable:active[\s\S]{0,120}scale\(/,
  "ممنوع scale على :active للعناصر التفاعلية",
);
assert.doesNotMatch(native, /scale\(0\.94\)/, "لا scale(0.94) في إحساس اللمس");
assert.match(native, /mj-route-brand-fade[\s\S]*translate3d\(0,\s*4px/, "دخول الصفحة: تلاشي هوية + translateY خفيف");
assert.match(sheet, /ss-sheet-in/, "شيت سفلي بحركة دخول ناعمة");
assert.match(sheet, /--radius-sheet,\s*28px/, "حواف شيت ناعمة");
assert.match(sheet, /app-sheet__handle/, "مقبض الشيت موجود");

assert.match(app, /restoreScrollSnapshot/, "استعادة التمرير عند الرجوع");
assert.match(app, /captureScrollSnapshot/, "حفظ موضع التمرير قبل المغادرة");
assert.match(app, /isPop/, "التمييز بين push و pop للتمرير");

assert.match(ui, /تعذر تحميل المحتوى/, "رسائل خطأ عربية واضحة");
assert.match(ui, /actionLabel/, "Empty يدعم إجراءً");
assert.match(asyncV, /أنت غير متصل/, "حالة عدم اتصال واضحة");
assert.match(search, /SearchSkeleton/, "بحث: هيكل تحميل بدل نص فارغ");
assert.match(search, /مسح البحث/, "Empty بحث مع إجراء");

assert.match(polish, /\.ss-state-card/, "بطاقة حالة موحّدة");
assert.match(polish, /min-height:\s*44px/, "هدف لمس ≥44px");
assert.match(polish, /ss-skel-shimmer/, "shimmer خفيف");
assert.match(polish, /prefers-reduced-motion/, "احترام تقليل الحركة");

console.log("ssunnah-interaction-polish-gate.test.ts: ok");
