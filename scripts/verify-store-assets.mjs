/**
 * verify:store-assets — Store Release asset / license gate.
 * Usage: node scripts/verify-store-assets.mjs
 * Dist media: STORE_CHECK_DIST=1 after pnpm run store:strip-unresolved-assets
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const majalis = join(root, "artifacts/majalis");
const storeDir = join(root, "docs/store-release");
const failures = [];

function fail(msg) {
  failures.push(msg);
}

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === ".gitkeep" || name === "README.md" || name === "SOURCES.md") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

function isExcludedMediaName(name) {
  return /\.(mp3|m4a|caf|wav|ogg)$/i.test(name);
}

for (const f of [
  "STORE_SOURCE_COMMIT.txt",
  "STORE_ASSET_MANIFEST.md",
  "STORE_LICENSE_DECISIONS.md",
  "STORE_EXCLUSION_REPORT.md",
  "excluded-asset-globs.json",
]) {
  if (!existsSync(join(storeDir, f))) fail(`missing docs/store-release/${f}`);
}

const commit = readFileSync(join(storeDir, "STORE_SOURCE_COMMIT.txt"), "utf8").trim();
if (!/^[0-9a-f]{40}$/i.test(commit)) fail(`STORE_SOURCE_COMMIT invalid: ${commit}`);

const globs = JSON.parse(readFileSync(join(storeDir, "excluded-asset-globs.json"), "utf8"));
if (!Array.isArray(globs.excludedFromStoreBinary) || globs.excludedFromStoreBinary.length < 1) {
  fail("excluded-asset-globs.json missing excludedFromStoreBinary");
}

const catalogSrc = readFileSync(join(majalis, "src/lib/sunnah-audio-platform/adhan-catalog.ts"), "utf8");
if (!/id:\s*"system-default"/.test(catalogSrc)) fail("adhan-catalog must define system-default");

const fnMatch = catalogSrc.match(/export function listSelectableAdhanVoices\(\)[\s\S]*?^\}/m);
if (!fnMatch) {
  fail("listSelectableAdhanVoices not found");
} else {
  const body = fnMatch[0];
  if (!body.includes('licenseStatus === "verified_for_production"')) {
    fail("listSelectableAdhanVoices must filter verified_for_production only");
  }
  if (body.includes("style_only_preview") || body.includes("pending_owner_approval")) {
    fail("listSelectableAdhanVoices must not include style_only/pending");
  }
}

const dist = join(majalis, "dist");
const checkDist = process.env.STORE_CHECK_DIST === "1" || process.argv.includes("--check-dist");
if (checkDist && existsSync(dist)) {
  for (const dir of [join(dist, "sounds/adhan"), join(dist, "audio/adhan")]) {
    for (const f of walkFiles(dir).filter((p) => isExcludedMediaName(p))) {
      fail(`unresolved media in dist: ${relative(majalis, f)}`);
    }
  }
} else if (existsSync(dist)) {
  console.log("  note: dist present — skipped media scan (use --check-dist after strip)");
}

if (failures.length) {
  console.error("verify:store-assets FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log("verify:store-assets OK");
console.log(`  STORE_SOURCE_COMMIT=${commit}`);
