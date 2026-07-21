#!/usr/bin/env node
/**
 * Network smoke test for lesson URL import (og:tags fetch).
 * Usage: node scripts/test-lesson-url-import.mjs
 */
import { importLessonFromUrl, normalizeImportUrl } from "../lib/cms/url-import-service.mjs";
import { detectPlatform, isSupportedImportPlatform } from "../lib/cms/url-importer.mjs";

const SCENARIOS = [
  {
    name: "رابط صحيح (صفحة ويب)",
    url: "https://www.majlisilm.com/lessons",
    expectOk: true,
  },
  {
    name: "Instagram (استخراج محدود)",
    url: "https://www.instagram.com/p/example/",
    expectOk: true,
    expectPartial: true,
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    expectOk: true,
  },
  {
    name: "X / Twitter",
    url: "https://x.com/example/status/1",
    expectOk: true,
  },
  {
    name: "Telegram",
    url: "https://t.me/example/123",
    expectOk: true,
  },
  {
    name: "منصة غير مدعومة (Facebook)",
    url: "https://www.facebook.com/example/posts/1",
    expectOk: true,
    expectUnsupported: true,
  },
];

console.log("Lesson URL Import — Network Smoke Test\n");

let failed = 0;

// Invalid URL (spaces fail URL parser)
const bad = normalizeImportUrl("not a url");
if (bad !== null) {
  console.error("✗ invalid URL should return null");
  failed += 1;
} else {
  console.log("✓ invalid URL rejected");
}

for (const scenario of SCENARIOS) {
  process.stdout.write(`→ ${scenario.name} ... `);
  try {
    const result = await importLessonFromUrl(scenario.url);
    const platform = detectPlatform(scenario.url);
    const supported = isSupportedImportPlatform(platform);

    if (!result.ok && scenario.expectOk) {
      console.log("FAIL (not ok)", result.error || result.message);
      failed += 1;
      continue;
    }

    const hasFields = Boolean(result.parsed_fields);
    const hasSource = result.parsed_fields?.registration_url || result.parsed_fields?.links?.length;
    const noImage = !result.imageUrl;
    const partial = result.partial;

    console.log(
      result.ok ? "OK" : "partial",
      `| platform: ${platform}`,
      supported ? "" : "| unsupported",
      hasFields ? "| fields" : "",
      hasSource ? "| source kept" : "",
      noImage ? "| no image" : "| image",
      partial ? "| manual fallback" : "",
    );

    if (scenario.expectPartial && !partial && !result.parsed_fields?.title) {
      console.log("  note: Instagram may return limited og:tags only");
    }
    if (scenario.expectUnsupported && supported) {
      console.log("  warn: expected unsupported platform");
    }
  } catch (err) {
    console.log("ERROR", String(err.message || err).slice(0, 80));
    failed += 1;
  }
}

console.log("\nNote: duplicate URL detection requires Supabase — test manually in admin.");
console.log("Approve + site visibility requires admin session + Supabase.");

if (failed > 0) {
  console.error(`\n${failed} scenario(s) failed.`);
  process.exit(1);
}

console.log("\nAll URL import smoke scenarios passed.");
