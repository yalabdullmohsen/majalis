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
  quranHubSections,
  lessonsHubSections,
  sectionsForSurface,
  SECTION_MERGE_REDIRECTS,
} from "@/config/sections.registry";

assert.equal(SECTION_GROUP_ORDER.length, 7);
assert.equal(SECTION_GROUP_ORDER.at(-1), "account");
assert.equal(featuredSections().length, 6);
assert.deepEqual(
  bottomNavSections().map((s) => s.id),
  ["quran", "lessons", "prayer", "fiqh", "sections"],
);
assert.equal(bottomNavSections()[0]?.label, "مركز القرآن");
assert.equal(bottomNavSections()[4]?.label, "الأقسام");
assert.ok(quranHubSections().some((s) => s.id === "open-mushaf" && s.label === "فتح المصحف"));
assert.ok(quranHubSections().some((s) => s.id === "quran-numbers"));
assert.ok(quranHubSections().some((s) => s.id === "quran-tajweed"));
assert.ok(quranHubSections().some((s) => s.id === "quran-qiraat"));
assert.ok(quranHubSections().length >= 12);
assert.ok(lessonsHubSections().some((s) => s.id === "quran-circles"));
assert.ok(lessonsHubSections().some((s) => s.id === "competitions"));
assert.equal(
  quranHubSections().some((s) => s.id === "quran-circles"),
  false,
);
for (const s of quranHubSections()) {
  assert.equal(s.hub, "quran", s.id);
}
for (const s of lessonsHubSections()) {
  assert.equal(s.hub, "lessons", s.id);
}
assert.equal(
  featuredSections().every((s) => s.hub === "sections"),
  true,
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
assert.ok(drawer.includes("sections"));
assert.ok(drawer.includes("account"));
assert.equal(drawer.includes("tafsir"), false);
assert.ok(drawer.length <= 12);

assert.ok(SECTION_MERGE_REDIRECTS.some((r) => r.from === "/more" && r.to === "/sections"));
assert.ok(SECTIONS.some((s) => s.id === "flashcards" && s.aliases?.includes("المحفوظات")));
assert.ok(SECTIONS.some((s) => s.id === "sections" && s.aliases?.includes("المزيد")));
assert.ok(SECTIONS.some((s) => s.id === "quran" && s.aliases?.includes("قرآن")));

console.log(`sections-registry.test: OK (${SECTIONS.length} sections)`);
