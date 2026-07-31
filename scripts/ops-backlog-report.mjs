#!/usr/bin/env node
/**
 * Read-only operational backlog report for Supabase ops tables.
 * Never deletes data. Prints counts when SUPABASE_URL + service/anon key exist.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/ops-backlog-report.mjs
 *   # or VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (counts may be RLS-limited)
 */
const TABLES = [
  "background_job_dead_letters",
  "content_production_dead_letter",
  "automation_step_logs",
  "akp_review_queue",
  "akp_structured_logs",
  "mke_decisions",
  "mke_quality_reports",
  "background_jobs",
];

function env(...keys) {
  for (const k of keys) {
    if (process.env[k]) return process.env[k];
  }
  return "";
}

async function countTable(baseUrl, key, table) {
  const url = `${baseUrl.replace(/\/$/, "")}/rest/v1/${table}?select=id&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (!res.ok) {
    return { table, ok: false, status: res.status, error: (await res.text()).slice(0, 180) };
  }
  const range = res.headers.get("content-range") || "";
  const m = /\/(\d+|\*)/.exec(range);
  const total = m && m[1] !== "*" ? Number(m[1]) : null;
  return { table, ok: true, total, contentRange: range };
}

async function main() {
  const baseUrl = env("SUPABASE_URL", "VITE_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");
  console.log("=== ops backlog report (read-only) ===\n");
  if (!baseUrl || !key) {
    console.log("  ⚠ SUPABASE_URL / key not set — skipping live counts.");
    console.log("  See docs/operations/OPS_TABLES_RETENTION.md for policy.");
    process.exit(0);
  }
  const rows = [];
  for (const table of TABLES) {
    try {
      rows.push(await countTable(baseUrl, key, table));
    } catch (e) {
      rows.push({ table, ok: false, error: String(e?.message || e).slice(0, 180) });
    }
  }
  for (const r of rows) {
    if (r.ok) console.log(`  ✓ ${r.table}: ${r.total ?? "?"} rows`);
    else console.log(`  ✗ ${r.table}: ${r.status || ""} ${r.error || "failed"}`);
  }
  const dead = rows.filter((r) => /dead_letter/i.test(r.table) && r.ok && Number(r.total) > 0);
  if (dead.length) {
    console.log("\n  Dead-letter backlog present — review manually; do not auto-delete.");
  }
  console.log("\nDone. No mutations performed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
