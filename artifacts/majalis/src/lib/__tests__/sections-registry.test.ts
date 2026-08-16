/**
 * سلامة سجل الأقسام SSOT.
 * تشغيل: node --import tsx src/lib/__tests__/sections-registry.test.ts
 */
import assert from "node:assert/strict";
import {
  SECTIONS,
  SECTION_GROUP_ORDER,
  featuredSections,
  bottomNavSections,
  sectionsForSurface,
  SECTION_MERGE_REDIRECTS,
} from "@/config/sections.registry";

assert.equal(SECTION_GROUP_ORDER.length, 7);
assert.equal(SECTION_GROUP_ORDER.at(-1), "account");
assert.equal(featuredSections().length, 6);
assert.deepEqual(
  bottomNavSections().map((s) => s.id),
  ["home", "quran", "prayer", "lessons", "more"],
);

const ids = new Set(SECTIONS.map((s) => s.id));
assert.equal(ids.size, SECTIONS.length);

const routes = new Set(SECTIONS.map((s) => s.route));
assert.equal(routes.size, SECTIONS.length);

const labels = new Set(SECTIONS.map((s) => s.label));
assert.equal(labels.size, SECTIONS.length);

for (const s of SECTIONS) {
  assert.ok(s.subtitle.trim().length > 0, s.id);
  assert.ok([...s.subtitle].length <= 45, `${s.id} subtitle`);
  assert.ok(s.surfaces.length > 0, s.id);
}

const more = sectionsForSurface("moreHub").map((s) => s.id);
const drawer = sectionsForSurface("drawer").map((s) => s.id);
const shared = more.filter((id) => drawer.includes(id));
assert.deepEqual(
  drawer.filter((id) => more.includes(id)),
  shared,
);

assert.ok(SECTION_MERGE_REDIRECTS.length >= 5);
assert.ok(SECTIONS.some((s) => s.id === "flashcards" && s.aliases?.includes("المحفوظات")));

console.log(`sections-registry.test: OK (${SECTIONS.length} sections)`);
