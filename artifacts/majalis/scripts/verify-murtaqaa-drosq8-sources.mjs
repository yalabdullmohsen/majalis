#!/usr/bin/env node
/**
 * Verify Murtaqaa Instagram + DrosQ8 Telegram source integration.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MURTaqaa_DROSQ8_SOURCES, MURTaqaa_DROSQ8_SLUGS } from "../lib/cms/murtaqaa-drosq8-sources.mjs";
import { parseTelegramChannelHtml } from "../lib/cms/telegram-channel-fetch.mjs";
import { resolvePollIntervalMinutes } from "../lib/auto-knowledge-engine/connector-scheduler.mjs";
import { resolveConfidencePublish, normalizeConfidence } from "../lib/auto-knowledge-engine/confidence-publish.mjs";
import { mapGraphMediaNode } from "../lib/cms/instagram-graph-api.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function ok(name, detail = "") {
  passed++;
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function bad(name, detail = "") {
  failed++;
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("\n=== Murtaqaa + DrosQ8 Source Verification ===\n");

const sql = readFileSync(resolve(ROOT, "supabase/murtaqaa_drosq8_sources_v1.sql"), "utf8");
const igConn = readFileSync(resolve(ROOT, "lib/auto-knowledge-engine/connectors/instagram-connector.mjs"), "utf8");
const tgConn = readFileSync(resolve(ROOT, "lib/auto-knowledge-engine/connectors/telegram-connector.mjs"), "utf8");
const sched = readFileSync(resolve(ROOT, "lib/auto-knowledge-engine/connector-scheduler.mjs"), "utf8");

for (const slug of MURTaqaa_DROSQ8_SLUGS) {
  if (sql.includes(`'${slug}'`)) ok(`SQL registers ${slug}`);
  else bad(`SQL missing ${slug}`);
}

if (resolvePollIntervalMinutes({ slug: "instagram-murtaqaa", connector_type: "instagram" }) === 10) {
  ok("Instagram poll interval", "10 min");
} else {
  bad("Instagram poll interval", "expected 10");
}

if (resolvePollIntervalMinutes({ slug: "telegram-drosq8", connector_type: "telegram" }) === 5) {
  ok("Telegram poll interval", "5 min");
} else {
  bad("Telegram poll interval", "expected 5");
}

const conf90 = resolveConfidencePublish(92, { api_config: { confidence_tiers: { auto_publish: 90, review: 70 } } });
if (conf90.action === "auto_publish") ok("Confidence >= 90 → auto_publish");
else bad("Confidence auto publish");

const conf75 = resolveConfidencePublish(75, { api_config: { confidence_tiers: { auto_publish: 90, review: 70 } } });
if (conf75.action === "review") ok("Confidence 70-89 → review");
else bad("Confidence review band");

const conf50 = resolveConfidencePublish(50, { api_config: { confidence_tiers: { auto_publish: 90, review: 70 } } });
if (conf50.action === "reject") ok("Confidence < 70 → reject");
else bad("Confidence reject");

if (normalizeConfidence(0.95) === 95) ok("normalizeConfidence decimal");
else bad("normalizeConfidence");

const sampleHtml = `
<div class="tgme_widget_message_wrap" data-post="DrosQ8/42">
  <div class="tgme_widget_message_text">درس فقه — الشيخ محمد — مسجد السلام</div>
  <time datetime="2026-06-28T10:00:00+00:00"></time>
  <div class="tgme_widget_message_photo" style="background-image:url('https://cdn.example/poster.jpg')"></div>
</div>`;
const parsed = parseTelegramChannelHtml(sampleHtml, "DrosQ8");
if (parsed.length === 1 && String(parsed[0].message_id) === "42") ok("Telegram HTML parser");
else bad("Telegram HTML parser");

const mapped = mapGraphMediaNode({
  id: "123",
  caption: "درس #الكويت #فقه",
  media_type: "CAROUSEL_ALBUM",
  media_url: "https://cdn.example/1.jpg",
  permalink: "https://instagram.com/p/abc",
  timestamp: "2026-06-28T10:00:00+0000",
  children: { data: [{ media_url: "https://cdn.example/2.jpg" }] },
});
if (mapped.hashtags?.includes("#الكويت") && mapped.mediaUrls.length >= 2) ok("Instagram mapGraphMediaNode hashtags+carousel");
else bad("Instagram mapGraphMediaNode");

if (igConn.includes("skip_month_filter") && igConn.includes("vision_on_image")) ok("Instagram connector enhanced");
else bad("Instagram connector enhancements");

if (tgConn.includes("fetchTelegramChannelMessages") && tgConn.includes("public_web_preview")) ok("Telegram connector web preview");
else bad("Telegram connector web preview");

if (tgConn.includes("return []") && !tgConn.match(/throw new Error.*Telegram fetch failed/)) ok("Telegram isolated failure (no throw on web fail)");
else bad("Telegram failure isolation");

if (sched.includes("instagram-murtaqaa") && sched.includes("telegram-drosq8")) ok("Scheduler slug overrides");
else bad("Scheduler overrides");

if (MURTaqaa_DROSQ8_SOURCES.instagram.url.includes("murtaqaa_kw")) ok("Instagram source URL");
if (MURTaqaa_DROSQ8_SOURCES.telegram.url.includes("DrosQ8")) ok("Telegram source URL");

console.log(`\n=== Summary: ${passed} PASS, ${failed} FAIL ===\n`);
process.exit(failed ? 1 : 0);
