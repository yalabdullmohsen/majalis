#!/usr/bin/env node
/**
 * Global lesson time audit + automatic repair pipeline.
 * Run: node scripts/audit-repair-lesson-times.mjs [--repair] [--export report.json]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { auditLessonRow, applyLessonTimeRepair } from "../lib/lesson-time-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repair = process.argv.includes("--repair");
const exportArg = process.argv.find((a) => a.startsWith("--export="));
const exportPath = exportArg?.split("=")[1] || null;

function loadSources() {
  const sources = [];
  const csvPath = join(__dirname, "../data/import/02-kuwait-lessons.csv");
  const jsonPath = join(__dirname, "../data/import/02-kuwait-lessons.json");

  if (existsSync(jsonPath)) {
    const rows = JSON.parse(readFileSync(jsonPath, "utf8"));
    for (const row of rows) sources.push({ source: "kuwait-json", row });
  }

  if (existsSync(csvPath)) {
    const text = readFileSync(csvPath, "utf8");
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      const row = {};
      headers.forEach((h, j) => {
        row[h.trim()] = (cols[j] || "").replace(/^"|"$/g, "").trim();
      });
      sources.push({ source: "kuwait-csv", row });
    }
  }

  return sources;
}

async function loadFromDb() {
  try {
    const { getSupabaseAdmin } = await import("../lib/supabase-admin.mjs");
    const admin = getSupabaseAdmin();
    if (!admin) return [];
    const { data } = await admin.from("lessons").select("*").limit(5000);
    return (data || []).map((row) => ({ source: "supabase", row }));
  } catch {
    return [];
  }
}

console.log("\n═══ Lesson Time Integrity Audit ═══\n");

const local = loadSources();
const remote = await loadFromDb();
const all = [...local, ...remote];

const stats = {
  total: all.length,
  with_issues: 0,
  am_pm_reversed: 0,
  unparseable: 0,
  end_before_start: 0,
  prayer_rank_assigned: 0,
  repaired: 0,
  manual_review: 0,
};

const report = [];

for (const { source, row } of all) {
  const audit = auditLessonRow(row);
  if (audit.issues.length) stats.with_issues += 1;
  if (audit.issues.includes("shorthand_am_pm")) stats.am_pm_reversed += 1;
  if (audit.issues.includes("unparseable_time")) stats.unparseable += 1;
  if (audit.issues.includes("end_before_start")) stats.end_before_start += 1;
  if (audit.effective_prayer_rank && audit.effective_prayer_rank !== "غير مرتبط بصلاة") {
    stats.prayer_rank_assigned += 1;
  }
  if (audit.needs_manual_review) stats.manual_review += 1;

  let repairedRow = row;
  if (repair && audit.repairs.length) {
    const { row: fixed } = applyLessonTimeRepair(row);
    repairedRow = fixed;
    stats.repaired += 1;
  }

  if (audit.issues.length || audit.repairs.length) {
    report.push({
      source,
      id: audit.id,
      title: audit.title,
      lesson_time: audit.lesson_time,
      issues: audit.issues,
      repairs: audit.repairs,
      effective_prayer_rank: audit.effective_prayer_rank,
      normalized: audit.normalized,
      needs_manual_review: audit.needs_manual_review,
      repaired: repair ? repairedRow : undefined,
    });
  }
}

const coverage = stats.total
  ? Math.round((stats.prayer_rank_assigned / stats.total) * 100)
  : 0;

console.log(`Total lessons audited:     ${stats.total}`);
console.log(`With issues:               ${stats.with_issues}`);
console.log(`AM/PM reversed detected:   ${stats.am_pm_reversed}`);
console.log(`Unparseable times:         ${stats.unparseable}`);
console.log(`End before start:          ${stats.end_before_start}`);
console.log(`Prayer rank coverage:      ${coverage}%`);
console.log(`Needs manual review:       ${stats.manual_review}`);
if (repair) console.log(`Automatically repaired:    ${stats.repaired}`);
console.log("");

if (exportPath) {
  writeFileSync(
    exportPath,
    JSON.stringify({ stats, coverage_pct: coverage, report, generated_at: new Date().toISOString() }, null, 2),
  );
  console.log(`Report exported to ${exportPath}\n`);
}

process.exit(stats.am_pm_reversed > 0 && !repair ? 1 : 0);
