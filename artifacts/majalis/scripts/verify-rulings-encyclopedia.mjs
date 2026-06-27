#!/usr/bin/env node
/** Verify rulings encyclopedia seed quality */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.resolve(ROOT, "public/data/rulings-encyclopedia/manifest.json");

function main() {
  if (!fs.existsSync(MANIFEST)) {
    console.error("FAIL: manifest not found — run generate:rulings first");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  let errors = 0;
  let warnings = 0;

  if (manifest.total < 100) {
    console.warn(`WARN: only ${manifest.total} rulings (target 5000+ requires bulk CSV import)`);
    warnings++;
  }

  for (const chunk of manifest.chunks) {
    const file = path.resolve(ROOT, "public/data/rulings-encyclopedia", chunk.file);
    if (!fs.existsSync(file)) {
      console.error(`FAIL: missing chunk ${chunk.file}`);
      errors++;
      continue;
    }
    const items = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const item of items) {
      if (!item.title || !item.body) {
        console.error(`FAIL: missing title/body in ${item.external_key || item.id}`);
        errors++;
      }
      const hasRef =
        (item.references?.length ?? 0) > 0 ||
        (item.evidence?.length ?? 0) > 0 ||
        (item.quran_evidence?.length ?? 0) > 0 ||
        (item.sunnah_evidence?.length ?? 0) > 0;
      if (!hasRef) {
        console.error(`FAIL: no reference for ${item.title}`);
        errors++;
      }
    }
  }

  console.log(`Verified ${manifest.total} rulings in ${manifest.chunks.length} chunks`);
  console.log(`Errors: ${errors}, Warnings: ${warnings}`);

  if (errors > 0) process.exit(1);
  console.log("OK");
}

main();
