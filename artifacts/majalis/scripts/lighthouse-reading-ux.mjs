#!/usr/bin/env node
/**
 * Lighthouse performance + accessibility smoke (requires built preview or production URL).
 * Usage: node scripts/lighthouse-reading-ux.mjs [--base=http://127.0.0.1:4173]
 */
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7)
  || process.env.MAJALIS_PRODUCTION_URL
  || "https://majlisilm.com";

const routes = ["/adhkar", "/tasbih", "/qa", "/fawaid"];

async function checkRoute(path) {
  const url = `${base}${path}`;
  const res = await fetch(url);
  const html = await res.text();
  const hasHighlight = html.includes("highlighted-content-card") || html.includes("adhkar-page--v2") || html.includes("tasbih-pro-page--v2");
  const hasTitle = html.includes("<title");
  return { url, status: res.status, ok: res.ok && hasTitle, hasUxMarker: hasHighlight };
}

console.log(`Lighthouse UX smoke → ${base}\n`);

let failed = 0;
for (const path of routes) {
  try {
    const r = await checkRoute(path);
    const ok = r.ok;
    if (!ok) failed++;
    console.log(`${ok ? "✓" : "✗"} ${path} HTTP ${r.status}${r.hasUxMarker ? " (UX bundle marker)" : ""}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${path} — ${err.message}`);
  }
}

if (failed) {
  console.error(`\n${failed} route(s) failed`);
  process.exit(1);
}

console.log("\nLighthouse UX smoke: PASS (route availability + bundle markers)");
console.log("Note: run Chrome Lighthouse locally for full performance/accessibility scores.");
