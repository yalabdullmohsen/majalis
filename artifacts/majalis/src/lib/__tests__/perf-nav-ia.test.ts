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
import { featuredSections } from "@/config/sections.registry";
import { MORE_FEATURED_SECTIONS, MORE_IA_GROUP_TITLES } from "@/features/more/moreSections";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

assert.equal(SERVICES_CENTER_GROUPS[0]?.id, "hubs");
assert.equal(SERVICES_CENTER_GROUPS[0]?.layout, "featured");
assert.equal(MORE_FEATURED_SECTIONS.length, 7);
assert.deepEqual(
  MORE_FEATURED_SECTIONS.map((s) => s.title),
  featuredSections().map((s) => s.label),
);
assert.equal(MORE_IA_GROUP_TITLES.length, 7);
assert.equal(MORE_IA_GROUP_TITLES.at(-1), "الحساب والإعدادات");

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

assert.ok(Array.isArray(HOME_CONTENT_HUB) || typeof HOME_CONTENT_HUB === "object");

console.log("perf-nav-ia.test.ts: ok");
