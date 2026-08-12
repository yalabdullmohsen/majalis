#!/usr/bin/env node
/**
 * Apply sharia + MKE activation tables on Production via Vercel cron auth header.
 *
 * Usage:
 *   node scripts/apply-production-activation-tables.mjs
 *   MAJALIS_PRODUCTION_URL=https://majlisilm.com node scripts/apply-production-activation-tables.mjs
 */
const PRODUCTION = process.env.MAJALIS_PRODUCTION_URL || "https://majlisilm.com";

async function call(path) {
  const url = `${PRODUCTION}${path}`;
  const res = await fetch(url, { headers: { "x-vercel-cron": "1" } });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { url, status: res.status, json };
}

async function main() {
  console.log(`Production activation tables → ${PRODUCTION}\n`);

  const compat = await call("/api/cron/apply-migrations?scope=activation-tables&seed=1");
  console.log("activation-tables:", compat.status, JSON.stringify(compat.json, null, 2).slice(0, 6000));

  if (!compat.json?.ok) {
    console.error("\n✗ activation-tables failed");
    process.exit(1);
  }

  const seed = compat.json?.activation?.seed;
  if (seed?.inserted) {
    console.log(`\n✓ Seeded ${seed.inserted} sharia rulings`);
  } else if (seed?.skipped) {
    console.log(`\n✓ Rulings seed skipped (${seed.reason}, count=${seed.count ?? "?"})`);
  }

  const missing = compat.json?.activation?.missing || [];
  if (missing.length) {
    console.error("\n✗ Missing tables:", missing.join(", "));
    process.exit(1);
  }

  console.log("\n✓ All activation tables present");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
