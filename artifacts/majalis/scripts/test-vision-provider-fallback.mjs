#!/usr/bin/env node
/**
 * Vision provider fallback tests (no live API calls).
 */
import {
  classifyVisionError,
  analyzeLessonImageWithFallback,
  getVisionAiStatus,
  BILLING_USER_MESSAGE,
} from "../lib/ai/vision-provider-fallback.mjs";
import { extractEntitiesFromArabicText } from "../lib/ai/local-ocr.mjs";

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

assert("classify credit balance low", classifyVisionError(new Error("Your credit balance is too low to access the Anthropic API")).code === "insufficient_credit");
assert("classify billing", classifyVisionError(new Error("billing issue")).billing === true);
assert("classify rate limit", classifyVisionError(new Error("rate_limit exceeded")).code === "rate_limited");
assert("classify auth", classifyVisionError(new Error("authentication failed")).code === "auth_failed");

const tinyB64 = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64");

const noKeys = await analyzeLessonImageWithFallback({
  imageBase64: tinyB64,
  mimeType: "image/jpeg",
});
assert("no keys no notes → ok", noKeys.ok === true);
assert("no keys no notes → manual_review", noKeys.providerUsed === "manual_review");
assert("no keys no notes → userMessage present", Boolean(noKeys.userMessage));

const withNotes = await analyzeLessonImageWithFallback({
  imageBase64: tinyB64,
  mimeType: "image/jpeg",
  notes: "درس في التفسير — الشيخ محمد — مسجد الصباح — بعد المغرب — 2026-06-26",
});
assert("notes → ocr or manual ok", withNotes.ok === true);
assert("notes → extracts mosque", Boolean(withNotes.fields?.mosque || withNotes.parsed?.mosque));
assert("no raw anthropic in message", !String(noKeys.userMessage).includes("Anthropic API"));
assert("fields object", typeof noKeys.fields === "object");

const entities = extractEntitiesFromArabicText("الشيخ خالد — مسجد الإمام — 8:00 م — 2026-07-01");
assert("local OCR entities mosque", entities.mosque.includes("مسجد"));

const billingMsg = BILLING_USER_MESSAGE;
assert("billing message arabic", billingMsg.includes("تعذر التحليل") && billingMsg.includes("يدوياً"));

const status = getVisionAiStatus();
assert("ai status shape", status.ok === true && status.systemStatus);
assert("ai status not critical", status.systemStatus !== "critical");

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}

console.log("\nAll vision fallback tests passed.");
