/**
 * بوابة: أداء خفيف + هيكل المزيد بعد إعادة التنظيم.
 * تشغيل: node --import tsx src/lib/__tests__/perf-nav-ia.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SERVICES_CENTER_GROUPS } from "@/lib/services-center-nav";
import { HOME_CONTENT_HUB } from "@/lib/home-content-hub";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const groupIds = SERVICES_CENTER_GROUPS.map((g) => g.id);
assert.deepEqual(groupIds, ["hubs", "features", "content", "settings"], "هيكل المزيد: المزيد ثم أدوات ثم محتوى ثم إعدادات");
assert.equal(SERVICES_CENTER_GROUPS[0]?.title, "المزيد");
assert.equal(SERVICES_CENTER_GROUPS[0]?.layout, "featured");
assert.equal(SERVICES_CENTER_GROUPS[1]?.title, "أدوات سريعة");
assert.equal(SERVICES_CENTER_GROUPS[2]?.title, "محتوى إضافي");
assert.equal(SERVICES_CENTER_GROUPS[3]?.title, "الإعدادات والمساعدة");

const hubLabels = SERVICES_CENTER_GROUPS[0]!.items.map((i) => i.label);
assert.deepEqual(
  hubLabels,
  [
    "الأذكار",
    "المكتبة",
    "العلماء",
    "الحديث",
    "قصص الأنبياء",
    "سين جيم",
    "الفوائد والبطاقات",
    "البحث",
    "الإعدادات",
  ],
  "ترتيب أبواب المزيد المعتمد",
);

const hubHrefs = SERVICES_CENTER_GROUPS[0]!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.deepEqual(hubHrefs, [
  "/adhkar",
  "/library",
  "/scholars",
  "/hadith",
  "/prophets",
  "/quiz",
  "/fawaid",
  "/settings",
]);

const moreSections = readFileSync(resolve(root, "features/more/moreSections.ts"), "utf8");
assert.match(moreSections, /MORE_FEATURED_SECTIONS/, "مصدر واحد moreSections.ts");
assert.match(moreSections, /tier: "featured"/, "الأبواب tier=featured");
assert.doesNotMatch(moreSections, /المسارات العلمية|مسارات التعلم|ابدأ من هنا/);

const app = readFileSync(resolve(root, "App.tsx"), "utf8");
for (const href of hubHrefs) {
  assert.ok(app.includes(`path="${href}"`), `مسار مسجّل في App: ${href}`);
}

const contentHrefs = SERVICES_CENTER_GROUPS[2]!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.ok(!contentHrefs.includes("/start-here"), "لا start-here في المحتوى");
assert.ok(!contentHrefs.includes("/rulings"), "الأحكام ليست قسماً رئيسياً");
assert.ok(!contentHrefs.includes("/fiqh-council"), "المجمع ليس قسماً رئيسياً");
assert.ok(contentHrefs.includes("/seerah") || contentHrefs.includes("/tawhid"));

const settingsHrefs = SERVICES_CENTER_GROUPS[3]!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.ok(settingsHrefs.includes("/methodology") && settingsHrefs.includes("/privacy"));

assert.ok(Array.isArray(HOME_CONTENT_HUB) || typeof HOME_CONTENT_HUB === "object");

console.log("perf-nav-ia.test.ts: ok");
