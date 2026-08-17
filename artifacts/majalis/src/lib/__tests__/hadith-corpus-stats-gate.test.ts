/**
 * بوابة إحصائيات الحديث + عيّنة المعرّفات والبحث.
 * تشغيل: node --import tsx src/lib/__tests__/hadith-corpus-stats-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildHadithStatsSnapshot,
  HADITH_STAT_CARDS,
  HADITH_STATS_SOURCE,
} from "../hadith-stats";
import {
  formatHadithId,
  getHadithFromMemory,
  listSampleHadithIds,
  parseHadithId,
  searchHadithCorpus,
} from "../hadith-corpus";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

console.log("=== إحصائيات منقولة بلا نسب مبهمة ===");
const snap = buildHadithStatsSnapshot();
assert.ok(snap.kpis.length >= 4, "بطاقات KPI كافية");
for (const kpi of snap.kpis) {
  assert.ok(kpi.numberingSystem || kpi.hint, `${kpi.id}: نظام ترقيم أو تلميح`);
  assert.ok(kpi.sourceLine, `${kpi.id}: مصدر`);
  if (kpi.namedRatio) {
    assert.ok(kpi.namedRatio.label.includes("نسبة") || kpi.namedRatio.label.length > 8, "نسبة مسمّاة");
    assert.ok(kpi.namedRatio.whole > 0, "مقام النسبة");
  }
}
assert.equal(HADITH_STATS_SOURCE.bukhari, 7563);
assert.equal(HADITH_STATS_SOURCE.muslim, 3033);
assert.ok(!JSON.stringify(snap).includes("14940"), "لا جمع مرآة مضلّل");
assert.ok(
  HADITH_STAT_CARDS.every((c) => c.source?.book && c.numberingSystem),
  "كل بطاقة لها مصدر وترقيم",
);

const panelSrc = readFileSync(resolve(root, "src/components/hadith/HadithStatsPanel.tsx"), "utf8");
assert.ok(!panelSrc.includes("formatHadithPct(kpi.value, kpi.pctOf)"), "لا شارة pctOf مبهمة");

console.log("=== معرّفات ثابتة + عيّنة ٥٠ ===");
assert.deepEqual(parseHadithId("bukhari:1"), { book: "bukhari", number: 1 });
assert.equal(formatHadithId("muslim", 5), "muslim:5");
const ids = listSampleHadithIds();
assert.ok(ids.length === 50, `عيّنة ٥٠ (الفعلي ${ids.length})`);
assert.equal(new Set(ids).size, ids.length, "صفر معرّف مكرر");
const h1 = getHadithFromMemory("bukhari:1");
assert.ok(h1?.matn && h1.grade?.attributedTo, "bukhari:1 متن وحكم منسوب");

const mawdu = ids.find((id) => id.startsWith("mawdu:"));
if (mawdu) {
  const m = getHadithFromMemory(mawdu);
  assert.ok(m?.isMawdu && m.mawduWarning, "موضوع بتحذير");
}

console.log("=== بحث الرقم / المعرّف / المتن / الراوي ===");
assert.ok(searchHadithCorpus("bukhari:1").some((r) => r.id === "bukhari:1"));
assert.ok(searchHadithCorpus("1").length >= 1);
const matnHit = searchHadithCorpus("النيات");
assert.ok(matnHit.length >= 1, "بحث جزء المتن");
const narratorHit = searchHadithCorpus("عمر");
assert.ok(narratorHit.length >= 1, "بحث الراوي");

const tickerSrc = readFileSync(resolve(root, "src/components/HeaderTicker.tsx"), "utf8");
assert.ok(!tickerSrc.includes("setStickyPaused"), "لا إيقاف دائم بنقرة على الشريط");
assert.ok(tickerSrc.includes("useTransientPause") || tickerSrc.includes("onPointerDown"), "إيقاف مؤقت بالتفاعل");
assert.ok(tickerSrc.includes("useRotateFallback") || tickerSrc.includes("scrollWidth"), "بديل عند ضيق المحتوى");

const license = readFileSync(resolve(root, "content/hadith-corpus/LICENSE_RISKS.md"), "utf8");
assert.ok(license.includes("MIT") || license.includes("مرآة"), "ترخيص موثّق");
assert.ok(
  readFileSync(resolve(root, "content/hadith-corpus/HADITH_IMPORT_QUEUE.md"), "utf8").includes("الأحمد") ||
    readFileSync(resolve(root, "content/hadith-corpus/HADITH_IMPORT_QUEUE.md"), "utf8").includes("أحمد"),
  "طابور الكتب التسعة",
);

console.log("hadith-corpus-stats-gate.test.ts: ok");
