#!/usr/bin/env node
/**
 * Validates src/index.css syntax for Tailwind CSS v4 / PostCSS.
 * Catches orphaned declarations (Missing opening {) before Vite build.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(__dirname, "../src/index.css");
const css = readFileSync(cssPath, "utf8");

const require = createRequire(import.meta.url);
const postcss = require(require.resolve("postcss", { paths: [require.resolve("vite/package.json")] }));

try {
  postcss.parse(css, { from: cssPath });
  console.log("PASS  index.css PostCSS syntax valid");
} catch (err) {
  console.error(`FAIL  index.css line ${err.line ?? "?"}: ${err.reason || err.message}`);
  process.exit(1);
}

// Tailwind-specific: properties at column indent without preceding selector block
const lines = css.split("\n");
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;
  depth += (line.match(/\{/g) || []).length;
  depth -= (line.match(/\}/g) || []).length;
  if (depth < 0) {
    console.error(`FAIL  index.css line ${i + 1}: unexpected closing brace`);
    process.exit(1);
  }
  if (depth === 0 && /^\s{2,}[a-z-]+:/.test(line) && !trimmed.includes("{")) {
    console.error(`FAIL  index.css line ${i + 1}: orphaned property (Missing opening {) — ${trimmed.slice(0, 60)}`);
    process.exit(1);
  }
}

if (depth !== 0) {
  console.error(`FAIL  index.css: unclosed braces (depth=${depth})`);
  process.exit(1);
}

console.log("PASS  index.css brace structure valid");
