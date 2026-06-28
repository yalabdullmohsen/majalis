#!/usr/bin/env node
/**
 * Verify fawaid page data is free of quiz/test/import content.
 */
import { shouldPurgeFawaidRow } from "../lib/production/fawaid-cleanup.mjs";

const WEAK = [
  /^ملخص منظم/, /^متن كلاسيكي/, /^تفريغ:/, /^ملخص مرئي/,
  /\[import-\d+\]\s*$/i,
  /^فائدة:\s*.+\s—\s*(?:من|ما|في|إلى|كم|أين|متى|هل)\s/i,
  /^فائدة:\s*.+\s—\s*.+\?\s*$/,
  /^فائدة:\s/i,
  /\b(?:e2e|mock|placeholder|test data|quiz)\b/i,
];

function isQuality(item) {
  const text = (item.text || "").trim();
  if (text.length < 24) return false;
  if (shouldPurgeFawaidRow(item)) return false;
  if (WEAK.some((p) => p.test(text))) return false;
  return true;
}

let passed = 0;
let failed = 0;
function ok(c, m) { if (c) { passed++; console.log(`✓ ${m}`); } else { failed++; console.error(`✗ ${m}`); } }

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("✗ VITE_SUPABASE_URL/ANON_KEY required");
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/fawaid?select=id,text,author_name,status&status=eq.approved&limit=2000`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const rows = await res.json();
if (!Array.isArray(rows)) {
  console.error("✗ fawaid query failed", rows);
  process.exit(1);
}

const badInDb = rows.filter((r) => shouldPurgeFawaidRow(r));
const visible = rows.filter(isQuality);

ok(badInDb.length === 0, `DB has no blocked fawaid (${rows.length} approved, ${badInDb.length} bad)`);
ok(visible.length >= 1, `At least 1 quality fawaid visible (${visible.length})`);

if (badInDb.length) {
  console.log("\nSample bad rows:");
  badInDb.slice(0, 5).forEach((r) => console.log(`  ${r.id}: ${r.text?.slice(0, 90)}`));
  console.log("\nRun: node scripts/purge-test-content.mjs --apply");
}

console.log(`\nFawaid clean verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
