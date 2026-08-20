/**
 * بوابة: setLocation مباشر ممنوع لحالة UI — استخدم navigation-intent.
 * تشغيل: node --import tsx src/lib/__tests__/navigation-intent-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = join(root, "src");

/** ملفات مسموح فيها setLocation (تنقّل شاشة أو ربط wouter) */
const ALLOW_SET_LOCATION = new Set([
  "components/NavigationBinder.tsx",
  "components/sections/SectionCard.tsx",
  "components/sections/FeaturedSectionCard.tsx",
  "components/sections/SectionRow.tsx",
  "pages/lessons/ui/LessonDetailView.tsx",
]);

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(p, acc);
    } else if (/\.tsx$/.test(name)) acc.push(p);
  }
  return acc;
}

const violations: string[] = [];
for (const file of walk(src)) {
  const rel = relative(src, file).replace(/\\/g, "/");
  const code = readFileSync(file, "utf8");
  if (!code.includes("setLocation")) continue;
  if (ALLOW_SET_LOCATION.has(rel)) continue;
  if (/setLocation\s*\(/.test(code)) {
    violations.push(rel);
  }
}

assert.deepEqual(
  violations,
  [],
  `setLocation مباشر خارج القائمة البيضاء:\n${violations.map((v) => `  - ${v}`).join("\n")}`,
);

const topicPage = readFileSync(join(src, "components/topic/TopicPage.tsx"), "utf8");
assert.match(topicPage, /navigateTo\([^)]+mode:\s*"state"/);
assert.doesNotMatch(topicPage, /setLocation/);

const navIntent = readFileSync(join(src, "lib/navigation-intent.ts"), "utf8");
assert.match(navIntent, /mode === "state"/);
assert.match(navIntent, /isSameHref/);

const app = readFileSync(join(src, "App.tsx"), "utf8");
assert.match(app, /NavigationBinder/);
assert.match(app, /NativeBackButtonListener/);

const main = readFileSync(join(root, "src/main.tsx"), "utf8");
assert.doesNotMatch(main, /backButton/);

console.log("navigation-intent-gate.test.ts: ok");
