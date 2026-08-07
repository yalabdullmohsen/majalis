/**
 * حماية انحدار: نص QPC في المصحف لا يُصاد بقاعدة elite [class*="ayah"].
 * السبب الجذري لحادث «صفحات محرَّفة» (2026-07-30): unicode-bidi:plaintext
 * وخط Noto يُورَّثان من حاويات quran-shell--ayah / qs-mushaf-body--ayah / mpv-*.
 *
 * تشغيل: npx tsx src/lib/__tests__/mushaf-qpc-css-isolation.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const elite = readFileSync(resolve(appRoot, "src/styles/elite-2026.css"), "utf8");
const mushafV2 = readFileSync(resolve(appRoot, "src/styles/mushaf-v2.css"), "utf8");
const viewSrc = readFileSync(resolve(appRoot, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const pageComp = readFileSync(resolve(appRoot, "src/components/quran/MushafPageV2.tsx"), "utf8");
const dataLoader = readFileSync(resolve(appRoot, "src/lib/mushaf-v2-data.ts"), "utf8");

const ayahRuleLine = elite
  .split("\n")
  .find((l) => l.includes('[class*="ayah"]:not(') && !l.trim().startsWith("/*") && !l.includes("بديل"));
assert.ok(ayahRuleLine, "سطر قاعدة elite [class*=\"ayah\"] موجود");

for (const required of [
  "mushaf-v2__",
  "mf2-",
  "qs-ayah",
  "qs-mushaf-",
  "mpv-",
  "quran-shell--ayah",
]) {
  assert.ok(
    ayahRuleLine.includes(required),
    `استثناء elite يجب أن يشمل "${required}" — وُجد: ${ayahRuleLine}`,
  );
}

const ruleStart = elite.indexOf(ayahRuleLine!);
const ruleBody = elite.slice(ruleStart, ruleStart + 800);
assert.match(ruleBody, /unicode-bidi:\s*plaintext\s*!important/, "القاعدة ما زالت plaintext لغير المصحف");

// أصناف قارئ آية المستخدمة حيًا — يجب ألا تطابق القاعدة بعد الاستثناءات
const mushafAyahClasses = [
  "quran-shell--ayah",
  "qs-mushaf-frame--ayah",
  "qs-mushaf-frame--ayah-chrome",
  "qs-mushaf-body--ayah",
  "mpv-body--ayah",
  "mpv-ayah-header",
  "mpv-ayah-page-badge",
  "mpv-toolbar--ayah",
  "mf2-ayah-group",
];
function eliteHits(className: string): boolean {
  if (!className.includes("ayah")) return false;
  const excluded =
    className.includes("mushaf-v2__") ||
    className.includes("mf2-") ||
    className.includes("qs-ayah") ||
    className.includes("qs-mushaf-") ||
    className.includes("mpv-") ||
    className.includes("quran-shell--ayah");
  return !excluded;
}
for (const c of mushafAyahClasses) {
  assert.equal(eliteHits(c), false, `الصنف ${c} يجب ألا يُصاد بقاعدة elite`);
}

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
