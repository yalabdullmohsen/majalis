/**
 * بوابة بطاقة فتح المصحف في مركز القرآن.
 * تشغيل: node --import tsx src/lib/__tests__/quran-open-mushaf-card-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const hub = read("src/pages/quran/ui/QuranHubView.tsx");
const card = read("src/components/quran/QuranOpenMushafCard.tsx");
const css = read("src/styles/pages/quran-hub.css");
const lobby = read("src/components/lobby/SectionLobby.tsx");

assert.match(hub, /QuranOpenMushafCard/);
assert.match(hub, /primarySlot/);
assert.doesNotMatch(hub, /FeaturedSectionCard|card--featured/);
assert.doesNotMatch(hub, /loadLastPageSync/);

assert.match(card, /resolveMushafResumeInfo/);
assert.match(card, /آخر توقف/);
assert.match(card, /ابدأ القراءة من الفاتحة/);
assert.match(card, /متابعة القراءة/);
assert.match(card, /title="فتح المصحف"/);
assert.match(card, /data-section-card="open-mushaf"/);
assert.match(card, /try \{/);
assert.match(card, /catch/);

assert.match(css, /\.quran-open-mushaf\s*\{/);
assert.match(css, /quran-open-mushaf__cta-btn/);
assert.doesNotMatch(
  css,
  /\.quran-open-mushaf\s*\{[^}]*background-color:\s*var\(--color-primary-dark/,
  "بطاقة المصحف ليست مستطيلاً أخضر كاملًا",
);
assert.match(css, /html\[data-theme="dark"\] \.quran-open-mushaf/);

assert.match(lobby, /primarySlot/);

console.log("quran-open-mushaf-card-gate.test.ts: ok");
