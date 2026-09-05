/**
 * بوابة: أزرار المشاركة مرة واحدة في نهاية القسم — لا تكرار داخل البطاقات.
 * node --import tsx src/lib/__tests__/section-share-actions-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const section = read("src/components/common/SectionShareActions.tsx");
const css = read("src/styles/components/section-share-actions.css");

assert.match(section, /data-section-share-actions/);
assert.match(section, /ssunnah:section-share-sync/);
assert.match(css, /\.section-share-actions--dup/);

const offenders = [
  "src/views/MiraclesPage.tsx",
  "src/views/SeerahPage.tsx",
  "src/components/lessons/UnifiedLessonCard.tsx",
  "src/components/hadith/HadithCard.tsx",
  "src/pages/worship/ui/AdhkarDhikrSheet.tsx",
  "src/pages/worship/ui/DuasView.tsx",
];

for (const rel of offenders) {
  const src = read(rel);
  assert.doesNotMatch(src, /<ShareFaida[\s\S]*variant="icons"/, `${rel}: لا مشاركة أيقونات داخل البطاقة`);
  assert.doesNotMatch(src, /from ["']@\/components\/ShareButton["']/, `${rel}: لا استيراد ShareButton`);
}

const duas = read("src/pages/worship/ui/DuasView.tsx");
assert.doesNotMatch(duas, /dua-card__copy/);
assert.match(duas, /ShareButtons/);

const miracles = read("src/views/MiraclesPage.tsx");
assert.match(miracles, /ShareButtons/);
assert.ok(
  miracles.indexOf("ShareButtons") < miracles.indexOf("ExploreAlsoNav"),
  "الإعجاز: المشاركة قبل مواضيع ذات صلة",
);

console.log("section-share-actions-gate: ok");
