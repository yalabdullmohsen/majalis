#!/usr/bin/env node
/**
 * بوابات حصاد المصادر — تشغيل: node scripts/test-harvest-gates.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyType } from "./harvest/classify.mjs";
import { fingerprintSecondary, mergeOrAppend } from "./harvest/dedupe.mjs";
import { assertValidFeed, validateFeedDocument } from "./harvest/schema.mjs";
import { runHarvest } from "./harvest/run.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

console.log("=== dry-run fixture ===");
const dry = await runHarvest({ dryRun: true, fixture: true, verbose: false });
assert.equal(dry.stats.failed.length, 0);

console.log("=== classification ≥ 90% ===");
const samples = [
  ["درس فقه العبادات بعد المغرب", "درس"],
  ["شرح كتاب التوحيد في المسجد", "درس"],
  ["محاضرة عن السيرة النبوية", "درس"],
  ["مجلس علمي بعد العشاء", "درس"],
  ["حلقة تحفيظ للنساء", "حلقة"],
  ["حلقات تسميع جزء عم", "حلقة"],
  ["مقرأة قرآن يوم الثلاثاء", "حلقة"],
  ["دورة السيرة النبوية", "دورة"],
  ["برنامج أكاديمي في الفقه", "دورة"],
  ["دبلوم علوم شرعية", "دورة"],
  ["خطبة الجمعة في المسجد الكبير", "خطبة"],
  ["خطيب الجمعة الشيخ فلان", "خطبة"],
  ["التسجيل مفتوح عبر forms.gle", "تسجيل"],
  ["استمارة التسجيل متاحة الآن", "تسجيل"],
  ["إعلان عام عن نشاط الجمعية", "إعلان"],
  ["تذكير بموعد اللقاء", "إعلان"],
  ["لقاء علمي بعد المغرب", "درس"],
  ["مسار تعليمي في العقيدة", "دورة"],
  ["تحفيظ القرآن للنشء", "حلقة"],
  ["محاضرة شرعية مسائية", "درس"],
];
let ok = 0;
for (const [text, expected] of samples) {
  if (classifyType(text) === expected) ok++;
}
const ratio = ok / samples.length;
assert.ok(ratio >= 0.9, `classification ${(ratio * 100).toFixed(0)}% < 90%`);

console.log("=== dedupe ثلاثة مصادر → بطاقة واحدة ===");
const base = {
  id: fingerprintSecondary("درس مشترك", "2026-08-22", "السالمية"),
  type: "درس",
  title_ar: "درس مشترك",
  summary_ar: "ملخص",
  sheikh: null,
  place: "السالمية",
  audience: "عام",
  starts_at: null,
  time_text: null,
  register_url: null,
  sources: [{ id: "a", name_ar: "أ", url: "https://a", post_url: "https://a/1", platform: "telegram" }],
  image_url: null,
  published_at: "2026-08-22T10:00:00.000Z",
  confidence: 0.5,
};
const cards = [structuredClone(base)];
for (const sid of ["b", "c"]) {
  mergeOrAppend(cards, {
    ...structuredClone(base),
    sources: [{ id: sid, name_ar: sid, url: `https://${sid}`, post_url: `https://${sid}/1`, platform: "instagram" }],
  });
}
assert.equal(cards.length, 1);
assert.equal(cards[0].sources.length, 3);

console.log("=== schema feed.json ===");
const feedPath = resolve(root, "public/data/lessons/feed.json");
assert.ok(existsSync(feedPath), "feed.json مفقود");
const feed = JSON.parse(readFileSync(feedPath, "utf8"));
assertValidFeed(feed);
assert.ok(feed.items.length >= 20, `feed items ${feed.items.length} < 20`);

console.log("=== فشل محوّل لا يُسقط التشغيلة ===");
const broken = await runHarvest({
  dryRun: true,
  fixture: false,
  verbose: false,
});
assert.ok(Array.isArray(broken.stats.failed));

console.log("=== Instagram provider — غير مضبوط لا يفشل ===");
const prevMode = process.env.INSTAGRAM_INGEST_MODE;
const prevKey = process.env.INSTAGRAM_PROVIDER_KEY;
const prevEndpoint = process.env.INSTAGRAM_PROVIDER_ENDPOINT;
process.env.INSTAGRAM_INGEST_MODE = "provider";
delete process.env.INSTAGRAM_PROVIDER_KEY;
delete process.env.INSTAGRAM_PROVIDER_ENDPOINT;
const { getInstagramProviderStatus } = await import("./harvest/adapters/instagram-provider.mjs");
const igStatus = getInstagramProviderStatus();
assert.equal(igStatus.mode, "provider");
assert.equal(igStatus.configured, false);
assert.equal(igStatus.message, "Instagram provider is not configured.");
const noProvider = await runHarvest({ dryRun: true, fixture: false, verbose: false });
assert.equal(noProvider.stats.instagram?.message, "Instagram provider is not configured.");
if (prevMode !== undefined) process.env.INSTAGRAM_INGEST_MODE = prevMode;
else delete process.env.INSTAGRAM_INGEST_MODE;
if (prevKey !== undefined) process.env.INSTAGRAM_PROVIDER_KEY = prevKey;
if (prevEndpoint !== undefined) process.env.INSTAGRAM_PROVIDER_ENDPOINT = prevEndpoint;

console.log("=== Instagram provider mock ===");
process.env.INSTAGRAM_INGEST_MODE = "provider";
process.env.INSTAGRAM_PROVIDER_KEY = "test-key";
process.env.INSTAGRAM_PROVIDER_ENDPOINT = "https://provider.example";
process.env.INSTAGRAM_PROVIDER_MOCK = "1";
const { fetchViaProvider } = await import("./harvest/adapters/instagram-provider.mjs");
const mockItems = await fetchViaProvider(
  { id: "ig-test", platform: "instagram", handle: "test_handle", enabled: true },
  new Date(0),
);
assert.ok(mockItems.length >= 1);
assert.ok(mockItems[0].text.includes("درس"));
delete process.env.INSTAGRAM_PROVIDER_MOCK;
delete process.env.INSTAGRAM_PROVIDER_KEY;
delete process.env.INSTAGRAM_PROVIDER_ENDPOINT;
if (prevMode !== undefined) process.env.INSTAGRAM_INGEST_MODE = prevMode;
else delete process.env.INSTAGRAM_INGEST_MODE;

console.log("=== Telegram/Web adapters موجودان ===");
const { ADAPTERS } = await import("./harvest/adapters/index.mjs");
assert.ok(typeof ADAPTERS.telegram.fetch === "function");
assert.ok(typeof ADAPTERS.web.fetch === "function");
assert.ok(typeof ADAPTERS.instagram.fetch === "function");

console.log("=== accounts.json ===");
const accounts = JSON.parse(readFileSync(resolve(root, "public/data/sources/accounts.json"), "utf8"));
assert.ok(accounts.accounts.length >= 55, `accounts ${accounts.accounts.length}`);
const keys = new Set(accounts.accounts.map((a) => `${a.platform}:${a.handle}`));
assert.equal(keys.size, accounts.accounts.length);

console.log("=== UI hooks ===");
assert.match(read("src/pages/lessons/ui/LessonsView.tsx"), /HarvestFeedPanel/);
assert.match(read("src/components/lessons/SourceItemCard.tsx"), /المصدر/);
assert.match(read("src/App.tsx"), /SourcesDirectoryPage/);

console.log("test-harvest-gates.mjs: ok");
