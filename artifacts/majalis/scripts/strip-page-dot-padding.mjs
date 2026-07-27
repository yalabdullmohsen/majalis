#!/usr/bin/env node
/**
 * Remove generated trailing dot padding from educational page metadata.
 * Usage: node scripts/strip-page-dot-padding.mjs [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viewsDir = path.join(__dirname, "../src/views");
const apply = process.argv.includes("--apply");
const targetField = /\b(?:desc|description|summary|explanation)\b\s*[:=]\s*["'`]/;
const trailingDotsBeforeQuote = /\.{10,}(?=["'`])/g;

const results = [];

for (const file of fs.readdirSync(viewsDir).sort()) {
  if (!file.endsWith("Page.tsx")) continue;
  const filePath = path.join(viewsDir, file);
  const source = fs.readFileSync(filePath, "utf8");
  const lines = source.split("\n");
  let replacements = 0;
  const nextLines = lines.map((line) => {
    if (!targetField.test(line)) return line;
    if (line.includes("قال ﷺ") || line.includes("﴿")) return line;
    const next = line.replace(trailingDotsBeforeQuote, (dots) => {
      replacements += 1;
      return "";
    });
    return next;
  });
  if (replacements === 0) continue;
  if (apply) fs.writeFileSync(filePath, nextLines.join("\n"), "utf8");
  results.push({ file: path.relative(path.join(__dirname, ".."), filePath), replacements });
}

console.log(JSON.stringify({ apply, changedFiles: results.length, replacements: results.reduce((sum, item) => sum + item.replacements, 0), files: results }, null, 2));
