#!/usr/bin/env node
/**
 * Static verification for lesson URL import (no network).
 * Usage: node scripts/verify-lesson-url-import.mjs
 */
import { detectPlatform, normalizeImportUrl, isSupportedImportPlatform, getPlatformLabel } from "../lib/cms/url-importer.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

assert("normalize https URL", normalizeImportUrl("https://example.com/path/") === "https://example.com/path");
assert("normalize adds https", normalizeImportUrl("instagram.com/p/abc")?.startsWith("https://instagram.com"));
assert("reject invalid", normalizeImportUrl("not a url") === null);

assert("detect instagram", detectPlatform("https://www.instagram.com/p/xyz") === "instagram");
assert("detect x", detectPlatform("https://x.com/user/status/1") === "twitter");
assert("detect youtube", detectPlatform("https://youtu.be/abc") === "youtube");
assert("detect telegram", detectPlatform("https://t.me/channel/1") === "telegram");
assert("detect website", detectPlatform("https://majlisilm.com/lessons") === "website");

assert("instagram supported", isSupportedImportPlatform("instagram"));
assert("website supported", isSupportedImportPlatform("website"));
assert("rss not in primary set", !isSupportedImportPlatform("rss"));

assert("platform label X", getPlatformLabel("twitter") === "X");
assert("platform label website", getPlatformLabel("website") === "صفحة ويب");

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll lesson URL import checks passed.");
