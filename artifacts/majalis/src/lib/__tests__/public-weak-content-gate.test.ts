/**
 * بوابة: لا يظهر الضعيف/غير الثابت في الواجهة العامة (الرئيسية، الشريط، ورد اليوم).
 * التشغيل: node --import tsx src/lib/__tests__/public-weak-content-gate.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PUBLIC_WEAK_PHRASES,
  containsPublicWeakPhrase,
  filterForPublicZone,
  isBlockedFromPublic,
} from "../content-display-zones";
import { buildTickerPool } from "../ticker-content";
import {
  DAILY_HADITH_POOL,
  getDailyDhikr,
  getDailyHadith,
  getDayIndex,
} from "../daily-content";
import { DAILY_TICKER_DHIKR } from "../daily-ticker-dhikr";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function scanFields(label: string, fields: (string | undefined)[]) {
  for (const field of fields) {
    if (!field?.trim()) continue;
    for (const phrase of PUBLIC_WEAK_PHRASES) {
      assert(
        !field.includes(phrase),
        `${label}: لا يحتوي «${phrase}» (وجد: ${field.slice(0, 60)}…)`,
      );
    }
    assert(!containsPublicWeakPhrase(field), `${label}: بلا عبارات ضعيفة`);
  }
}

console.log("\n=== فلترة pools اليومية ===");
{
  const publicHadith = filterForPublicZone(DAILY_HADITH_POOL, "dailyReminder");
  assert(publicHadith.length > 0, "يوجد أحاديث صالحة للورد اليومي");
  assert(
    publicHadith.every((h) => !isBlockedFromPublic(h)),
    "كل أحاديث الورد اليومي تمرّ فلتر العرض العام",
  );

  const publicDhikr = filterForPublicZone(DAILY_TICKER_DHIKR, "dailyReminder");
  assert(publicDhikr.length > 0, "يوجد أذكار صالحة للورد اليومي");
  assert(
    DAILY_TICKER_DHIKR.some((d) => isBlockedFromPublic(d)),
    "توجد أذكار محجوبة (للقسم التعليمي فقط)",
  );
  assert(
    publicDhikr.every((d) => !isBlockedFromPublic(d)),
    "أذكار الورد اليومي بلا ضعيف",
  );
}

console.log("\n=== ورد اليوم — 366 يومًا ===");
{
  for (let i = 0; i < 366; i++) {
    const date = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000);
    const hadith = getDailyHadith(date);
    const dhikr = getDailyDhikr(date);
    assert(!isBlockedFromPublic(hadith), `اليوم ${i}: حديث الورد مسموح`);
    scanFields(`اليوم ${i} حديث`, [hadith.text, hadith.source, hadith.grade]);
    scanFields(`اليوم ${i} ذكر`, [dhikr.text, dhikr.source]);
  }
  assert(getDayIndex() >= 0, "getDayIndex يعمل");
}

console.log("\n=== الشريط العلوي ===");
{
  const morning = buildTickerPool(new Date("2026-08-30T08:00:00"));
  const evening = buildTickerPool(new Date("2026-08-30T19:00:00"));
  for (const pool of [morning, evening]) {
    for (const item of pool) {
      if (item.kind === "promo") continue;
      assert(!isBlockedFromPublic(item), `${item.id}: محتوى الشريط مسموح`);
      scanFields(item.id, [item.label, item.previewText, item.text, item.source]);
    }
  }
  assert(
    !poolHasPhrase(morning, "حديث تنبيه الحديث") && !poolHasPhrase(evening, "حديث تنبيه الحديث"),
    "لا عبارة «حديث تنبيه الحديث»",
  );
  assert(
    morning.some((p) => p.label === "حديث اليوم"),
    "تسمية حديث اليوم موجودة",
  );
  assert(
    morning.some((p) => p.label === "ذكر ثابت"),
    "تسمية ذكر ثابت موجودة",
  );
}

function poolHasPhrase(pool: ReturnType<typeof buildTickerPool>, phrase: string): boolean {
  return pool.some(
    (p) =>
      p.label.includes(phrase) ||
      p.text.includes(phrase) ||
      p.previewText.includes(phrase) ||
      (p.source?.includes(phrase) ?? false),
  );
}

console.log("\n=== HeaderTicker — لا «تنبيه الحديث» ===");
{
  const src = readFileSync(resolve(appRoot, "src/components/HeaderTicker.tsx"), "utf-8");
  assert(!src.includes("تنبيه الحديث"), "أُزيل span تنبيه الحديث");
  assert(!src.includes("header-ticker__warn"), "لا عنصر warn منفصل");
  assert(src.includes("previewText"), "يعرض معاينة مختصرة");
}

console.log("\n=== HadithDaifPage — للتعليم فقط ===");
{
  const src = readFileSync(resolve(appRoot, "src/pages/hadith/HadithDaifPage.tsx"), "utf-8");
  assert(src.includes("أحاديث ضعيفة للتنبيه والتمييز"), "عنوان تعليمي واضح");
  assert(src.includes("WEAK_HADITH_EDUCATIONAL_DISCLAIMER"), "تنبيه ثابت");
}

console.log(`\n${"─".repeat(44)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
