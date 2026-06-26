import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { dedupeKeyForRow } from "./dedupe.mjs";

/**
 * @param {string} rootDir
 * @param {string} type
 * @param {Array<Record<string, unknown>>} rows
 * @param {{ dryRun?: boolean }} opts
 */
export function importToStaged(rootDir, type, rows, opts = {}) {
  const stagedDir = join(rootDir, "data", "imports", "staged");
  const stagedPath = join(stagedDir, `${type}.json`);
  const bundlePath = join(rootDir, "src", "lib", "content-import-bundle.json");

  let existing = [];
  if (existsSync(stagedPath)) {
    try {
      existing = JSON.parse(readFileSync(stagedPath, "utf8"));
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
  }

  const seen = new Set(existing.map((r) => dedupeKeyForRow(type, r)));
  const added = [];
  const skipped = [];

  for (const row of rows) {
    const key = dedupeKeyForRow(type, row);
    if (seen.has(key)) {
      skipped.push({ row, reason: "duplicate" });
      continue;
    }
    seen.add(key);
    added.push(row);
  }

  const merged = [...existing, ...added];

  if (!opts.dryRun) {
    mkdirSync(stagedDir, { recursive: true });
    writeFileSync(stagedPath, JSON.stringify(merged, null, 2), "utf8");
    writeImportBundle(rootDir, bundlePath);
  }

  return { added: added.length, skipped: skipped.length, total: merged.length, stagedPath };
}

function writeImportBundle(rootDir, bundlePath) {
  const stagedDir = join(rootDir, "data", "imports", "staged");
  /** @type {Record<string, unknown[]>} */
  const bundle = {
    adhkar: [],
    quran_surahs: [],
    quran_topics: [],
  };

  for (const type of Object.keys(bundle)) {
    const p = join(stagedDir, `${type}.json`);
    if (!existsSync(p)) continue;
    try {
      const rows = JSON.parse(readFileSync(p, "utf8"));
      bundle[type] = Array.isArray(rows) ? rows : [];
    } catch {
      /* ignore */
    }
  }

  mkdirSync(dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2), "utf8");
}
