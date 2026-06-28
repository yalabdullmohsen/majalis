#!/usr/bin/env node
/**
 * Verify production pipeline: confidence engine, source fusion, content sanitizer, Instagram/Telegram engines.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeConfidenceScore, THRESHOLDS } from "../lib/production/confidence-engine.mjs";
import { buildFusionKey, fuseLessonCandidates } from "../lib/production/source-fusion.mjs";
import { containsBlockedContentMarker, assertPublishable } from "../lib/production/content-sanitizer.mjs";
import { normalizeInstagramPost, extractCourseAdMetadata, mergeByConfidence } from "../lib/production/instagram-engine.mjs";
import { parseCourseAdFields, extractHashtags } from "../lib/production/instagram-parser.mjs";
import { parseTelegramPreviewHtml } from "../lib/cms/telegram-channel-fetch.mjs";
import { runContentPipeline } from "../lib/content-pipeline/runner.mjs";
import { DEFAULT_LESSON_STAGES } from "../lib/content-pipeline/stages.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) { passed++; console.log(`✓ ${msg}`); }
  else { failed++; console.error(`✗ ${msg}`); }
}

// ── Module existence ──
const modules = [
  "lib/production/confidence-engine.mjs",
  "lib/production/source-fusion.mjs",
  "lib/production/content-sanitizer.mjs",
  "lib/production/instagram-engine.mjs",
  "lib/production/instagram-parser.mjs",
  "lib/content-pipeline/runner.mjs",
  "lib/content-pipeline/stages.mjs",
  "lib/cms/telegram-channel-fetch.mjs",
  "lib/api-handlers/admin/ake-monitoring.js",
  "src/views/admin/PlatformMonitoringPage.tsx",
];
for (const m of modules) ok(existsSync(join(ROOT, m)), `Module exists: ${m}`);

// ── Confidence engine ──
const highConf = computeConfidenceScore({
  baseScore: 80,
  sourceType: "instagram_graph",
  sheikhMatch: true,
  mosqueMatch: true,
  cityMatch: true,
  dateMatch: true,
  metadataComplete: true,
});
ok(highConf.score >= THRESHOLDS.publish, `High confidence → publish (${highConf.score}, action=${highConf.action})`);

const lowConf = computeConfidenceScore({ baseScore: 30, quizLike: true });
ok(lowConf.action === "reject", "Quiz-like content rejected");

// ── Source fusion ──
const key1 = buildFusionKey({ speaker_name: "الشيخ محمد", title: "شرح التوحيد", mosque: "مسجد السلام", start_date: "2026-06-01", city: "الجهراء" });
const key2 = buildFusionKey({ speaker_name: "الشيخ محمد", title: "شرح التوحيد", mosque: "مسجد السلام", start_date: "2026-06-01", city: "الجهراء" });
ok(key1 === key2, "Same lesson → same fusion key");

const fused = fuseLessonCandidates([
  { speaker_name: "الشيخ محمد", title: "درس", mosque: "مسجد A", source_type: "instagram_graph" },
  { speaker_name: "الشيخ محمد", title: "درس", mosque: "مسجد A", source_type: "telegram_bot" },
]);
ok(fused.length === 1 && fused[0].fusion_count === 2, "Cross-source fusion merges duplicates");

// ── Content sanitizer ──
ok(containsBlockedContentMarker("test lesson data"), "Blocks test marker");
ok(containsBlockedContentMarker("e2e verification run"), "Blocks e2e marker");
ok(!containsBlockedContentMarker("درس في التوحيد"), "Allows real Arabic content");

try {
  assertPublishable({ title: "mock content placeholder" });
  ok(false, "Should block mock content");
} catch (err) {
  ok(err.code === "CONTENT_BLOCKED", "assertPublishable throws CONTENT_BLOCKED");
}

// ── Instagram engine ──
const caption = "درس شرح كتاب التوحيد — الشيخ محمد العجمي — مسجد السلام — الجهراء — الجمعة بعد العشاء — https://t.me/register";
const fields = parseCourseAdFields(caption);
ok(fields.speaker_name?.includes("محمد"), "Caption parser extracts sheikh");
ok(fields.mosque?.includes("السلام"), "Caption parser extracts mosque");
ok(extractHashtags("#درس #فقه").length === 2, "Hashtag extraction");

const normalized = normalizeInstagramPost({
  id: "123",
  caption,
  media_type: "IMAGE",
  media_url: "https://example.com/img.jpg",
  permalink: "https://instagram.com/p/abc",
  timestamp: "2026-06-01T10:00:00Z",
  fromGraphApi: true,
}, { handle: "test" });
ok(normalized.is_lesson_ad, "Detects lesson ad");
ok(normalized.media_type === "IMAGE", "Normalizes media type");

const merged = mergeByConfidence([
  { source: "caption", fields: { speaker_name: "A" }, confidence: 0.5 },
  { source: "vision", fields: { speaker_name: "B", mosque: "M" }, confidence: 0.8 },
]);
ok(merged.speaker_name === "B" && merged.mosque === "M", "Confidence merge prefers higher source");

// ── Telegram preview parser ──
const sampleHtml = `<div class="tgme_widget_message" data-post="channel/42"><div class="tgme_widget_message_text">درس يوم الجمعة</div></div>`;
const tgPosts = parseTelegramPreviewHtml(sampleHtml, "channel");
ok(tgPosts.length === 1 && tgPosts[0].message_id === 42, "Telegram preview parser");

// ── Content pipeline ──
const pipeResult = await runContentPipeline({
  raw_title: "درس في الفقه",
  raw_body: "محاضرة للشيخ أحمد في مسجد الكبير بالكويت يوم الجمعة",
  external_id: "test:1",
  content_kind: "lesson",
}, DEFAULT_LESSON_STAGES, { runId: "verify" });
ok(pipeResult.ok, "Content pipeline runs all stages");
ok(pipeResult.item?.fusion_key, "Pipeline produces fusion key");
ok(pipeResult.item?.confidence?.score > 0, "Pipeline computes confidence");

// ── Orchestrator integration ──
const orch = readFileSync(join(ROOT, "lib/auto-knowledge-engine/orchestrator.mjs"), "utf8");
ok(orch.includes("runContentPipeline"), "Orchestrator wired to content pipeline");
ok(orch.includes("logAkeRejection"), "Orchestrator wired to rejection log");

const qg = readFileSync(join(ROOT, "lib/auto-knowledge-engine/quality-gate.mjs"), "utf8");
ok(qg.includes("computeConfidenceScore"), "Quality gate uses confidence engine");

const pub = readFileSync(join(ROOT, "lib/knowledge-engine/publisher.mjs"), "utf8");
ok(pub.includes("assertPublishable"), "Publisher uses content sanitizer");

console.log(`\nProduction Pipeline: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
