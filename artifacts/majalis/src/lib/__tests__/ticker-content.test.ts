/**
 * اختبار مصدر محتوى الشريط العلوي — يثبّت قواعد منع التكرار المطلوبة.
 * التشغيل: npx tsx src/lib/__tests__/ticker-content.test.ts
 */
import {
  buildTickerPool,
  pickNextBatch,
  nextRotationDelayMs,
  readRecent,
  writeRecent,
  RECENT_LIMIT,
  RECENT_STORAGE_KEY,
  VISIBLE_ITEMS,
} from "../ticker-content";

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

/** مولّد شبه‑عشوائي حتمي كي لا يكون الاختبار متذبذبًا. */
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

console.log("\n=== المجمّع الموحَّد ===");
const pool = buildTickerPool();
assert(pool.length >= RECENT_LIMIT * 4, `المجمّع أكبر بكثير من نافذة منع التكرار: ${pool.length} عنصرًا مقابل ${RECENT_LIMIT}`);
assert(new Set(pool.map((p) => p.id)).size === pool.length, "كل المعرّفات فريدة عبر كل المصادر");
assert(pool.every((p) => p.text.trim().length > 0), "لا عنصر بنص فارغ");
assert(pool.every((p) => p.href.startsWith("/")), "كل عنصر له رابط داخلي صالح");
assert(new Set(pool.map((p) => p.kind)).size >= 4, "المجمّع يغطي أربعة أنواع محتوى على الأقل");
assert(pool.some((p) => p.kind === "promo"), "يشمل نبذ أقسام/مميزات (promo)");
assert(pool.some((p) => p.kind === "hadith"), "يشمل أحاديث");
assert(pool.some((p) => p.kind === "dhikr"), "يشمل أذكارًا");

console.log("\n=== سلامة النص (بلا قصّ، بلا تكرار) ===");
assert(!pool.some((p) => p.text.trim().endsWith("…")), "لا عنصر واحد ينتهي بعلامة حذف (لا قصّ للنص)");
assert(pool.some((p) => p.text.length > 200), "توجد نصوص طويلة كاملة (أطول من 200 حرف) — دليل عدم القصّ");
{
  const seen = new Set<string>();
  const dupes = pool.filter((p) => {
    if (seen.has(p.text)) return true;
    seen.add(p.text);
    return false;
  });
  assert(dupes.length === 0, `لا نص مكرر حرفيًا عبر المجمّع (تكرارات: ${dupes.length})`);
}

console.log("\n=== منع التكرار ===");
{
  const rand = seededRand(42);
  let recent: string[] = [];
  const seenOrder: string[] = [];
  // 12 دورة × 4 عناصر = 48 عرضًا
  for (let i = 0; i < 12; i++) {
    const r = pickNextBatch(pool, recent, VISIBLE_ITEMS, rand);
    assert(r.batch.length === VISIBLE_ITEMS, `الدورة ${i + 1} أعادت ${VISIBLE_ITEMS} عناصر`);
    const ids = r.batch.map((b) => b.id);
    assert(new Set(ids).size === ids.length, `الدورة ${i + 1}: لا تكرار داخل الدفعة نفسها`);
    seenOrder.push(...ids);
    recent = r.recent;
  }
  // القاعدة الأساسية: لا يتكرر عنصر ضمن نافذة آخر 20
  let violations = 0;
  for (let i = 0; i < seenOrder.length; i++) {
    const window = seenOrder.slice(Math.max(0, i - RECENT_LIMIT), i);
    if (window.includes(seenOrder[i])) violations++;
  }
  assert(violations === 0, `لا تكرار ضمن آخر ${RECENT_LIMIT} عرضًا عبر 48 عرضًا (مخالفات: ${violations})`);
  assert(recent.length <= RECENT_LIMIT, `سجل الأخيرة محدود بـ${RECENT_LIMIT} (الحالي ${recent.length})`);
}

console.log("\n=== نفاد العناصر يعيد الخلط بلا تكرار مباشر ===");
{
  // مجمّع صغير عمدًا: أصغر من حجم الدفعة + نافذة المنع ⇒ يجبر إعادة الدورة
  const tiny = pool.slice(0, 5);
  const rand = seededRand(7);
  let recent: string[] = [];
  let lastId = "";
  let immediateRepeats = 0;
  for (let i = 0; i < 30; i++) {
    const r = pickNextBatch(tiny, recent, 2, rand);
    assert(r.batch.length > 0, i === 0 ? "يعيد عناصر رغم صغر المجمّع" : "");
    if (r.batch[0].id === lastId) immediateRepeats++;
    lastId = r.batch[r.batch.length - 1].id;
    recent = r.recent;
  }
  assert(immediateRepeats === 0, "لا يظهر العنصر نفسه مرتين متتاليتين حتى بعد إعادة الخلط");
}

console.log("\n=== فاصل التدوير ===");
{
  const lo = nextRotationDelayMs(() => 0);
  const hi = nextRotationDelayMs(() => 0.999999);
  assert(lo === 50_000, `الحد الأدنى 50 ثانية (${lo}ms)`);
  assert(hi <= 80_000 && hi >= 79_000, `الحد الأعلى 80 ثانية (${hi}ms)`);
}

console.log("\n=== التخزين المحلي ===");
{
  const store: Record<string, string> = {};
  const fake = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: () => null,
    length: 0,
  } as unknown as Storage;

  writeRecent(["a", "b", "c"], fake);
  assert(JSON.stringify(readRecent(fake)) === '["a","b","c"]', "الحفظ والقراءة يعملان");
  assert(store[RECENT_STORAGE_KEY] !== undefined, "يُستعمل المفتاح المعلن");

  const many = Array.from({ length: 50 }, (_, i) => `id-${i}`);
  writeRecent(many, fake);
  assert(readRecent(fake).length === RECENT_LIMIT, `لا يُحفظ أكثر من ${RECENT_LIMIT} معرّفًا`);
  assert(readRecent(fake)[RECENT_LIMIT - 1] === "id-49", "يُحتفظ بالأحدث لا بالأقدم");

  // تخزين معطّل يجب ألّا يرمي
  const broken = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
  } as unknown as Storage;
  let threw = false;
  try { writeRecent(["x"], broken); readRecent(broken); } catch { threw = true; }
  assert(!threw, "تعطّل التخزين لا يُسقِط الشريط");
}

console.log(`\n${"─".repeat(44)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
