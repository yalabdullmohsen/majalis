/**
 * بوابة: أساس Typography/تصميم سُنّة جاهز بلا هجرة شاشات.
 * node --import tsx src/lib/__tests__/ssunnah-typography-foundation-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const apiCss = "src/styles/ssunnah-theme-api.css";
const themeTs = "src/lib/ssunnah-theme.ts";
const textCmp = "src/components/design-system/text/SsText.tsx";
const textIdx = "src/components/design-system/text/index.ts";
const docs = "docs/SSUNNAH_TYPOGRAPHY_FOUNDATION.md";
const main = "src/main.tsx";
const dsIndex = "src/components/design-system/index.ts";
const themeCss = "src/app/styles/theme.css";

for (const rel of [apiCss, themeTs, textCmp, textIdx, docs]) {
  assert.ok(existsSync(resolve(root, rel)), `ملف أساس مفقود: ${rel}`);
}

const api = read(apiCss);
const ts = read(themeTs);
const cmp = read(textCmp);
const mainSrc = read(main);
const ds = read(dsIndex);
const doc = read(docs);
const theme = read(themeCss);

assert.match(mainSrc, /ssunnah-theme-api\.css/, "main يستورد طبقة --ss-*");
assert.match(theme, /ssunnah-theme-api/, "theme.css يشير لواجهة الاستهلاك");

assert.match(api, /--ss-type-screen-title:\s*var\(--text-mj-h1\)/, "عنوان الشاشة من theme");
assert.match(api, /--ss-type-body:\s*var\(--text-mj-body\)/, "المتن من theme");
assert.match(api, /--ss-color-text:\s*var\(/, "لون النص جسر");
assert.match(api, /--ss-space-4:\s*var\(--spacing-mj-4\)/, "مسافة من theme");
assert.match(api, /--ss-radius-md:\s*var\(--radius-mj-md\)/, "حافة من theme");

// لا قيم هكس حرفية في طبقة API (الاستثناء الوحيد إن وُجد تعليقاً)
const hexInApi = api.match(/#[0-9A-Fa-f]{3,8}/g);
assert.equal(hexInApi, null, "ssunnah-theme-api بلا هكس مكرر");

assert.match(ts, /SS_TEXT_ROLES/, "سجل الأدوار في TS");
assert.match(ts, /screenTitle/, "دور screenTitle");
assert.match(ts, /scripture/, "دور scripture");

for (const name of [
  "ScreenTitle",
  "SectionTitle",
  "CardTitle",
  "BodyText",
  "ScriptureText",
  "ExplanationText",
  "SupportingText",
  "LabelText",
  "Caption",
]) {
  assert.match(cmp, new RegExp(`export const ${name}`), `مكوّن ${name}`);
  assert.match(ds, new RegExp(name), `تصدير ${name} من design-system`);
}

assert.match(doc, /خطة التطبيق على دفعات/, "خطة الدفعات موثّقة");
assert.match(doc, /حصر الشاشات/, "الحصر موثّق");
assert.match(doc, /لا تعديل شاشات|بدون تعديل شاشات/, "تأكيد عدم لمس الشاشات في المرحلة 0");

console.log("ssunnah-typography-foundation-gate.test.ts: ok");
