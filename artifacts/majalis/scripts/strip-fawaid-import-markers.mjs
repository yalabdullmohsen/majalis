#!/usr/bin/env node
/**
 * Strip [import-N] markers from fawaid_500.csv source file.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizePublicText } from "../lib/production-guard.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "../data/imports/fawaid_500.csv");

const raw = readFileSync(csvPath, "utf8");
const lines = raw.split(/\r?\n/);
let changed = 0;

const out = lines.map((line, idx) => {
  if (idx === 0 || !line.trim()) return line;
  const cleaned = line.replace(/"([^"]*)"/g, (_, text) => {
    const next = sanitizePublicText(text);
    if (next !== text) changed += 1;
    return `"${next.replace(/"/g, '""')}"`;
  });
  return cleaned;
});

writeFileSync(csvPath, out.join("\n"), "utf8");
console.log(`✓ Cleaned fawaid_500.csv — ${changed} field(s) sanitized`);
