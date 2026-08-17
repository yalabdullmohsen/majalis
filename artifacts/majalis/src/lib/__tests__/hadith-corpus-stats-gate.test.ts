/**
 * بوابة: إحصاءات الصحيحان محذوفة + عيّنة المعرّفات والبحث.
 * تشغيل: node --import tsx src/lib/__tests__/hadith-corpus-stats-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatHadithId,
  getHadithFromMemory,
  listSampleHadithIds,
  parseHadithId,
  searchHadithCorpus,
} from "../hadith-corpus";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== صفر لوحة إحصاءات الحديث ===");
assert.equal(existsSync(resolve(root, "src/components/hadith/HadithStatsPanel.tsx")), false);
assert.equal(existsSync(resolve(root, "src/lib/hadith-stats.ts")), false);
assert.equal(existsSync(resolve(root, "content/hadith-stats")), false);

const view = read("src/pages/hadith/ui/HadithView.tsx");
assert.doesNotMatch(view, /HadithStatsPanel/);
assert.doesNotMatch(view, /الصحيحان بالأرقام المنقولة/);
assert.doesNotMatch(view, /hadith-hub-stats/);

const css = read("src/styles/pages/hadith.css");
assert.doesNotMatch(css, /\.hsp\s*\{/);
assert.doesNotMatch(css, /hadith-hub-stats/);
assert.doesNotMatch(css, /الصحيحان بالأرقام/);

const cdn = read("src/lib/hadith-cdn-service.ts");
assert.doesNotMatch(cdn, /hadith-stats\/sahihayn/);
assert.doesNotMatch(cdn, /HadithStatsPanel/);

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

const tickerSrc = read("src/components/HeaderTicker.tsx");
assert.ok(!tickerSrc.includes("setStickyPaused"), "لا إيقاف دائم بنقرة على الشريط");
assert.ok(tickerSrc.includes("useTransientPause") || tickerSrc.includes("onPointerDown"), "إيقاف مؤقت بالتفاعل");
assert.ok(tickerSrc.includes("useRotateFallback") || tickerSrc.includes("scrollWidth"), "بديل عند ضيق المحتوى");

const license = read("content/hadith-corpus/LICENSE_RISKS.md");
assert.ok(license.includes("MIT") || license.includes("مرآة"), "ترخيص موثّق");
assert.ok(
  read("content/hadith-corpus/HADITH_IMPORT_QUEUE.md").includes("الأحمد") ||
    read("content/hadith-corpus/HADITH_IMPORT_QUEUE.md").includes("أحمد"),
  "طابور الكتب التسعة",
);

console.log("hadith-corpus-stats-gate.test.ts: ok");
