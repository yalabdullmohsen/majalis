#!/usr/bin/env node
/**
 * Verify fully autonomous Islamic content platform extensions.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AUTONOMOUS_PIPELINE_STAGES, CONTENT_TYPE_TARGETS } from "../lib/auto-knowledge-engine/autonomous/pipeline-stages.mjs";
import { classifyContent, routeContentKind } from "../lib/auto-knowledge-engine/autonomous/content-router.mjs";
import { runAuthenticityGate } from "../lib/auto-knowledge-engine/autonomous/authenticity-gate.mjs";
import { createConnector } from "../lib/auto-knowledge-engine/connectors/index.mjs";
import { TABLE_MAP } from "../lib/knowledge-engine/publisher.mjs";
import { normalizeContentKind } from "../lib/auto-knowledge-engine/content-kind.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) { passed++; console.log(`✓ ${msg}`); }
  else { failed++; console.error(`✗ ${msg}`); }
}

ok(existsSync(join(root, "supabase/auto_knowledge_engine_v18_autonomous.sql")), "v18 migration exists");
ok(existsSync(join(root, "lib/auto-knowledge-engine/autonomous/orchestrator.mjs")), "Autonomous orchestrator");
ok(existsSync(join(root, "lib/auto-knowledge-engine/connectors/html-connector.mjs")), "HTML connector");
ok(existsSync(join(root, "lib/auto-knowledge-engine/connectors/api-connector.mjs")), "API connector");
ok(existsSync(join(root, "lib/auto-knowledge-engine/connectors/sitemap-connector.mjs")), "Sitemap connector");
ok(existsSync(join(root, "lib/auto-knowledge-engine/connectors/podcast-connector.mjs")), "Podcast connector");
ok(existsSync(join(root, "src/views/admin/AutonomousPlatformDashboardPage.tsx")), "Autonomous dashboard page");

const app = readFileSync(join(root, "src/App.tsx"), "utf8");
ok(app.includes("/admin/platform/autonomous"), "Route registered");

ok(AUTONOMOUS_PIPELINE_STAGES.length >= 15, `${AUTONOMOUS_PIPELINE_STAGES.length} pipeline stages`);
ok(AUTONOMOUS_PIPELINE_STAGES.includes("publishing"), "Pipeline includes publishing");
ok(CONTENT_TYPE_TARGETS.fatwa?.table === "fatwas", "Fatwa routing");
ok(CONTENT_TYPE_TARGETS.event?.table === "islamic_events", "Events routing");
ok(CONTENT_TYPE_TARGETS.book?.table === "library_items", "Books routing");

ok(normalizeContentKind("benefit") === "fawaid", "Benefit alias");
ok(normalizeContentKind("conference") === "event", "Event alias");

const classified = classifyContent({ raw_title: "فتوى في الصلاة", raw_body: "سؤال وجواب" }, { allowed_kinds: ["fatwa"] });
ok(classified === "fatwa", "Auto-classify fatwa");

const eventKind = classifyContent({ raw_title: "مؤتمر علمي", raw_body: "ندوة في مسجد" }, {});
ok(eventKind === "event", "Auto-classify event");

ok(routeContentKind("fatwa") === "fatwas", "Route fatwa section");

const auth = runAuthenticityGate(
  { raw_title: "test", raw_body: "x", content_kind: "article", raw_url: "https://x.com" },
  { ai_confidence: 50 },
  { isDuplicate: false, sourceVerified: false, warnings: [] },
  { trust_level: 2 },
);
ok(!auth.passed, "Authenticity rejects weak source");

const authPol = runAuthenticityGate(
  { raw_title: "انتخابات", raw_body: "حزب معارض في الانتخابات", content_kind: "news" },
  { ai_confidence: 70 },
  { isDuplicate: false, sourceVerified: true, warnings: [] },
  { trust_level: 4 },
);
ok(authPol.shouldReject, "Authenticity rejects political noise");

ok(createConnector({ slug: "t", connector_type: "html", official_url: "https://example.com" }).connectorType === "html", "HTML connector factory");
ok(createConnector({ slug: "t", connector_type: "api", api_config: { url: "https://example.com/api" } }).connectorType === "api", "API connector factory");
ok(createConnector({ slug: "t", connector_type: "sitemap", official_url: "https://example.com" }).connectorType === "sitemap", "Sitemap connector factory");
ok(createConnector({ slug: "t", connector_type: "podcast", feed_url: "https://example.com/feed" }).connectorType === "podcast", "Podcast connector factory");

ok(TABLE_MAP.fatwa === "fatwas", "Publisher TABLE_MAP fatwa");
ok(TABLE_MAP.event === "islamic_events", "Publisher TABLE_MAP event");

console.log(`\nAutonomous Islamic Platform: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
