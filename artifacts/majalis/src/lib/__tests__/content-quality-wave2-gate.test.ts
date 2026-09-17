/**
 * Content quality Wave 2 — lessons / scholars / search / quran metadata.
 * Run: node --import tsx src/lib/__tests__/content-quality-wave2-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanHarvestDisplayText, isPresentableDisplayText } from "../harvest-display-text";
import { sanitizeHarvestCard, type HarvestFeedCard } from "../harvest-feed";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repo = resolve(root, "../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== harvest OCR / handles stripped ===");
{
  const dirty =
    "يسرنا دعوتكم Photo by ارث on August 31, 2026. May be an image of text @rashedsfh https://maps.google.com &nbsp; بطاقة تعريف من بيانات الحلقة في المنصة.";
  const cleaned = cleanHarvestDisplayText(dirty);
  assert.doesNotMatch(cleaned, /Photo by/i);
  assert.doesNotMatch(cleaned, /May be/i);
  assert.doesNotMatch(cleaned, /@rashedsfh/);
  assert.doesNotMatch(cleaned, /https?:\/\//);
  assert.doesNotMatch(cleaned, /&nbsp;/);
  assert.doesNotMatch(cleaned, /بطاقة تعريف/);
  assert.equal(isPresentableDisplayText("الله"), false);
  assert.equal(isPresentableDisplayText("Erth"), false);
}

console.log("=== sanitizeHarvestCard drops garbage ===");
{
  const bad: HarvestFeedCard = {
    id: "x",
    type: "درس",
    title_ar: "ok",
    summary_ar: "Photo by x on August 1, 2026. May be an image of text",
    sheikh: "ة مريم",
    place: "الله",
    audience: "عام",
    starts_at: null,
    time_text: null,
    register_url: null,
    sources: [],
    image_url: null,
    published_at: "2026-01-01T00:00:00.000Z",
    confidence: 0.5,
  };
  assert.equal(sanitizeHarvestCard(bad), null);
  const good = sanitizeHarvestCard({
    ...bad,
    title_ar: "لقاء بعنوان بناء شخصية الطفل مع أ. هدى السباعي",
    summary_ar: "دعوة لحضور لقاء تربوي في بناء شخصية الطفل.",
    sheikh: "هدى السباعي",
    place: "مسجد الياقوت",
  });
  assert.ok(good);
  assert.equal(good!.sheikh, "هدى السباعي");
}

console.log("=== RelatedRail scholars not tarikh ===");
{
  const rail = read("src/widgets/RelatedRail.tsx");
  assert.match(rail, /return `\/scholars\/\$\{slug\}`/);
  assert.doesNotMatch(rail, /return `\/tarikh-islami\/\$\{slug\}`/);
}

console.log("=== SearchView hides blocked fully ===");
{
  const view = read("src/pages/account/ui/SearchView.tsx");
  assert.match(view, /isBlockedSearchHref\(href\)[\s\S]{0,120}?return null/);
  assert.doesNotMatch(view, /srch-result-card--blocked/);
  assert.doesNotMatch(view, /المحتوى غير متاح حاليًا/);
}

console.log("=== Surah list helper remains available ===");
{
  assert.ok(existsSync(resolve(root, "src/lib/quran-surah-list.ts")));
  assert.match(read("src/pages/quran/ui/QuranPersonDetailView.tsx"), /getSurahMeta\(o\.surah\)\.name/);
}

console.log("=== search index generator includes scholars ===");
{
  const gen = read("scripts/generate-unified-search-index.mjs");
  assert.match(gen, /SCHOLAR_PROFILES/);
  assert.match(gen, /scholar:\$\{p\.slug\}/);
}

console.log("=== SourceItemCard cleans display ===");
{
  assert.match(read("src/components/lessons/SourceItemCard.tsx"), /cleanHarvestDisplayText/);
  assert.match(read("src/lib/harvest-feed.ts"), /sanitizeHarvestCard/);
  assert.match(read("src/lib/harvest-display-text.ts"), /cleanHarvestDisplayText/);
}

console.log("=== wave1 master still present ===");
{
  assert.ok(existsSync(resolve(repo, "reports/content-completeness-master.json")));
}

console.log("content-quality-wave2-gate: ok");
