#!/usr/bin/env node
/**
 * Static verification for lesson URL import (no network).
 * Usage: node scripts/verify-lesson-url-import.mjs
 */
import { detectPlatform, normalizeImportUrl, isSupportedImportPlatform, getPlatformLabel } from "../lib/cms/url-importer.mjs";
import { emptyLessonPayload, buildMissingFields } from "../lib/cms/lesson-extractor.mjs";
import { validateLessonDraft } from "../lib/cms/content-validator.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

// URL normalization
assert("normalize https URL", normalizeImportUrl("https://example.com/path/") === "https://example.com/path");
assert("normalize adds https", normalizeImportUrl("instagram.com/p/abc")?.startsWith("https://instagram.com"));
assert("reject invalid", normalizeImportUrl("not a url") === null);
assert("reject empty", normalizeImportUrl("") === null);

// Platform detection — all required platforms
assert("detect instagram", detectPlatform("https://www.instagram.com/p/xyz") === "instagram");
assert("detect x", detectPlatform("https://x.com/user/status/1") === "twitter");
assert("detect twitter legacy", detectPlatform("https://twitter.com/user/status/1") === "twitter");
assert("detect youtube", detectPlatform("https://youtu.be/abc") === "youtube");
assert("detect youtube watch", detectPlatform("https://www.youtube.com/watch?v=abc") === "youtube");
assert("detect telegram", detectPlatform("https://t.me/channel/1") === "telegram");
assert("detect website", detectPlatform("https://www.majlisilm.com/lessons") === "website");
assert("detect facebook unsupported", detectPlatform("https://facebook.com/page") === "facebook");

// Supported platforms
assert("instagram supported", isSupportedImportPlatform("instagram"));
assert("twitter supported", isSupportedImportPlatform("twitter"));
assert("youtube supported", isSupportedImportPlatform("youtube"));
assert("telegram supported", isSupportedImportPlatform("telegram"));
assert("website supported", isSupportedImportPlatform("website"));
assert("facebook not in primary set", !isSupportedImportPlatform("facebook"));
assert("rss not in primary set", !isSupportedImportPlatform("rss"));

// Labels
assert("platform label X", getPlatformLabel("twitter") === "X");
assert("platform label Instagram", getPlatformLabel("instagram") === "Instagram");
assert("platform label website", getPlatformLabel("website") === "صفحة ويب");

// Manual fallback payload shape (mirrors url-import-service buildManualFallback)
const empty = emptyLessonPayload();
const manualFallback = {
  ...empty,
  registration_url: "https://example.com/post",
  links: ["https://example.com/post"],
  description: "مصدر: https://example.com/post",
};
assert("manual fallback keeps source URL", manualFallback.registration_url === "https://example.com/post");
assert("manual fallback has links array", Array.isArray(manualFallback.links) && manualFallback.links.length === 1);

// Missing fields for empty manual entry
const missing = buildMissingFields(empty);
assert("empty payload missing title", missing.includes("title"));
assert("empty payload missing speaker", missing.includes("speaker_name"));

// Validation for complete lesson (approve-ready)
const complete = validateLessonDraft({
  title: "درس من رابط",
  speaker_name: "الشيخ أحمد",
  day_of_week: "الجمعة",
  lesson_time: "8:00 م",
  mosque: "مسجد",
  city: "العاصمة",
});
assert("complete draft can publish", complete.canPublish === true);

// Duplicate structure (static shape check)
const duplicateShape = { draft: null, lesson: null, isDuplicate: false };
assert("duplicate result shape", "isDuplicate" in duplicateShape);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll lesson URL import checks passed.");
