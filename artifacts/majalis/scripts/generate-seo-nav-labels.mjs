#!/usr/bin/env node
/**
 * يولّد seo-nav-labels.json النحيف من seo-routes.json (~10KB بدل ~85KB).
 *
 * Source of Truth: src/lib/seo-routes.json
 * Generated (tracked): src/lib/seo-nav-labels.json
 *
 *   node scripts/generate-seo-nav-labels.mjs          # اكتب
 *   node scripts/generate-seo-nav-labels.mjs --check  # قارن دون كتابة (يفشل عند الانحراف)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "src/lib/seo-routes.json");
const out = resolve(root, "src/lib/seo-nav-labels.json");
const checkOnly = process.argv.includes("--check");

function buildPayload() {
  const d = JSON.parse(readFileSync(src, "utf8"));
  const labels = {};
  for (const r of d.routes) {
    const p = String(r.path).replace(/\/$/, "") || "/";
    const core = String(r.title).split(/\s*[—\-–|]\s*/)[0].trim();
    if (core.length <= 25) labels[p] = core;
  }
  return {
    siteUrl: d.siteUrl,
    siteName: d.siteName,
    defaultImage: d.defaultImage,
    logoImage: d.logoImage,
    ogImageWidth: d.ogImageWidth,
    ogImageHeight: d.ogImageHeight,
    labels,
  };
}

/** تنسيق حتمي مطابق لما يكتبه التوليد (سطر واحد بلا مسافات زائدة). */
function serialize(payload) {
  return JSON.stringify(payload);
}

const payload = buildPayload();
const next = serialize(payload);
const current = existsSync(out) ? readFileSync(out, "utf8").replace(/\r\n/g, "\n") : null;

if (checkOnly) {
  if (current === next) {
    console.log(
      `seo-nav-labels.json: check OK (${Buffer.byteLength(next)} bytes, ${Object.keys(payload.labels).length} labels)`,
    );
    process.exit(0);
  }
  console.error(
    "seo-nav-labels.json out of sync with seo-routes.json.\n" +
      "Run: pnpm --filter @workspace/majalis run generate:seo-nav-labels\n" +
      "Then commit artifacts/majalis/src/lib/seo-nav-labels.json",
  );
  process.exit(1);
}

if (current === next) {
  console.log(
    `seo-nav-labels.json: unchanged (${Buffer.byteLength(next)} bytes, ${Object.keys(payload.labels).length} labels)`,
  );
} else {
  writeFileSync(out, next);
  console.log(
    `seo-nav-labels.json: wrote ${Buffer.byteLength(next)} bytes, ${Object.keys(payload.labels).length} labels`,
  );
}
