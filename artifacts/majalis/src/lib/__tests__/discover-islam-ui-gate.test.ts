/**
 * بوابة UI: التعريف بالإسلام — هوية موحّدة داخل القسم وخارجه.
 * تشغيل: node --import tsx src/lib/__tests__/discover-islam-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/styles/discover-islam.css");
const shell = read("src/components/discover-islam/DiscoverIslamShell.tsx");
const hub = read("src/views/DiscoverIslamPage.tsx");
const questions = read("src/views/DiscoverIslamQuestionsPage.tsx");
const doubts = read("src/views/DiscoverIslamDoubtsPage.tsx");
const qDetail = read("src/views/DiscoverIslamQuestionDetailPage.tsx");
const dDetail = read("src/views/DiscoverIslamDoubtDetailPage.tsx");
const article = read("src/views/DiscoverIslamArticleDetailPage.tsx");
const howto = read("src/views/HowToBecomeMuslimPage.tsx");
const path = read("src/views/NewMuslimPathPage.tsx");
const day = read("src/views/NewMuslimDayDetailPage.tsx");
const contact = read("src/views/DiscoverIslamContactPage.tsx");
const calm = read("src/styles/sections-calm-polish.css");
const unify = read("src/styles/visual-identity-unify.css");

assert.match(shell, /dii-page/);
assert.match(shell, /dii-page--detail/);
assert.match(css, /\.dii-block\b/);
assert.match(css, /\.dii-page--detail/);
assert.match(css, /border-radius:\s*var\(--radius-card,\s*24px\)/);

assert.match(hub, /eyebrow="التعريف بالإسلام"/);
assert.match(hub, /HubCard/);
assert.doesNotMatch(hub, /section-cards\.css/);
assert.doesNotMatch(hub, /platform-content-card/);
assert.match(hub, /dii-list-card/);

for (const [name, src] of [
  ["questions", questions],
  ["doubts", doubts],
  ["qDetail", qDetail],
  ["dDetail", dDetail],
  ["article", article],
  ["howto", howto],
  ["path", path],
  ["day", day],
  ["contact", contact],
] as const) {
  assert.match(src, /DiscoverIslamShell/, `${name}: غلاف موحّد`);
  assert.doesNotMatch(src, /\bui-card\b/, `${name}: بلا ui-card`);
}

assert.match(questions, /dii-list-card/);
assert.match(doubts, /dii-list-card/);
assert.match(qDetail, /dii-block/);
assert.match(dDetail, /dii-block/);
assert.match(howto, /dii-block/);

for (const cls of ["dii-block", "dii-list-card", "dii-journey-step", "dii-path-day"]) {
  assert.match(calm, new RegExp(`\\.${cls}`), `calm يشمل .${cls}`);
  assert.match(unify, new RegExp(`\\.${cls}`), `unify يشمل .${cls}`);
}

console.log("discover-islam-ui-gate.test.ts: ok");
