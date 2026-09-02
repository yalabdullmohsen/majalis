/**
 * بوابة b046: تحفّظ في تراجم الصحابة — لا أرقام مسند مطلقة بلا بيان، ولا جزم حسّاس.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = readFileSync(resolve(root, "src/views/SahabahPage.tsx"), "utf8");
const maps = readFileSync(resolve(root, "src/lib/mind-maps-data.ts"), "utf8");

assert.match(src, /غزوة تبوك/, "حديث المنزلة مقيّد بتبوك");
assert.match(src, /على القول الأشهر/, "خديجة: تحفّظ أول إسلام");
assert.match(src, /أول من أسلم من الصبيان على المشهور/, "علي: صياغة أهل السنة");
assert.doesNotMatch(src, /5374|2210 حديثاً|2630 حديثاً|2286 حديثاً|1540 حديثاً/, "لا أرقام مسند مطلقة شائعة بلا تحفّظ");
assert.doesNotMatch(src, /لم يُهزَم في أي معركة طوال حياته/, "لا جزم بعدم هزيمة خالد");
assert.doesNotMatch(src, /القاهرة القديمة/, "فسطاط لا تُسمّى القاهرة القديمة");
assert.doesNotMatch(src, /لو كان بعدي نبي لكان عمر/, "لا يعتمد على رواية عمر المتكلم فيها بلا بيان");
assert.doesNotMatch(src, /born: "9 ق\.هـ/, "لا تثبيت سنة ولادة عائشة بالرقم في الواجهة");
assert.match(src, /آلاف المرويات|من أكثر الصحابة رواية/, "أبو هريرة بصياغة متحفّظة");
assert.doesNotMatch(maps, /5374 حديثاً|2210 حديثاً|2630 حديثاً|2286 حديثاً/, "الخريطة الذهنية بلا أرقام مطلقة");

console.log("content-audit-b046-sahabah-gate: ok");
