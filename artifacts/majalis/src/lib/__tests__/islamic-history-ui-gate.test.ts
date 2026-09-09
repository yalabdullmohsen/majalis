/**
 * بوابة واجهة قسم التاريخ الإسلامي — مؤشر مرحلة، بطاقات، تفاصيل.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getAdjacentHistoryItems,
  getEraStageInfo,
  getHistoryByCategory,
  getSameEraRelated,
  HISTORY_CATEGORY_ORDER,
  HISTORY_ERA_META,
  ISLAMIC_HISTORY_ITEMS,
} from "../../data/islamic-history/index.ts";

const root = resolve(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const hub = read("views/TarikhIslamiPage.tsx");
const detail = read("views/TarikhIslamiDetailPage.tsx");
const stage = read("components/history/HistoryStageIndicator.tsx");
const css = read("styles/pages/tarikh-islami.css");

assert.match(hub, /HistoryStageIndicator/, "الصفحة الرئيسية تعرض مؤشر المرحلة");
assert.match(hub, /data-testid="history-stage-indicator"|HistoryStageIndicator/, "مؤشر المرحلة موجود");
assert.match(hub, /فتح كل المراحل/, "زر فتح المراحل بصياغة واضحة");
assert.match(hub, /طي الكل/, "زر طي الكل");
assert.match(hub, /عرض الكل/, "زر عرض الكل");
assert.doesNotMatch(hub, /فتح كل الدول/, "لا عبارة مربكة «فتح كل الدول»");
assert.match(hub, /اقرأ التفاصيل/, "بطاقة الحدث لها CTA واضح");
assert.match(hub, /\/tarikh-islami\/\$\{item\.id\}|\/tarikh-islami\/\$\{/, "البطاقات تربط لصفحة التفاصيل");
assert.match(hub, /ابدأ من هنا/, "قسم ابدأ من هنا");
assert.match(hub, /المسار كاملاً/, "المسار كاملاً");
assert.match(hub, /ISLAMIC_HISTORY_ITEMS/, "بيانات موحدة");
assert.match(hub, /SEARCH_INPUT_ATTRS/, "بحث موحّد");

assert.match(stage, /المرحلة/, "المؤشر يذكر رقم المرحلة");
assert.match(stage, /progressbar/, "شريط تقدم");

assert.match(detail, /breadcrumb/, "تفاصيل الحدث لها breadcrumb");
assert.match(detail, /HISTORY_CATEGORIES\[item\.category\]/, "breadcrumb يشمل المرحلة");
assert.match(detail, /title="المصادر"/, "المصادر داخل بطاقة");
assert.match(detail, /getAdjacentHistoryItems/, "روابط سابق/تالي");
assert.match(detail, /tarikh-toc/, "فهرس داخلي");
assert.match(detail, /title="الشرح"/, "قسم الشرح");
assert.match(detail, /ReadingSectionCard/, "بطاقات قراءة");

assert.match(css, /\.tarikh-stage/, "أنماط مؤشر المرحلة");
assert.match(css, /\.tarikh-toc/, "أنماط الفهرس");
assert.match(css, /bottom-nav-height/, "مساحة bottom nav");
assert.match(css, /\.tarikh-card__summary[\s\S]{0,220}--mj-ink-2/, "ملخص البطاقة ليس باهتاً بشفافية منخفضة");

for (const id of HISTORY_CATEGORY_ORDER) {
  const events = getHistoryByCategory(id);
  const info = getEraStageInfo(id);
  assert.equal(info.eventCount, events.length, `${id}: عدد أحداث المرحلة`);
  assert.equal(info.meta.id, HISTORY_ERA_META[id].id);
}

assert.ok(ISLAMIC_HISTORY_ITEMS.length > 0, "يوجد أحداث");
const sample = ISLAMIC_HISTORY_ITEMS.find((i) => i.category === "rashidun") ?? ISLAMIC_HISTORY_ITEMS[0];
const adj = getAdjacentHistoryItems(sample.id);
const related = getSameEraRelated(sample, 4);
assert.ok(related.every((r) => r.category === sample.category), "ذات صلة من نفس المرحلة");
if (adj.next) {
  assert.equal(adj.next.category, sample.category, "التالي من نفس المرحلة إن وُجد");
}

console.log("islamic-history-ui-gate.test.ts: ok");
