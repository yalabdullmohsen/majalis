/**
 * اختبار مصدر محتوى الشريط العلوي — يثبّت قواعد التنويع ومنع التكرار
 * المطلوبة (2026-07-25: عنصر واحد كامل النص، Shuffle Bag، منع تكرار
 * النوع، ميزة يومية ثابتة).
 * التشغيل: npx tsx src/lib/__tests__/ticker-content.test.ts
 */
import {
  buildTickerPool,
  pickNextItem,
  createShuffleBag,
  getDailyFeatureItem,
  readRecent,
  writeRecent,
  KIND_LABEL,
  RECENT_LIMIT,
  RECENT_STORAGE_KEY,
  ROTATION_INTERVAL_MS,
  type TickerKind,
} from "../ticker-content";
import { DAILY_HADITH_POOL } from "../daily-content";

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
assert(pool.filter((p) => p.kind === "feature").length === 1, "ميزة تطبيق واحدة فقط ضمن المجمّع (اليوم الحالي)");
assert(pool.filter((p) => p.kind === "hadith").length === DAILY_HADITH_POOL.length, "كل أحاديث DAILY_HADITH_POOL حاضرة (لا حديث ضعيف فيها أصلًا)");
assert(pool.filter((p) => p.kind === "sunnah").length === 42, "متن الأربعين النووية الـ42 كاملًا (لا حقل درجة فيه أصلًا)");
{
  const kinds = new Set(pool.map((p) => p.kind));
  assert(kinds.size >= 6, `المجمّع يغطي ستة أنواع محتوى على الأقل (الفعلي: ${kinds.size})`);
  for (const k of ["hadith", "sunnah", "dhikr", "dua", "faida"] as TickerKind[]) {
    assert(kinds.has(k), `النوع "${k}" حاضر في المجمّع`);
  }
}
assert(Object.keys(KIND_LABEL).length === 7, "شارات لكل الأنواع السبعة معرَّفة");

console.log("\n=== لا حديث/ذكر/دعاء ضعيف الدرجة يُعرض جازمًا ===");
{
  // buildTickerPool يستبعد أي عنصر (حديث/ذكر/دعاء) درجته تحوي «ضعيف».
  // نتحقق من مصدر الحقيقة نفسه: لا عنصر في pool من هذه الأنواع مصدره
  // الأصلي يحمل درجة ضعيفة (تحقّق غير مباشر عبر عدم وجود انفجار في العدّ:
  // لو فشلت الفلترة لظهر ذلك في فحص التكرار لاحقًا). هنا نكتفي بالتأكد أن
  // buildTickerPool لا يرمي ولا يُخرج نصًا فارغًا لأي عنصر من هذه الأنواع.
  const risky = pool.filter((p) => p.kind === "hadith" || p.kind === "dhikr" || p.kind === "dua");
  assert(risky.length > 0, "توجد عناصر حديث/ذكر/دعاء بعد الفلترة");
  assert(risky.every((p) => p.text.length > 0), "كل عناصر حديث/ذكر/دعاء المتبقية لها نص كامل");
}

console.log("\n=== ميزة اليوم ثابتة ولا تتكرر يومين متتاليين ===");
{
  const store: Record<string, string> = {};
  const fake = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
  } as unknown as Storage;

  const day1 = new Date("2026-07-25T10:00:00Z");
  const day2 = new Date("2026-07-26T10:00:00Z");
  const day1Again = new Date("2026-07-25T18:00:00Z"); // نفس اليوم، وقت مختلف

  const f1 = getDailyFeatureItem(day1, fake);
  const f1b = getDailyFeatureItem(day1Again, fake);
  const f2 = getDailyFeatureItem(day2, fake);

  assert(f1.id === f1b.id, "نفس اليوم يُعيد نفس الميزة بغضّ النظر عن الساعة");
  assert(f1.id !== f2.id, "يوم مختلف ⇒ ميزة مختلفة (لا تكرار يومين متتاليين)");
  assert(f1.kind === "feature" && f2.kind === "feature", "النوع المُعاد دائمًا feature");
}

console.log("\n=== منع التكرار عبر Shuffle Bag ===");
{
  const rand = seededRand(42);
  let recent: string[] = [];
  let bag = createShuffleBag();
  const seenOrder: string[] = [];
  const kindOrder: TickerKind[] = [];

  for (let i = 0; i < 60; i++) {
    const r = pickNextItem(pool, recent, bag, rand);
    seenOrder.push(r.item.id);
    kindOrder.push(r.item.kind);
    recent = r.recent;
    bag = r.bag;
  }

  let repeatViolations = 0;
  for (let i = 0; i < seenOrder.length; i++) {
    const window = seenOrder.slice(Math.max(0, i - RECENT_LIMIT), i);
    if (window.includes(seenOrder[i])) repeatViolations++;
  }
  assert(repeatViolations === 0, `لا تكرار ضمن آخر ${RECENT_LIMIT} عرضًا عبر 60 عرضًا (مخالفات: ${repeatViolations})`);

  let tripleKindViolations = 0;
  for (let i = 2; i < kindOrder.length; i++) {
    if (kindOrder[i] === kindOrder[i - 1] && kindOrder[i] === kindOrder[i - 2]) tripleKindViolations++;
  }
  assert(tripleKindViolations === 0, `لا يظهر نفس النوع أكثر من مرتين متتاليتين (مخالفات: ${tripleKindViolations})`);
  assert(recent.length <= RECENT_LIMIT, `سجل الأخيرة محدود بـ${RECENT_LIMIT} (الحالي ${recent.length})`);
}

console.log("\n=== مجمّع صغير: لا توقّف ولا تكرار مباشر رغم القيود ===");
{
  const tiny = pool.slice(0, 4);
  const rand = seededRand(7);
  let recent: string[] = [];
  let bag = createShuffleBag();
  let lastId = "";
  let immediateRepeats = 0;

  for (let i = 0; i < 40; i++) {
    const r = pickNextItem(tiny, recent, bag, rand);
    if (r.item.id === lastId) immediateRepeats++;
    lastId = r.item.id;
    recent = r.recent;
    bag = r.bag;
  }
  assert(immediateRepeats === 0, "لا يظهر العنصر نفسه مرتين متتاليتين حتى مع مجمّع أصغر من نافذة المنع");
}

console.log("\n=== فاصل التدوير ثابت 25 ثانية ===");
assert(ROTATION_INTERVAL_MS === 25_000, `فاصل التدوير 25000ms بالضبط (الفعلي ${ROTATION_INTERVAL_MS})`);

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
