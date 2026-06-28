#!/usr/bin/env node
/**
 * Verify AKE Production Hardening (v19) extensions.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyRetryError, RETRY_CLASS, adaptiveRetryDelay } from "../lib/auto-knowledge-engine/hardening/adaptive-retry.mjs";
import { detectSmartDuplicate, normalizeText, titleSimilarity } from "../lib/auto-knowledge-engine/hardening/semantic-dedup.mjs";
import { buildFeedUrlList, detectFeedFormat, parseFeedBody } from "../lib/auto-knowledge-engine/hardening/rss-reliability.mjs";
import { computeConnectorHealthSnapshot } from "../lib/auto-knowledge-engine/hardening/connector-health.mjs";
import { enrichAnalysisMetadata } from "../lib/auto-knowledge-engine/hardening/ai-enrichment.mjs";
import { classifySourceType, discoverFeedsFromHtml } from "../lib/auto-knowledge-engine/hardening/source-discovery.mjs";
import { AKE_RPC_FUNCTIONS } from "../lib/auto-knowledge-engine/rpc-probe.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) { passed++; console.log(`✓ ${msg}`); }
  else { failed++; console.error(`✗ ${msg}`); }
}

ok(existsSync(join(root, "supabase/auto_knowledge_engine_v19_hardening.sql")), "v19 migration exists");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/index.mjs")), "Hardening index");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/fiqh-migration.mjs")), "Fiqh migration module");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/rss-reliability.mjs")), "RSS reliability");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/adaptive-retry.mjs")), "Adaptive retry");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/semantic-dedup.mjs")), "Semantic dedup");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/connector-health.mjs")), "Connector health");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/incident-recovery.mjs")), "Incident recovery");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/analytics.mjs")), "Publishing analytics");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/notifications.mjs")), "Notifications");
ok(existsSync(join(root, "lib/auto-knowledge-engine/hardening/dashboard.mjs")), "Dashboard aggregator");
ok(existsSync(join(root, "lib/api-handlers/admin/ake-hardening.js")), "Admin API handler");
ok(existsSync(join(root, "src/views/admin/AkeHardeningDashboardPage.tsx")), "Hardening dashboard page");
ok(existsSync(join(root, "src/lib/ake-hardening-api.ts")), "Client API");

const app = readFileSync(join(root, "src/App.tsx"), "utf8");
ok(app.includes("/admin/platform/hardening"), "Route registered");

const dispatch = readFileSync(join(root, "lib/api-dispatch.mjs"), "utf8");
ok(dispatch.includes("ake-hardening"), "API dispatch route");

const migrations = readFileSync(join(root, "lib/migration-paths.mjs"), "utf8");
ok(migrations.includes("auto_knowledge_engine_v19_hardening.sql"), "Migration paths include v19");

const orchestrator = readFileSync(join(root, "lib/auto-knowledge-engine/orchestrator.mjs"), "utf8");
ok(orchestrator.includes("runIncidentRecoveryCycle"), "Orchestrator integrates recovery");
ok(orchestrator.includes("updateConnectorIntelligence"), "Orchestrator integrates connector health");
ok(orchestrator.includes("migrateFiqhFromLibraryItems"), "Orchestrator integrates fiqh migration");

const applyMigrations = readFileSync(join(root, "lib/api-handlers/cron/apply-migrations.js"), "utf8");
ok(applyMigrations.includes("ake-v19"), "Apply migrations scope ake-v19");

// Adaptive retry
const permanent = classifyRetryError(new Error("RSS permanent: 404"));
ok(permanent.class === RETRY_CLASS.NEVER, "404 never retries");
const timeout = classifyRetryError(new Error("timeout"));
ok(timeout.class === RETRY_CLASS.IMMEDIATE, "Timeout immediate retry");
ok(adaptiveRetryDelay(1, RETRY_CLASS.IMMEDIATE) === 0, "First immediate retry is instant");

// Semantic dedup
ok(normalizeText("بِسْمِ اللَّه") === normalizeText("بسم الله"), "Arabic diacritics normalized");
ok(titleSimilarity("فتوى في الصلاة", "فتوى في الصلاة") === 1, "Exact title match");
const dup = detectSmartDuplicate(
  { raw_title: "قرار مجلس الفقه", raw_body: "نص القرار", raw_url: "https://a.com/1", external_id: "a:1" },
  [{ id: "x", raw_title: "قرار مجلس الفقه", raw_body: "نص القرار", raw_url: "https://a.com/2", publish_status: "published" }],
);
ok(dup.isDuplicate, "High title similarity detected");

// RSS reliability
const urls = buildFeedUrlList({ slug: "test", feed_url: "https://a.com/rss", cached_feed_url: "https://a.com/cached", feed_mirror_urls: ["https://a.com/mirror"] });
ok(urls.length >= 2, "Feed URL list includes mirrors");
ok(detectFeedFormat("application/json", '{"items":[]}') === "json", "JSON feed detected");
const rssItems = parseFeedBody('<rss><channel><item><title>T</title><link>https://x.com</link></item></channel></rss>', "rss");
ok(Array.isArray(rssItems), "RSS parse returns array");

// Connector health
const health = computeConnectorHealthSnapshot({ slug: "t", trust_level: 4, consecutive_failures: 0 }, { fetched: 10, published: 5, duplicate: 1 });
ok(health.health === "healthy", "Healthy connector snapshot");
ok(health.itemsDiscovered >= 10, "Items discovered tracked");

// AI enrichment
const enriched = enrichAnalysisMetadata({ ai_title: "درس", ai_summary: "محتوى", ai_category: "فقه", seo_title: "S", seo_description: "D" }, { content_kind: "lesson", raw_url: "https://x.com" });
ok(enriched.educational_level, "Educational level inferred");
ok(enriched.json_ld?.["@type"], "JSON-LD generated");
ok(enriched.opengraph?.["og:title"], "OpenGraph generated");

// Source discovery
ok(classifySourceType("https://university.edu.sa") === "university", "University source type");
const feeds = discoverFeedsFromHtml('<link rel="alternate" type="application/rss+xml" href="/feed.xml">', "https://example.com");
ok(feeds.length >= 1, "RSS discovered from HTML");

// RPC registry
ok(AKE_RPC_FUNCTIONS.some((f) => f.name === "ake_engine_stats"), "ake_engine_stats registered");
ok(AKE_RPC_FUNCTIONS.some((f) => f.name === "ake_publishing_analytics_snapshot"), "analytics RPC registered");

const sql = readFileSync(join(root, "supabase/auto_knowledge_engine_v19_hardening.sql"), "utf8");
ok(sql.includes("ake_feed_cache"), "Feed cache table");
ok(sql.includes("ake_fiqh_migration_log"), "Fiqh migration log");
ok(sql.includes("ake_publishing_analytics"), "Publishing analytics table");
ok(sql.includes("ake_discovered_sources"), "Discovered sources table");
ok(sql.includes("NOTIFY pgrst"), "PostgREST reload");

console.log(`\nAKE Production Hardening: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
