#!/usr/bin/env node
/**
 * Static verification for lesson image import (no network / no Supabase).
 * Usage: node scripts/verify-lesson-image-import.mjs
 */
import { isVisionEnabled, buildMissingFields, emptyLessonPayload } from "../lib/cms/lesson-extractor.mjs";
import { validateImageUpload, MAX_IMAGE_BYTES, ALLOWED_IMAGE_MIMES } from "../lib/cms/image-storage.mjs";
import { hashImageBuffer, hashImageBase64 } from "../lib/cms/lesson-duplicate-detector.mjs";
import { matchSheikhByName } from "../lib/cms/sheikh-matcher.mjs";
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

// Image validation
const tinyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
assert("validate tiny jpeg buffer", validateImageUpload({ buffer: tinyJpeg, mimeType: "image/jpeg" }).ok);
assert("reject empty buffer", !validateImageUpload({ buffer: null, mimeType: "image/jpeg" }).ok);
assert("reject oversize", !validateImageUpload({ buffer: Buffer.alloc(MAX_IMAGE_BYTES + 1), mimeType: "image/jpeg" }).ok);
assert("reject bad mime", !validateImageUpload({ buffer: tinyJpeg, mimeType: "application/pdf" }).ok);
assert("allowed mimes include webp", ALLOWED_IMAGE_MIMES.has("image/webp"));

// Image hashing
const hash1 = hashImageBuffer(tinyJpeg);
const hash2 = hashImageBuffer(tinyJpeg);
assert("hash is deterministic", hash1 === hash2 && hash1.length === 32);
assert("hash from base64", hashImageBase64(Buffer.from(tinyJpeg).toString("base64")) === hash1);

// Vision fallback
assert("vision enabled is boolean", typeof isVisionEnabled() === "boolean");

const empty = emptyLessonPayload();
assert("empty payload has title field", "title" in empty);

const missing = buildMissingFields({});
assert("missing fields for empty payload exclude title", !missing.includes("title") && missing.includes("speaker_name"));

const autoTitle = validateLessonDraft({
  speaker_name: "محمد",
  day_of_week: "السبت",
  lesson_time: "8:00 م",
  source_url: "https://example.com/lesson",
});
assert("draft without title auto-generates and can publish", autoTitle.canPublish === true && autoTitle.normalized?.title?.includes("محمد"));

// Validation
const valid = validateLessonDraft({
  title: "درس في التفسير",
  speaker_name: "محمد",
  day_of_week: "السبت",
  lesson_time: "8:00 م",
  mosque: "مسجد",
  city: "العاصمة",
  category: "تفسير",
});
assert("valid draft passes validation", valid.canPublish === true);

// Sheikh match without DB returns no match gracefully
const match = await matchSheikhByName("اسم غير موجود تمامًا xyz123");
assert("sheikh match returns structure", match != null && ("matched" in match));

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll lesson image import checks passed.");
console.log(`Vision AI: ${isVisionEnabled() ? "enabled (ANTHROPIC_API_KEY set)" : "fallback manual mode"}`);
