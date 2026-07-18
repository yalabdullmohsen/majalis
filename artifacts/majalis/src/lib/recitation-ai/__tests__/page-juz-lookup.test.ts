/**
 * اختبارات src/lib/recitation-ai/page-juz-lookup.ts — تحميل الفهرس
 * (fetch مُقلَّد) + تحقّق على الفهرس الحقيقي المبني فعليًا لكامل المصحف.
 *
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/page-juz-lookup.test.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPageJuzIndex, getSegmentsForPage, getSegmentsForJuz } from "../page-juz-lookup";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

const originalFetch = globalThis.fetch;

console.log("═══ loadPageJuzIndex — نجاح التحميل ═══");
{
  (globalThis as any).fetch = (async (url: string) => {
    assert(url === "/data/quran/page-juz-index.json", "يطلب المسار الصحيح للفهرس الثابت");
    return {
      ok: true,
      json: async () => ({ byPage: { "1": [{ surah: 1, ayahFrom: 1, ayahTo: 7 }] }, byJuz: {} }),
    } as Response;
  }) as typeof fetch;

  const index = await loadPageJuzIndex();
  const segs = getSegmentsForPage(index, 1);
  assert(segs.length === 1 && segs[0].surah === 1 && segs[0].ayahTo === 7, "الفهرس المُحمَّل يُعيد المقطع الصحيح");

  (globalThis as any).fetch = originalFetch;
}

console.log("═══ getSegmentsForPage/getSegmentsForJuz — أرقام غير موجودة ═══");
{
  const empty = { byPage: {}, byJuz: {} };
  assert(getSegmentsForPage(empty, 999).length === 0, "رقم صفحة خارج النطاق ⇒ مصفوفة فارغة لا استثناء");
  assert(getSegmentsForJuz(empty, 999).length === 0, "رقم جزء خارج النطاق ⇒ مصفوفة فارغة لا استثناء");
}

console.log("═══ تحقّق على الفهرس الحقيقي المبنِيّ فعليًا (كامل المصحف) ═══");
{
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const indexPath = path.resolve(__dirname, "../../../../public/data/quran/page-juz-index.json");
  const realIndex = JSON.parse(readFileSync(indexPath, "utf8"));

  const page1 = getSegmentsForPage(realIndex, 1);
  assert(page1.length === 1 && page1[0].surah === 1 && page1[0].ayahFrom === 1 && page1[0].ayahTo === 7, `صفحة 1 = الفاتحة كاملة (${JSON.stringify(page1)})`);

  const page604 = getSegmentsForPage(realIndex, 604);
  assert(
    page604.length === 3 && page604[0].surah === 112 && page604[2].surah === 114,
    `صفحة 604 (الأخيرة) = الإخلاص+الفلق+الناس (${JSON.stringify(page604)})`,
  );

  const juz1 = getSegmentsForJuz(realIndex, 1);
  assert(
    juz1.length === 2 && juz1[0].surah === 1 && juz1[1].surah === 2 && juz1[1].ayahTo === 141,
    `جزء 1 = الفاتحة كاملة + البقرة:1-141 (${JSON.stringify(juz1)})`,
  );

  const juz30 = getSegmentsForJuz(realIndex, 30);
  assert(
    juz30.length === 37 && juz30[0].surah === 78 && juz30[juz30.length - 1].surah === 114,
    `جزء 30 (عمّ) = 37 سورة من النبأ حتى الناس (${juz30.length} سورة)`,
  );

  const totalSegmentsAcrossPages = Object.keys(realIndex.byPage).length;
  assert(totalSegmentsAcrossPages === 604, `604 صفحة بالضبط في الفهرس الحقيقي (${totalSegmentsAcrossPages})`);
  const totalJuz = Object.keys(realIndex.byJuz).length;
  assert(totalJuz === 30, `30 جزءًا بالضبط في الفهرس الحقيقي (${totalJuz})`);
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
