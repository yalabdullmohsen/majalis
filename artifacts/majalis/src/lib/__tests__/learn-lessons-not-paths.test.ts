/**
 * بوابة: دروس التعلّم (/learn) ملغاة — تحويل إلى /lessons، بلا قسم في السجل.
 * تشغيل: node --import tsx src/lib/__tests__/learn-lessons-not-paths.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

for (const rel of [
  "src/views/learn/LearnHubPage.tsx",
  "src/views/learn/LearnCategoryPage.tsx",
  "src/views/learn/LearnSeriesPage.tsx",
  "src/views/learn/LearnLessonPage.tsx",
]) {
  assert.equal(existsSync(resolve(root, rel)), false, `${rel} محذوف`);
}

const registry = read("src/config/sections.registry.ts");
assert.equal(/id:\s*"knowledge-doors"/.test(registry), false, "بلا قسم knowledge-doors");
assert.equal(/label:\s*"دروس التعلّم"/.test(registry), false, "بلا تسمية دروس التعلّم");
assert.match(registry, /from:\s*"\/learn"/, "دمج /learn في SECTION_MERGE_REDIRECTS");

const app = read("src/AppRoutes.tsx");
assert.match(
  app,
  /path="\/learn"[^>]*>\s*<Redirect\s+to="\/lessons"/,
  "/learn → /lessons",
);
assert.match(
  app,
  /path="\/learn\/:slug"[^>]*>\s*<Redirect\s+to="\/lessons"/,
  "/learn/:slug → /lessons",
);
assert.equal(app.includes("LearnHubPage"), false, "بلا تحميل LearnHubPage");

const vercel = read("vercel.json");
assert.match(vercel, /"source":\s*"\/learn"/, "vercel يحوي تحويل /learn");
assert.match(vercel, /"destination":\s*"\/lessons"/, "وجهة التحويل /lessons");
assert.equal(
  /"source":\s*"\/learn\/:path*"[\s\S]*?"destination":\s*"\/index\.html"/.test(vercel),
  false,
  "بلا SPA rewrite لـ /learn",
);

const seo = read("src/lib/seo-routes.json");
assert.equal(seo.includes('"/learn/'), false, "seo-routes بلا مسارات /learn/");
assert.equal(seo.includes('"/learn"'), false, "seo-routes بلا /learn");

console.log("learn-lessons-not-paths.test.ts: ok");
