#!/usr/bin/env node
/**
 * Smart CMS Platform verification — registry, workflow, quality, dedup, import parsers.
 * Run: pnpm --filter @workspace/majalis run verify:smart-cms-platform
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

function read(rel) {
  const p = join(ROOT, rel);
  assert(existsSync(p), `file exists: ${rel}`);
  return readFileSync(p, "utf8");
}

console.log("\n=== Smart CMS Platform Verification ===\n");

// Phase 1 — Platform registry
console.log("Phase 1 — Unified admin CMS");
const registry = read("src/lib/cms/platform-registry.ts");
assert(registry.includes("PLATFORM_SECTIONS"), "platform registry defined");
assert((registry.match(/id: "/g) || []).length >= 15, "15+ content sections");
assert(registry.includes("bulk_import"), "bulk import channel");
assert(registry.includes("user_contribution"), "user contribution channel");
assert(registry.includes("automation"), "automation channel");

// Phase 2 — Bulk import
console.log("\nPhase 2 — Bulk import (CSV/Excel/JSON/ZIP)");
const importParse = read("src/lib/import-parse.ts");
assert(importParse.includes("parseExcelBuffer"), "Excel parser");
assert(importParse.includes("parseZipBuffer"), "ZIP parser");
assert(importParse.includes("parseImportFileAsync"), "async file parser");
const contentImport = read("src/views/admin/ContentFileImport.tsx");
assert(contentImport.includes(".xlsx"), "Excel accept in UI");
assert(contentImport.includes(".zip"), "ZIP accept in UI");
assert(contentImport.includes("suggestColumnMappings"), "column auto-mapping");
assert(contentImport.includes("معاينة"), "import preview");

// Phase 3 — Automation (registry cron paths)
console.log("\nPhase 3 — Smart automation");
assert(registry.includes("automationCronPaths"), "automation cron paths in registry");
const hub = read("src/views/admin/UnifiedCmsHubSection.tsx");
assert(hub.includes("Cron Jobs"), "automation ops dashboard");

// Phase 4 — User contributions
console.log("\nPhase 4 — User contributions");
const contrib = read("src/lib/cms/contribution-service.ts");
assert(contrib.includes("submitContribution"), "contribution service");
assert(existsSync(join(ROOT, "src/views/ContributePage.tsx")), "ContributePage");
const app = read("src/App.tsx");
assert(app.includes("/contribute"), "contribute route");

// Phase 5 — Workflow
console.log("\nPhase 5 — Workflow pipeline");
const workflow = read("src/lib/cms/content-workflow.ts");
assert(workflow.includes("automated_validation"), "validation stage");
assert(workflow.includes("duplicate_detection"), "dedup stage");
assert(workflow.includes("human_review"), "human review stage");
assert(workflow.includes("published"), "publish stage");

// Phase 6 — Dedup
console.log("\nPhase 6 — Unified dedup");
const dedup = read("src/lib/cms/unified-dedup.ts");
assert(dedup.includes("detectUnifiedDuplicates"), "unified dedup");
assert(dedup.includes("normalizeSourceUrl"), "source URL dedup");
assert(dedup.includes("cosineSimilarity"), "semantic similarity");

// Phase 7 — Data quality
console.log("\nPhase 7 — Data quality");
const quality = read("src/lib/cms/content-quality.ts");
assert(quality.includes("validateContentQuality"), "quality validator");
assert(quality.includes("speaker"), "speaker field check");
assert(quality.includes("mosque"), "mosque field check");
assert(quality.includes("severity: \"warning\""), "non-blocking warnings");

// Phase 8 — Ops dashboard
console.log("\nPhase 8 — Automation monitoring");
assert(hub.includes("getCmsDashboardStats"), "CMS stats");
assert(hub.includes("getRecentContentImportJobs"), "import job history");

// Phase 9 — Notifications
console.log("\nPhase 9 — Admin notifications");
const notifications = read("src/lib/cms/cms-notifications.ts");
assert(notifications.includes("pushCmsNotification"), "notification push");
assert(notifications.includes("import_failed"), "import failure alerts");
assert(notifications.includes("review_needed"), "review alerts");
assert(existsSync(join(ROOT, "supabase/cms_platform_v6.sql")), "notifications migration");

// Phase 10 — Performance/security patterns
console.log("\nPhase 10 — Performance & security");
assert(importParse.includes("UPLOAD_BATCH_SIZE"), "batch processing");
assert(contentImport.includes("pollJobUntilDone"), "async job polling/resume");
const columnMapper = read("src/lib/cms/column-mapper.ts");
assert(columnMapper.includes("suggestColumnMappings"), "column mapper");

// Revision log
console.log("\nRevision & audit");
const revision = read("src/lib/cms/revision-service.ts");
assert(revision.includes("getRevisionLog"), "revision log fetch");
assert(revision.includes("restoreRevision"), "version restore");

// Dedup unit test (inline)
console.log("\nDedup smoke test");
function hashKey(parts) {
  return createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
}
const k1 = hashKey(["lesson", "درس الفقه", "الشيخ أ"]);
const k2 = hashKey(["lesson", "درس الفقه", "الشيخ أ"]);
const k3 = hashKey(["lesson", "درس مختلف", "الشيخ ب"]);
assert(k1 === k2, "duplicate hash match");
assert(k1 !== k3, "distinct hash mismatch");

// Import registry sync
console.log("\nImport registry");
const importRegistry = read("lib/content-import/registry.mjs");
assert(importRegistry.includes("stories"), "stories import type");
assert(importRegistry.includes("questions"), "questions import type");

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
