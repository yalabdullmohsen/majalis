/**
 * LayoutIntegrityGuard — يمنع هيرو عائم/إطار مقصوص وأدوات مشرف على السطح العام.
 * تشغيل: node --import tsx src/lib/__tests__/layout-integrity-guard.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const app = read("src/App.tsx");
const adminShell = read("src/views/admin/AdminShell.tsx");
const prophetsCss = read("src/styles/pages/prophet-stories.css");
const prophetsPage = read("src/views/ProphetStoriesPage.tsx");

console.log("=== Admin FABs خارج App العام ===");
assert.doesNotMatch(app, /AdminSiteEditBar/);
assert.match(adminShell, /AdminSiteEditBar/);

console.log("=== لا AdminQuickEdit في صفحات عامة ===");
for (const rel of [
  "src/views/SeerahPage.tsx",
  "src/views/MiraclesPage.tsx",
  "src/views/IslamicStoriesPage.tsx",
  "src/pages/hadith/ui/HadithView.tsx",
  "src/pages/lessons/ui/LessonsView.tsx",
  "src/pages/fiqh/ui/RulingsView.tsx",
]) {
  const src = read(rel);
  assert.doesNotMatch(src, /AdminQuickEdit/, `${rel} بلا AdminQuickEdit`);
}

console.log("=== هيرو قصص الأنبياء بلا هامش عائم وoverflow:clip ===");
assert.match(
  prophetsCss,
  /\.topic-page\.topic-page--prophets \.topic-page__hero[\s\S]{0,280}?margin:\s*0/,
);
assert.match(
  prophetsCss,
  /\.topic-page\.topic-page--prophets \.topic-page__hero[\s\S]{0,280}?border-radius:\s*0/,
);
assert.match(prophetsCss, /\.topic-page\.topic-page--prophets\s*\{[^}]*overflow:\s*visible/s);
assert.doesNotMatch(
  prophetsCss,
  /\.topic-page\.topic-page--prophets\s*\{[^}/]*overflow:\s*clip/s,
);
assert.match(prophetsPage, /layoutIntegrity="prophets-v1"/);
assert.match(prophetsCss, /\[data-layout-integrity="prophets-v1"\]/);

console.log("=== سيرة مختصرة لا تكرر السيرة الكاملة ===");
assert.match(prophetsPage, /prophets-seerah-brief/);
assert.match(prophetsPage, /اقرأ السيرة النبوية الكاملة/);
assert.doesNotMatch(prophetsPage, /بداية السيرة النبوية الشريفة/);

console.log("layout-integrity-guard.test.ts: ok");
