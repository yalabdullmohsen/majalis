/**
 * حماية انحدار: نص QPC في المصحف معزول عن قواعد ayah العامة التاريخية.
 * كانت elite-2026.css تفرض unicode-bidi:plaintext عبر [class*="ayah"] —
 * حُذفت الطبقة الميتة؛ هذا الاختبار يمنع إعادة استيرادها ويؤكّد عزل mushaf-v2.
 *
 * تشغيل: npx tsx src/lib/__tests__/mushaf-qpc-css-isolation.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const elitePath = resolve(appRoot, "src/styles/elite-2026.css");
assert.equal(existsSync(elitePath), false, "elite-2026.css يجب أن يبقى محذوفًا (طبقة ميتة)");

const mainSrc = readFileSync(resolve(appRoot, "src/main.tsx"), "utf8");
assert.doesNotMatch(mainSrc, /elite-2026/, "main.tsx لا يستورد elite-2026");

const mushafV2 = readFileSync(resolve(appRoot, "src/styles/mushaf-v2.css"), "utf8");
const viewSrc = readFileSync(resolve(appRoot, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const pageComp = readFileSync(resolve(appRoot, "src/components/quran/MushafPageV2.tsx"), "utf8");
const dataLoader = readFileSync(resolve(appRoot, "src/lib/mushaf-v2-data.ts"), "utf8");

assert.match(mushafV2, /\.mf2-line\s*\{[\s\S]*?unicode-bidi:\s*isolate/, "mf2-line يعزل bidi");
assert.match(mushafV2, /\.mf2-word\s*\{[\s\S]*?unicode-bidi:\s*isolate/, "mf2-word يعزل bidi");
assert.match(pageComp, /unicodeBidi:\s*["']isolate["']/, "MushafPageV2 يضبط isolate inline");
assert.match(pageComp, /textQpcHafs/, "مسار Unicode الآمن يستخدم textQpcHafs لا glyph عند الفشل");
assert.match(pageComp, /pageFont\.failed/, "فشل خط الصفحة يفعّل التراجع");

assert.match(viewSrc, /qs-mushaf-body--ayah/);
assert.match(dataLoader, /code_v2/, "التحميل يعتمد code_v2 لا code_v1");
assert.doesNotMatch(
  dataLoader,
  /glyphText:\s*w\.text\b/,
  "ممنوع استخدام text/v1 كـ glyph مع خطوط v2",
);

// بيانات + خطوط لكل صفحة عيّنة حرجة
const pagesDir = resolve(appRoot, "public/data/quran-v2/pages");
const fontsDir = resolve(appRoot, "public/fonts/qpc-v2");
assert.equal(readdirSync(pagesDir).filter((f) => f.endsWith(".json")).length, 604);
assert.equal(readdirSync(fontsDir).filter((f) => f.endsWith(".woff2")).length, 604);

for (const n of [1, 2, 50, 255, 604]) {
  const pagePath = resolve(pagesDir, `page-${String(n).padStart(3, "0")}.json`);
  const fontPath = resolve(fontsDir, `p${n}.woff2`);
  assert.ok(existsSync(pagePath), `صفحة ${n} JSON`);
  assert.ok(existsSync(fontPath), `خط p${n}.woff2`);
  const verses = JSON.parse(readFileSync(pagePath, "utf8")) as Array<{
    page_number?: number;
    words?: Array<{ code_v2?: string }>;
  }>;
  assert.ok(verses.length > 0, `صفحة ${n} غير فارغة`);
  for (const v of verses) {
    assert.equal(v.page_number, n, `page_number يطابق ${n}`);
    for (const w of v.words || []) {
      assert.ok(w.code_v2, `code_v2 مطلوب في صفحة ${n}`);
    }
  }
}

console.log("mushaf-qpc-css-isolation.test.ts: ok");
