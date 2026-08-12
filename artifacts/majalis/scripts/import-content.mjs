#!/usr/bin/env node
/**
 * Unified content import CLI — Majalis Al-Ilm
 *
 * Usage:
 *   node scripts/import-content.mjs --type=lessons --file=data/imports/lessons.sample.json
 *   node scripts/import-content.mjs --type=questions --file=data/imports/questions.sample.json --dry-run
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { runContentImport, printImportReport } from "../lib/content-import/engine.mjs";
import { CONTENT_TYPES } from "../lib/content-import/registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = {};
  for (const arg of argv) {
    if (arg === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const [k, v] = arg.slice(2).split("=");
      out[k] = v ?? true;
    }
  }
  return out;
}

function printHelp() {
  console.log(`
Content Import Engine — المجلس العلمي

Usage:
  node scripts/import-content.mjs --type=<type> --file=<path> [--dry-run]

Types:
  ${CONTENT_TYPES.join(", ")}

Examples:
  node scripts/import-content.mjs --type=lessons --file=data/imports/lessons.sample.json
  node scripts/import-content.mjs --type=adhkar --file=data/imports/adhkar.sample.json --dry-run
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printHelp();
    process.exit(0);
  }

  const type = args.type;
  const file = args.file;
  if (!type || !file) {
    printHelp();
    process.exit(1);
  }

  const filePath = resolve(root, String(file));
  if (!existsSync(filePath)) {
    console.error(`✗ الملف غير موجود: ${filePath}`);
    process.exit(1);
  }

  const report = await runContentImport({
    rootDir: root,
    type: String(type),
    filePath,
    dryRun: Boolean(args.dryRun || args["dry-run"]),
  });

  printImportReport(report);
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error("✗ خطأ غير متوقع:", err);
  process.exit(1);
});
