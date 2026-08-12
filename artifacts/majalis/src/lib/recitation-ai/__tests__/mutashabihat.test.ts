/**
 * اختبارات src/lib/recitation-ai/mutashabihat.ts — تحميل فهرس المتشابهات
 * والبحث فيه. بيئة Node بلا متصفح: نُقلِّد global.fetch يدويًا (لا شبكة
 * حقيقية ولا JSDOM)، تمامًا كنمط اختبار asr-providers.test.ts.
 *
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/mutashabihat.test.ts
 */
import { loadMutashabihatIndex, getSimilarAyahs } from "../mutashabihat";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

const originalFetch = globalThis.fetch;

async function withMockFetch<T>(impl: typeof fetch, fn: () => Promise<T>): Promise<T> {
  (globalThis as any).fetch = impl;
  try {
    return await fn();
  } finally {
    (globalThis as any).fetch = originalFetch;
  }
}

console.log("═══ loadMutashabihatIndex — نجاح التحميل ═══");
{
  await withMockFetch(
    (async (url: string) => {
      assert(url === "/data/quran/mutashabihat-index.json", "يطلب المسار الصحيح للفهرس الثابت");
      return {
        ok: true,
        json: async () => ({ "55:13": [{ surah: 55, ayah: 16, overlapRatio: 1 }] }),
      } as Response;
    }) as typeof fetch,
    async () => {
      const index = await loadMutashabihatIndex();
      const matches = getSimilarAyahs(index, 55, 13);
      assert(matches.length === 1 && matches[0].surah === 55 && matches[0].ayah === 16, "الفهرس المُحمَّل يُعيد التطابق الصحيح");
    },
  );
}

console.log("═══ getSimilarAyahs — آية بلا تشابه مفهرَس ═══");
{
  await withMockFetch(
    (async () => ({ ok: true, json: async () => ({}) }) as unknown as Response) as typeof fetch,
    async () => {
      // module-level cache من الاختبار السابق — نتحقق فقط من سلوك getSimilarAyahs
      // نفسها على فهرس لا يحوي المفتاح، بمعزل عن التخزين المؤقت.
      const emptyIndex = {};
      const matches = getSimilarAyahs(emptyIndex, 1, 1);
      assert(Array.isArray(matches) && matches.length === 0, "مفتاح غير موجود ⇒ مصفوفة فارغة لا استثناء");
    },
  );
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
