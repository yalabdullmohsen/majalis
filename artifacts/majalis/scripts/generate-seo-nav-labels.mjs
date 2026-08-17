#!/usr/bin/env node
/**
 * يولّد seo-nav-labels.json النحيف من seo-routes.json (~10KB بدل ~85KB).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "src/lib/seo-routes.json");
const out = resolve(root, "src/lib/seo-nav-labels.json");

const d = JSON.parse(readFileSync(src, "utf8"));
const labels = {};
for (const r of d.routes) {
  const p = String(r.path).replace(/\/$/, "") || "/";
  const core = String(r.title).split(/\s*[—\-–|]\s*/)[0].trim();
  if (core.length <= 25) labels[p] = core;
}
const payload = {
  siteUrl: d.siteUrl,
  siteName: d.siteName,
  defaultImage: d.defaultImage,
  logoImage: d.logoImage,
  ogImageWidth: d.ogImageWidth,
  ogImageHeight: d.ogImageHeight,
  labels,
};
writeFileSync(out, JSON.stringify(payload));
console.log(`seo-nav-labels.json: ${Buffer.byteLength(JSON.stringify(payload))} bytes, ${Object.keys(labels).length} labels`);
