/**
 * فحص تقادم البيانات الخارجية المتغيرة.
 *
 * يقرأ src/data/external-data-sources.json ويُعلّم كل مدخل تجاوز مدة صلاحيته
 * (lastVerified + ttlDays) بأنه يحتاج مراجعة، ثم يطبع تقريراً مختصراً.
 *
 * التشغيل:  npx tsx scripts/check-data-freshness.ts
 * الخروج:   0 = كل شيء ضمن الصلاحية، 1 = توجد مداخل متقادمة تحتاج تحقّقاً بشرياً.
 *
 * مقصود منه أن يُستدعى دورياً (يدوياً أو من مهمة مجدولة قائمة) — لا ينشئ أي
 * اتصال بخدمة خارجية ولا يعدّل بيانات، فهو آمن للتشغيل في أي وقت.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(here, "../src/data/external-data-sources.json");

type Entry = {
  id: string;
  label: string;
  value: string;
  kind: "current" | "estimate" | "historical" | "internal";
  source: string;
  sourceUrl?: string;
  lastVerified: string;
  ttlDays: number;
  status: string;
  note?: string;
  usedIn?: string[];
};

const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
  entries: Entry[];
};

const MS_PER_DAY = 86_400_000;
const today = new Date();

const stale: { entry: Entry; ageDays: number; overdueDays: number }[] = [];
const soon: { entry: Entry; remainingDays: number }[] = [];

for (const entry of registry.entries) {
  // الأرقام التاريخية الثابتة لا تتقادم.
  if (entry.kind === "historical") continue;

  const verified = new Date(entry.lastVerified);
  if (Number.isNaN(verified.getTime())) {
    console.error(`✗ ${entry.id}: تاريخ lastVerified غير صالح («${entry.lastVerified}»)`);
    process.exitCode = 1;
    continue;
  }

  const ageDays = Math.floor((today.getTime() - verified.getTime()) / MS_PER_DAY);
  const remainingDays = entry.ttlDays - ageDays;

  if (remainingDays < 0) stale.push({ entry, ageDays, overdueDays: -remainingDays });
  else if (remainingDays <= 30) soon.push({ entry, remainingDays });
}

console.log(`فحص تقادم البيانات — ${registry.entries.length} مدخلاً في السجل\n`);

if (stale.length) {
  console.log(`⚠ ${stale.length} مدخلاً تجاوز مدة صلاحيته ويحتاج تحقّقاً:\n`);
  for (const { entry, ageDays, overdueDays } of stale) {
    console.log(`  • ${entry.label}`);
    console.log(`    القيمة الحالية: ${entry.value}`);
    console.log(`    المصدر: ${entry.source}`);
    if (entry.sourceUrl) console.log(`    الرابط: ${entry.sourceUrl}`);
    console.log(`    آخر تحقق: ${entry.lastVerified} (منذ ${ageDays} يوماً، متأخر ${overdueDays} يوماً)`);
    if (entry.usedIn?.length) console.log(`    معروض في: ${entry.usedIn.join("، ")}`);
    console.log("");
  }
}

if (soon.length) {
  console.log(`ℹ ${soon.length} مدخلاً يقترب من نهاية صلاحيته:`);
  for (const { entry, remainingDays } of soon) {
    console.log(`  • ${entry.label} — يحتاج مراجعة خلال ${remainingDays} يوماً`);
  }
  console.log("");
}

if (!stale.length && !soon.length) {
  console.log("✓ كل البيانات الخارجية ضمن مدة صلاحيتها.");
}

const partial = registry.entries.filter((e) => e.status === "partial");
if (partial.length) {
  console.log(`ℹ ${partial.length} مدخلاً موسوم «partial» — تحقّق جزئي فقط:`);
  for (const entry of partial) console.log(`  • ${entry.label}: ${entry.note ?? ""}`);
  console.log("");
}

if (stale.length) process.exitCode = 1;
