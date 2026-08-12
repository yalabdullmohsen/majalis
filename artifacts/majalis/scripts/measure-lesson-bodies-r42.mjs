#!/usr/bin/env node
/**
 * Round 42 — measure live lesson body lengths in ls()/lessons() tuples and body: fields.
 * Usage: node scripts/measure-lesson-bodies-r42.mjs [--json] [--min=200]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "../src/lib");

const DEFAULT_FILES = [
  "durus-mutanawwia-data.ts",
  "durus-imaniyya-data.ts",
  "fikr-waqia-data.ts",
  "usra-mujtama-data.ts",
  "quran-studies-data.ts",
  "iman-topics-data.ts",
  "tazkiya-topics-data.ts",
  "maqasid-sharia-data.ts",
  "dalail-nubuwwah-data.ts",
  "arabic-language-data.ts",
  "sunnah-studies-data.ts",
  "tarikh-islami-data.ts",
  "mawsuaat-data.ts",
];

const MIN_LEN = Number(process.argv.find((a) => a.startsWith("--min="))?.slice(6) ?? 200);

/** Third string in ["title","summary","body"] tuples. */
const TUPLE_RE =
  /(\[\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*\])/g;

/** Explicit body: "..." fields (if any). */
const BODY_FIELD_RE = /body:\s*"((?:[^"\\]|\\.)*)"/g;

const BRIDGE_RE =
  /(?:^|[\.،]\s*)(?:و(?:ي|ف)(?:ُ|ِ|َ)?[^\s]{2,40}|(?:ف)?(?:لا|مع|ومن|وال|في)[^\s]{2,40})/g;

function readExistingFiles() {
  return DEFAULT_FILES.filter((f) => fs.existsSync(path.join(LIB, f)));
}

function extractBodies(text) {
  const bodies = [];
  let m;
  const tupleRe = new RegExp(TUPLE_RE.source, "g");
  while ((m = tupleRe.exec(text))) {
    bodies.push({ kind: "tuple", text: m[6], len: m[6].length });
  }
  const fieldRe = new RegExp(BODY_FIELD_RE.source, "g");
  while ((m = fieldRe.exec(text))) {
    bodies.push({ kind: "body:", text: m[1], len: m[1].length });
  }
  return bodies;
}

function measureFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const bodies = extractBodies(text);
  const lens = bodies.map((b) => b.len);
  const under = bodies.filter((b) => b.len < MIN_LEN);
  const undefinedCount = bodies.filter((b) => b.text.includes("undefined")).length;
  return {
    total: bodies.length,
    underMin: under.length,
    minLen: lens.length ? Math.min(...lens) : 0,
    maxLen: lens.length ? Math.max(...lens) : 0,
    avgLen: lens.length ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 0,
    undefinedArtifacts: undefinedCount,
    tupleCount: bodies.filter((b) => b.kind === "tuple").length,
    bodyFieldCount: bodies.filter((b) => b.kind === "body:").length,
  };
}

function main() {
  const jsonOut = process.argv.includes("--json");
  const fileList = readExistingFiles();
  const perFile = {};
  let totalBodies = 0;
  let totalUnder = 0;
  let totalUndefined = 0;

  for (const f of fileList) {
    const stats = measureFile(path.join(LIB, f));
    perFile[f] = stats;
    totalBodies += stats.total;
    totalUnder += stats.underMin;
    totalUndefined += stats.undefinedArtifacts;
  }

  const report = {
    minThreshold: MIN_LEN,
    files: fileList.length,
    totalBodies,
    totalUnderMin: totalUnder,
    totalUndefinedArtifacts: totalUndefined,
    perFile,
  };

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`Lesson body measure (threshold ≥${MIN_LEN})`);
  console.log("─".repeat(72));
  console.log(
    `${"file".padEnd(32)} ${"total".padStart(6)} ${"under".padStart(6)} ${"min".padStart(5)} ${"avg".padStart(5)} ${"undef".padStart(6)}`
  );
  console.log("─".repeat(72));
  for (const f of fileList) {
    const s = perFile[f];
    console.log(
      `${f.padEnd(32)} ${String(s.total).padStart(6)} ${String(s.underMin).padStart(6)} ${String(s.minLen).padStart(5)} ${String(s.avgLen).padStart(5)} ${String(s.undefinedArtifacts).padStart(6)}`
    );
  }
  console.log("─".repeat(72));
  console.log(
    `${"TOTAL".padEnd(32)} ${String(totalBodies).padStart(6)} ${String(totalUnder).padStart(6)}`
  );
}

main();
