/**
 * PR-5: بقية الأقسام العامة — شرائط RTL + سطوح + لا قص للأذكار/الفقه.
 * node --import tsx src/lib/__tests__/sunnah-pr5-sections-visual-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const files = {
  cleanup: "src/styles/card-decorative-strip-cleanup.css",
  refresh: "src/styles/visual-refresh-v1.css",
  adhkar: "src/styles/pages/adhkar.css",
  seerah: "src/styles/pages/seerah.css",
  knowledge: "src/styles/pages/knowledge.css",
  fiqh: "src/styles/pages/fiqh-hub.css",
  asyncErr: "src/styles/components/async-data-error.css",
  lessons: "src/styles/pages/lessons.css",
  notFound: "src/styles/pages/not-found.css",
} as const;

for (const rel of Object.values(files)) {
  assert.ok(existsSync(resolve(root, rel)), `مفقود: ${rel}`);
}

const cleanup = read(files.cleanup);
const refresh = read(files.refresh);
const adhkar = read(files.adhkar);
const seerah = read(files.seerah);
const knowledge = read(files.knowledge);
const fiqh = read(files.fiqh);
const asyncErr = read(files.asyncErr);
const lessons = read(files.lessons);
const notFound = read(files.notFound);

console.log("=== Strip cleanup RTL end bars ===");
assert.match(cleanup, /border-inline-end-width:\s*1px\s*!important/);
assert.match(cleanup, /\.twh-section-intro/);
assert.match(cleanup, /\.uq-lead/);
assert.match(cleanup, /\.soft-card\s+\.soft-card/);
assert.doesNotMatch(cleanup, /border-inline-end:\s*[34]px/);

console.log("=== Visual refresh PR-5 coverage ===");
assert.match(refresh, /بقية الأقسام العامة \(PR-5\)/);
assert.match(refresh, /\.fiqh-category-card/);
assert.match(refresh, /\.lesson-unified-card/);
assert.match(refresh, /\.knowledge-article/);
assert.match(refresh, /\.ss-state-card/);
assert.match(refresh, /\.adhkar-focus-card/);

console.log("=== Adhkar / Seerah / Fiqh content height ===");
assert.match(adhkar, /\.adhkar-focus-card[\s\S]*?min-height:\s*12\.5rem/s);
assert.match(adhkar, /^\s*height:\s*auto;/m);
assert.doesNotMatch(adhkar, /^\s*height:\s*12\.5rem;/m);
assert.doesNotMatch(seerah, /\.seerah-panel\s*\{[^}]*min-height:\s*340px/s);
assert.match(fiqh, /\.fiqh-category-card\s*\{[\s\S]*?max-height:\s*none/s);
assert.match(fiqh, /\.fiqh-category-card\s*\{[\s\S]*?overflow:\s*visible/s);

console.log("=== Knowledge + empty/error tokens ===");
assert.doesNotMatch(knowledge, /background:\s*var\(--surface-brand-solid,\s*#0f6b4c\)/);
assert.match(knowledge, /--svl-surface-primary/);
assert.doesNotMatch(asyncErr, /color:\s*#dc2626/);
assert.match(asyncErr, /--mj-danger|--svl-accent-danger/);
assert.match(lessons, /--svl-surface-primary/);
assert.match(notFound, /min\(70vh,\s*32rem\)/);

console.log("sunnah-pr5-sections-visual-gate: ok");
