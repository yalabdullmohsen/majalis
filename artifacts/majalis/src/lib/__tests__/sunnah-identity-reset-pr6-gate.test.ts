/**
 * SUNNAH VISUAL IDENTITY RESET — PR-6 gate
 * Detail + reading pages densify
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr6-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== TopicPage wiring ===");
{
  const topic = read("src/components/topic/TopicPage.tsx");
  assert.match(topic, /topic-page/);
  assert.match(topic, /sunnah-identity-detail-reading\.css/);
  assert.doesNotMatch(topic, /MushafReader|VerifiedMushaf|qpc-v2|AdminV3/);
}

console.log("=== detail surfaces wiring ===");
{
  const lesson = read("src/pages/lessons/ui/LessonDetailView.tsx");
  assert.match(lesson, /sunnah-identity-detail-reading\.css/);
  const hadith = read("src/pages/hadith/ui/HadithByIdView.tsx");
  assert.match(hadith, /sunnah-identity-detail-reading\.css/);
  const article = read("src/views/DiscoverIslamArticleDetailPage.tsx");
  assert.match(article, /sunnah-identity-detail-reading\.css/);
}

console.log("=== CSS densify ===");
{
  assert.ok(existsSync(resolve(majalisRoot, "src/styles/sunnah-identity-detail-reading.css")));
  const css = read("src/styles/sunnah-identity-detail-reading.css");
  assert.match(css, /data-v2-app/);
  assert.match(css, /topic-page__hero/);
  assert.match(css, /--lh-reading:\s*1\.75/);
  assert.match(css, /--read-para-gap/);
  assert.match(css, /lesson-detail|hadith-detail/);
  assert.match(css, /reading-prose-system|topic-page__body/);
  assert.match(css, /html\.dark\[data-v2-app="1"\] \.topic-page__eyebrow/);
  assert.match(css, /#eef7f2/);
  /* !important مسموح فقط لتجاوز soft-hero الليلي على eyebrow */
  const importantCount = (css.match(/!important/g) || []).length;
  assert.ok(importantCount <= 2, `unexpected !important count=${importantCount}`);
  assert.doesNotMatch(css, /mushaf-reader|qpc-v2|AdminV3|letter-spacing:\s*[^0]/);
}

console.log("=== route wiring (not critical main) ===");
{
  const main = read("src/main.tsx");
  assert.doesNotMatch(main, /sunnah-identity-detail-reading\.css/);
  const reset = read("src/styles/sunnah-identity-reset.css");
  assert.match(reset, /PR-6|detail-reading/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-6/);
  assert.match(doc, /Detail|reading|تفاصيل|قراءة/i);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr6/);
}

console.log("sunnah-identity-reset-pr6-gate.test.ts: ok");
