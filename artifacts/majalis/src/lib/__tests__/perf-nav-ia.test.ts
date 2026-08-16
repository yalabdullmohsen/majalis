/**
 * بوابة: أداء خفيف + هيكل المزيد من سجل الأقسام.
 * تشغيل: node --import tsx src/lib/__tests__/perf-nav-ia.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SERVICES_CENTER_GROUPS } from "@/lib/services-center-nav";
import { HOME_CONTENT_HUB } from "@/lib/home-content-hub";
import {
  SECTION_GROUP_META,
  SECTION_GROUP_ORDER,
  featuredSections,
} from "@/config/sections.registry";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

assert.equal(SERVICES_CENTER_GROUPS[0]?.id, "hubs");
assert.equal(SERVICES_CENTER_GROUPS[0]?.layout, "featured");
assert.equal(SERVICES_CENTER_GROUPS[0]?.items.length, 6);

const featuredLabels = featuredSections().map((s) => s.label);
assert.deepEqual(SERVICES_CENTER_GROUPS[0]!.items.map((i) => i.label), featuredLabels);

for (const g of SECTION_GROUP_ORDER) {
  assert.ok(
    SERVICES_CENTER_GROUPS.some((x) => x.id === g && x.title === SECTION_GROUP_META[g].label),
    `مجموعة ${g} في مركز الخدمات`,
  );
}

assert.equal(SERVICES_CENTER_GROUPS.at(-1)?.id, "session");

const hubHrefs = SERVICES_CENTER_GROUPS[0]!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);

const moreSections = readFileSync(resolve(root, "features/more/moreSections.ts"), "utf8");
assert.match(moreSections, /sections\.registry/, "moreSections من السجل");
assert.doesNotMatch(moreSections, /المسارات العلمية|مسارات التعلم|ابدأ من هنا/);

const app = readFileSync(resolve(root, "App.tsx"), "utf8");
for (const href of hubHrefs) {
  assert.ok(app.includes(`path="${href}"`), `مسار مسجّل في App: ${href}`);
}

const accountGroup = SERVICES_CENTER_GROUPS.find((g) => g.id === "account");
assert.ok(accountGroup);
const settingsHrefs = accountGroup!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.ok(settingsHrefs.includes("/methodology") && settingsHrefs.includes("/privacy"));

assert.ok(Array.isArray(HOME_CONTENT_HUB) || typeof HOME_CONTENT_HUB === "object");

console.log("perf-nav-ia.test.ts: ok");
