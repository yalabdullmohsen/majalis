/**
 * يحرس عطلاً حقيقيًا مؤكَّدًا حيًا على الإنتاج: registerProductionServiceWorker
 * كانت تنتظر حدث "load" داخليًا، بينما المستدعي (main.tsx) يستدعيها أصلاً
 * بعد اكتمال "load" (أو readyState === "complete") — فينتظر حدثًا وقع مرة
 * واحدة ولن يتكرر، فلا يُسجَّل الـService Worker إطلاقًا. أُصلح بإزالة
 * الانتظار الداخلي المكرِّر.
 *
 * تشغيل: npx tsx src/lib/__tests__/service-worker-registration-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const src = readFileSync(resolve(root, "lib/service-worker.ts"), "utf8");
const main = readFileSync(resolve(root, "main.tsx"), "utf8");

let passed = 0;
let failed = 0;
function assertLabel(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== registerProductionServiceWorker لا تنتظر load من جديد ===");
{
  const fnMatch = src.match(
    /export function registerProductionServiceWorker\(\): void \{[\s\S]*?\n\}/,
  );
  assert.ok(fnMatch, "الدالة موجودة");
  const body = fnMatch![0];
  assertLabel(
    !/addEventListener\(\s*["']load["']/.test(body),
    'لا addEventListener("load", ...) داخل الدالة — المستدعي يضمن ذلك مسبقًا',
  );
  assertLabel(
    /purgeStaleServiceWorkers\(\)\.then/.test(body),
    "يستدعي purgeStaleServiceWorkers().then مباشرة دون انتظار حدث",
  );
  assertLabel(
    /navigator\.webdriver/.test(body),
    "لا تسجيل SW تحت webdriver حتى لا تنكسر بوابة LHCI (charset/best-practices)",
  );
  assertLabel(
    /unregisterServiceWorkersForMeasurement/.test(body),
    "إلغاء تسجيل كل SW تحت webdriver وليس تجاهل التسجيل فقط",
  );
}

console.log("\n=== main.tsx يلغي SW مبكراً تحت webdriver ===");
{
  assertLabel(
    /navigator\.webdriver/.test(main) && /getRegistrations\(\)/.test(main),
    "main.tsx يلغي SW القديم فور الإقلاع تحت webdriver",
  );
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
