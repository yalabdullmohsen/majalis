/**
 * بوابة: لا واجهة عامة بصيغة «باب علمي / أبواب العلم / مسار علمي» في /learn.
 * تشغيل: node --import tsx src/lib/__tests__/learn-lessons-not-paths.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const LEARN_PAGES = [
  "src/views/learn/LearnHubPage.tsx",
  "src/views/learn/LearnCategoryPage.tsx",
  "src/views/learn/LearnSeriesPage.tsx",
  "src/views/learn/LearnLessonPage.tsx",
];

const FORBIDDEN = [
  /باب علمي/,
  /أبواب العلم/,
  /المسار العلمي/,
  /مسارات وأبواب/,
  /ابدأ من هنا/,
];

for (const rel of LEARN_PAGES) {
  const src = read(rel);
  for (const re of FORBIDDEN) {
    assert.equal(re.test(src), false, `${rel} بلا «${re.source}»`);
  }
}

const hub = read("src/views/learn/LearnHubPage.tsx");
assert.match(hub, /دروس عادية مفصّلة|مكتبة الدروس/);
assert.match(hub, /الدروس المنشورة/);

const cat = read("src/views/learn/LearnCategoryPage.tsx");
assert.match(cat, /eyebrow="دروس"/);
assert.equal(cat.includes("التصنيفات الفرعية"), false);
assert.match(cat, /العودة للدروس/);

const lesson = read("src/views/learn/LearnLessonPage.tsx");
assert.match(lesson, /العودة للدروس|>الدروس</);

const series = read("src/views/learn/LearnSeriesPage.tsx");
assert.match(series, /العودة للدروس|سلسلة دروس/);

const service = read("src/lib/learn-library-service.ts");
assert.match(service, /\.in\("category_id", childIds\)/, "دروس الفروع تُعرض مسطّحة في التصنيف الأب");

const seed = read("src/lib/learn-library-aqeedah-batch1-seed.ts");
assert.match(seed, /أصول العقيدة الإسلامية/);
assert.equal(seed.includes("مدخل إلى العقيدة"), false);
assert.equal(seed.includes("مسار العقيدة"), false);
assert.match(seed, /s-intro-4/);
assert.match(seed, /s-intro-6/);

const registry = read("src/config/sections.registry.ts");
assert.match(registry, /label:\s*"دروس التعلّم"/);
assert.equal(/subtitle:\s*"فهرس مسارات وأبواب التعلّم"/.test(registry), false);

console.log("learn-lessons-not-paths.test.ts: ok");
