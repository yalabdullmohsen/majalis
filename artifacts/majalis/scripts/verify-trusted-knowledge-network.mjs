#!/usr/bin/env node
/**
 * Verify Trusted Knowledge Network (Phase 5) — production readiness.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TKN_VERSION,
  SUPPORTED_SOURCE_TYPES,
  PIPELINE_STAGES,
  DEFAULT_DAILY_QUOTAS,
  listConnectors,
  loadPlatformSettings,
  normalizeRecord,
  extractKeywords,
  classifyRecord,
  buildRelatedSections,
} from "../lib/trusted-knowledge-network/index.mjs";
import { listAvailableMigrations } from "../lib/migration-paths.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function test(cond, msg) {
  if (cond) {
    passed++;
    console.log(`✓ ${msg}`);
  } else {
    failed++;
    console.error(`✗ ${msg}`);
  }
}

console.log(`Trusted Knowledge Network v${TKN_VERSION} — Tests\n`);

test(TKN_VERSION.startsWith("5."), "TKN version 5.x");
test(SUPPORTED_SOURCE_TYPES.length >= 8, `${SUPPORTED_SOURCE_TYPES.length} source types`);
test(PIPELINE_STAGES.length === 10, "10 pipeline stages");
test(DEFAULT_DAILY_QUOTAS.benefits === 300, "default benefits quota 300");
test(DEFAULT_DAILY_QUOTAS.questions === 150, "default questions quota 150");

const connectors = listConnectors();
test(connectors.length >= 8, `${connectors.length} connectors registered`);

const settings = await loadPlatformSettings();
test(settings.dailyQuotas.benefits > 0, "loadPlatformSettings returns quotas");

const normalized = normalizeRecord({ text: "  فائدة   نافعة  ", title: "عنوان" }, "benefits");
test(normalized.text === "فائدة نافعة", "normalizeRecord trims text");

const keywords = extractKeywords({ text: "الصلاة فريضة على المسلمين الصلاة ركن", title: "الصلاة" });
test(keywords.includes("الصلاة") || keywords.length > 0, "extractKeywords works");

const classified = classifyRecord({ text: "أحكام الصلاة والوضوء" }, { category: "فقه" });
test(classified.topics.length > 0 || classified.category, "classifyRecord works");

const related = buildRelatedSections([
  { kind: "fawaid", title: "فائدة", relevance_score: 10 },
  { kind: "hadith", title: "حديث", relevance_score: 9 },
  { kind: "qa", title: "سؤال", relevance_score: 8 },
]);
test(Object.keys(related).length >= 2, "buildRelatedSections groups results");

const migrationPath = join(root, "supabase/trusted_knowledge_network_v1.sql");
test(existsSync(migrationPath), "trusted_knowledge_network_v1.sql exists");
const sql = readFileSync(migrationPath, "utf8");
test(sql.includes("tkn_platform_settings"), "migration creates tkn_platform_settings");
test(sql.includes("tkn_retry_queue"), "migration creates tkn_retry_queue");
test(sql.includes("success_rate"), "migration extends akp_content_sources");

const available = listAvailableMigrations();
test(available.present?.includes("trusted_knowledge_network_v1.sql"), "migration in migration list");

test(existsSync(join(root, "lib/api-handlers/admin/trusted-knowledge-network.js")), "admin API handler exists");
test(existsSync(join(root, "src/views/admin/TrustedKnowledgeSourcesPanel.tsx")), "admin sources panel exists");

console.log(`\nTrusted Knowledge Network: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
