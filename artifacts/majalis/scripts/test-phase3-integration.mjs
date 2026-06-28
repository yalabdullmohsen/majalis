#!/usr/bin/env node
/**
 * Phase 3 integration tests — Supabase + AKE + Search + Quality Pipeline
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeContentKind } from "../lib/auto-knowledge-engine/content-kind.mjs";
import { TABLE_MAP, buildRecord } from "../lib/knowledge-engine/publisher.mjs";
import { runQualityPipeline, STAGES } from "../lib/platform-quality-pipeline.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

console.log("\n=== Phase 3 Supabase + AKE Integration Tests ===\n");

// ── Migration SQL ───────────────────────────────────────────────────────────
console.log("Migration SQL:");
const sqlPath = join(root, "supabase/quran_circles_mutoon_v1.sql");
const monoSqlPath = join(root, "../../supabase/quran_circles_mutoon_v1.sql");

test("quran_circles_mutoon_v1.sql exists in artifacts", () => {
  assert.ok(existsSync(sqlPath));
});

test("quran_circles_mutoon_v1.sql exists in monorepo root", () => {
  assert.ok(existsSync(monoSqlPath));
});

const sql = readFileSync(sqlPath, "utf8");
for (const table of [
  "quran_circles", "mutoon_texts", "mutoon_lessons", "contact_messages",
  "user_mutoon_progress", "user_quran_circle_enrollments", "platform_content_quality",
  "user_search_history", "search_analytics",
]) {
  test(`SQL creates table ${table}`, () => {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  });
}

test("SQL is idempotent (IF NOT EXISTS)", () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS/);
  assert.match(sql, /DROP POLICY IF EXISTS/);
  assert.match(sql, /ON CONFLICT \(external_key\) DO NOTHING/);
});

test("SQL extends search_platform with quran_circles and mutoon", () => {
  assert.match(sql, /'quran_circles'/);
  assert.match(sql, /'mutoon'/);
  assert.match(sql, /FROM quran_circles/);
  assert.match(sql, /FROM mutoon_texts/);
});

// ── AKE content kinds ───────────────────────────────────────────────────────
console.log("\nAKE Content Kinds:");
test("normalizeContentKind maps quran_circle", () => {
  assert.equal(normalizeContentKind("halaqa"), "quran_circle");
});

test("normalizeContentKind maps mutoon", () => {
  assert.equal(normalizeContentKind("matn"), "mutoon");
});

test("normalizeContentKind maps annual_course", () => {
  assert.equal(normalizeContentKind("annual_course"), "annual_course");
});

test("TABLE_MAP includes new kinds", () => {
  assert.equal(TABLE_MAP.quran_circle, "quran_circles");
  assert.equal(TABLE_MAP.mutoon, "mutoon_texts");
  assert.equal(TABLE_MAP.annual_course, "annual_courses");
  assert.equal(TABLE_MAP.sharia_ruling, "sharia_rulings");
});

// ── Publisher buildRecord ───────────────────────────────────────────────────
console.log("\nPublisher buildRecord:");
const sampleItem = (kind) => ({
  content_kind: kind,
  external_id: `test:${kind}:1`,
  raw_title: "عنوان تجريبي",
  raw_body: "محتوى تجريبي للاختبار",
  verification_status: "verified",
  raw_url: "https://example.com/test",
});

for (const kind of ["quran_circle", "mutoon", "annual_course", "sharia_ruling"]) {
  test(`buildRecord supports ${kind}`, () => {
    const built = buildRecord(sampleItem(kind), { ai_title: "عنوان", ai_summary: "ملخص", ai_category: "فقه" });
    assert.ok(built, `buildRecord returned null for ${kind}`);
    assert.ok(built.table);
    assert.ok(built.record);
    assert.equal(built.record.status, "approved");
  });
}

// ── Quality Pipeline ────────────────────────────────────────────────────────
console.log("\nQuality Pipeline:");
test("STAGES has 8 stages", () => {
  assert.equal(STAGES.length, 8);
});

test("quality pipeline blocks empty content", () => {
  const r = runQualityPipeline({});
  assert.equal(r.passed, false);
  assert.equal(r.blocked_reason, "empty_content");
});

test("quality pipeline passes verified content", () => {
  const r = runQualityPipeline({
    title: "حلقة تجويد",
    body: "محتوى كافٍ للنشر",
    verification_status: "verified",
    confidence: 0.9,
  });
  assert.equal(r.passed, true);
  assert.ok(r.confidence >= 0.75);
});

test("quality pipeline blocks low confidence", () => {
  const r = runQualityPipeline({
    title: "test",
    body: "content",
    verification_status: "verified",
    confidence: 0.3,
  });
  assert.equal(r.passed, false);
  assert.equal(r.blocked_reason, "low_confidence");
});

test("quality pipeline blocks duplicates", () => {
  const r = runQualityPipeline({
    title: "test",
    body: "content",
    verification_status: "verified",
    duplicate_score: 0.95,
    confidence: 0.9,
  });
  assert.equal(r.passed, false);
  assert.equal(r.blocked_reason, "duplicate_detected");
});

// ── TypeScript source files ─────────────────────────────────────────────────
console.log("\nSource files:");
for (const file of [
  "src/lib/quran-circles-mutoon-service.ts",
  "src/lib/quran-circles-seed.ts",
  "src/lib/mutoon-seed.ts",
  "src/lib/progress-tracking-service.ts",
  "src/views/QuranCirclesPage.tsx",
  "src/views/MutoonPage.tsx",
  "src/views/admin/QuranCirclesSection.tsx",
  "src/views/admin/MutoonSection.tsx",
  "src/views/admin/ContactMessagesSection.tsx",
  "reports/supabase-ake-phase1-audit.md",
]) {
  test(`${file} exists`, () => {
    assert.ok(existsSync(join(root, file)));
  });
}

// ── Search seed ─────────────────────────────────────────────────────────────
console.log("\nSearch integration:");
test("platform-search.ts includes quran_circles and mutoon keys", () => {
  const src = readFileSync(join(root, "src/lib/platform-search.ts"), "utf8");
  assert.match(src, /quran_circles:/);
  assert.match(src, /mutoon:/);
  assert.match(src, /QURAN_CIRCLES_SEED/);
  assert.match(src, /MUTOON_SEED/);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
