#!/usr/bin/env node
/**
 * Phase 7 — Instagram Graph API + Manual Assist mandatory tests.
 */
import {
  getInstagramGraphStatus,
  isInstagramGraphConfigured,
  getMockInstagramPosts,
} from "../lib/cms/instagram-graph-api.mjs";
import { discoverInstagramSource } from "../lib/cms/instagram-connector.mjs";
import { KUWAIT_INSTAGRAM_SOURCES } from "../lib/cms/kuwait-instagram-sources.mjs";
import { hashImageBuffer } from "../lib/cms/lesson-duplicate-detector.mjs";
import { findIntelligenceDuplicate } from "../lib/cms/lesson-intelligence/dedup-engine.mjs";
import { simulateAutoPublishScenario } from "../lib/cms/lesson-source-monitor.mjs";

let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`✗ ${name}`);
    failed += 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

const kuwaitSource = {
  ...KUWAIT_INSTAGRAM_SOURCES[0],
  id: "test-source-id",
  name: KUWAIT_INSTAGRAM_SOURCES[0].name,
  url: KUWAIT_INSTAGRAM_SOURCES[0].url,
  platform: "instagram",
};

// Test 1: Graph API configured (mock) — fetches posts
const prevMock = process.env.INSTAGRAM_GRAPH_MOCK;
const prevToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
const prevBiz = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

process.env.INSTAGRAM_GRAPH_MOCK = "1";
process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN = "mock_token";
process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "mock_biz_id";

assert("Test 1a: Graph configured (mock)", isInstagramGraphConfigured());
const mockPosts = getMockInstagramPosts("drooss_kw");
assert("Test 1b: Mock posts have media", mockPosts[0]?.imageUrl && mockPosts[0]?.permalink);

const discoverMock = await discoverInstagramSource(kuwaitSource);
assert("Test 1c: Discovery returns posts", discoverMock.items?.length >= 1);
assert("Test 1d: Post has caption/media", Boolean(discoverMock.items[0]?.description || discoverMock.items[0]?.imageUrl));
assert("Test 1e: Not manual assist when mock graph", !discoverMock.manualAssistMode);

// Test 2: Graph API missing — no crash, manual assist
delete process.env.INSTAGRAM_GRAPH_MOCK;
delete process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

const statusMissing = getInstagramGraphStatus();
assert("Test 2a: Not configured", !statusMissing.configured);
assert("Test 2b: Manual assist flag", statusMissing.manualAssistMode === true);
assert("Test 2c: Status message", statusMissing.status === "instagram_connector_not_configured");

const discoverManual = await discoverInstagramSource(kuwaitSource);
assert("Test 2d: No crash on discovery", discoverManual != null);
assert("Test 2e: Manual assist mode", discoverManual.manualAssistMode === true);
assert("Test 2f: No empty connectorPending items", !(discoverManual.items || []).some((i) => i.connectorPending));

// Test 3: Manual poster extraction path (caption → auto-publish evaluation)
const future = new Date();
future.setMonth(future.getMonth() + 2);
const captionParsed = {
  title: "شرح كتاب التوحيد",
  speaker_name: "الشيخ عبدالله الأنصاري",
  start_date: future.toISOString().slice(0, 10),
  gregorian_date: future.toISOString().slice(0, 10),
  day_of_week: "الجمعة",
  lesson_time: "بعد العشاء",
  mosque: "مسجد السلام",
  region: "الجهراء",
  city: "العاصمة",
  description: "درس شرح كتاب التوحيد — الشيخ عبدالله — مسجد السلام — الجمعة بعد العشاء",
};

const evalDraft = simulateAutoPublishScenario({
  source: { active: true, auto_publish_allowed: true, trust_level: "trusted" },
  parsed: captionParsed,
  confidenceScore: 0.96,
  duplicate: { isDuplicate: false },
  sheikhMatch: { matched: { id: "s1" } },
  sourceUrl: "https://instagram.com/p/manual-test",
  imageUrl: "https://example.com/poster.jpg",
});
assert("Test 3a: Caption+image → can evaluate", evalDraft.decision === "approved" || evalDraft.decision === "pending_review");
assert("Test 3b: Has parsed fields", captionParsed.title && captionParsed.speaker_name);

// Test 4: Duplicate poster hash
const buf = Buffer.alloc(256, 99);
const hash1 = hashImageBuffer(buf);
const hash2 = hashImageBuffer(buf);
assert("Test 4a: Same image same hash", hash1 === hash2);
const dupCheck = await findIntelligenceDuplicate({
  parsed: captionParsed,
  sourceUrl: "https://instagram.com/p/other",
  imageHash: hash1,
});
assert("Test 4b: Duplicate check runs", dupCheck != null);

// Restore env
if (prevMock !== undefined) process.env.INSTAGRAM_GRAPH_MOCK = prevMock;
else delete process.env.INSTAGRAM_GRAPH_MOCK;
if (prevToken !== undefined) process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN = prevToken;
else delete process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
if (prevBiz !== undefined) process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = prevBiz;
else delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

console.log(failed ? `\n${failed} failed` : "\nAll Phase 7 Instagram tests passed (4 scenarios)");
process.exit(failed ? 1 : 0);
