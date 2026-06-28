#!/usr/bin/env node
/**
 * Universal Import Engine tests — CSV encodings, delimiters, preview, batch sizes, validation.
 */
import { parseUniversalCsv, parseUniversalFile, decodeContent, detectEncoding } from "../lib/content-import/universal-csv-parser.mjs";
import { applyColumnAliases, getAliasMap } from "../lib/content-import/column-aliases.mjs";
import { buildImportPreview } from "../lib/content-import/preview.mjs";
import { validateAllRowsWithSchema } from "../lib/content-import/schema-validator.mjs";
import { validateAllRows } from "../lib/content-import/engine.mjs";
import { dedupeRows } from "../lib/content-import/dedupe.mjs";
import { resolveImportBatchSize, resolveUploadBatchSize } from "../lib/content-import/batch-size.mjs";
import { formatValidationError } from "../lib/content-import/error-reporter.mjs";
import { getContentSchema, listContentSchemas } from "../lib/content-import/schema-loader.mjs";
import { retryImportJob } from "../lib/content-import/engine.mjs";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    return;
  }
  failed++;
  console.error(`✗ ${msg}`);
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${name}: ${err.message}`);
  }
}

test("UTF-8 BOM detection", () => {
  const buf = Buffer.from([0xef, 0xbb, 0xbf, ...Buffer.from("text,author\nفائدة,ابن تيمية", "utf8")]);
  const enc = detectEncoding(buf);
  assert(enc.encoding === "utf-8-bom", "BOM detected");
  const { text } = decodeContent(buf);
  assert(text.startsWith("text"), "BOM stripped");
});

test("UTF-16 LE detection", () => {
  const raw = "text;author\nفائدة;ابن القيم";
  const buf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(raw, "utf16le")]);
  const enc = detectEncoding(buf);
  assert(enc.encoding === "utf-16le", "UTF-16 LE detected");
  const { text } = decodeContent(buf);
  assert(text.includes("فائدة"), "UTF-16 decoded Arabic");
});

test("comma delimiter CSV", () => {
  const csv = "text,author_name\nفائدة,البخاري";
  const parsed = parseUniversalCsv(csv);
  assert(parsed.delimiter === ",", "comma delimiter");
  assert(parsed.rows.length === 1 && parsed.rows[0].text === "فائدة", "comma row");
});

test("semicolon delimiter CSV (Excel Arabic)", () => {
  const csv = "text;author_name\nفائدة علمية;ابن القيم";
  const parsed = parseUniversalCsv(csv);
  assert(parsed.delimiter === ";", "semicolon delimiter");
  assert(parsed.rows[0].text === "فائدة علمية", "semicolon text");
});

test("tab delimiter CSV", () => {
  const csv = "text\tauthor_name\nفائدة\tالترمذي";
  const parsed = parseUniversalCsv(csv);
  assert(parsed.delimiter === "\t", "tab delimiter");
  assert(parsed.rows[0].author_name === "الترمذي", "tab columns");
});

test("pipe delimiter CSV", () => {
  const csv = "text|author_name\nفائدة|النسائي";
  const parsed = parseUniversalCsv(csv);
  assert(parsed.delimiter === "|", "pipe delimiter");
  assert(parsed.rows[0].author_name === "النسائي", "pipe columns");
});

test("benefits column alias الفائدة", () => {
  const row = applyColumnAliases("benefits", { الفائدة: "نص", المصدر: "شيخ" });
  assert(row.text === "نص", "الفائدة maps to text");
  assert(row.author_name === "شيخ", "المصدر maps to author_name");
});

test("questions column alias السؤال", () => {
  const row = applyColumnAliases("questions", { السؤال: "ما الحكم؟", الجواب: "جائز", المصدر: "فتوى" });
  assert(row.question === "ما الحكم؟", "السؤال alias");
  assert(row.answer === "جائز", "الجواب alias");
});

test("schema files load for all registry types with schemas", () => {
  const schemas = listContentSchemas();
  assert(schemas.includes("benefits"), "benefits schema");
  assert(schemas.includes("hadith"), "hadith schema");
  assert(getContentSchema("benefits")?.fields?.text?.required === true, "benefits text required");
});

test("structured validation error format", () => {
  const err = formatValidationError({
    line: 14,
    field: "text",
    fieldLabel: "نص الفائدة",
    value: "",
    reason: "القيمة فارغة",
    suggestion: "أضف نص الفائدة ثم أعد المحاولة.",
  });
  assert(err.message.includes("السطر 14"), "line in message");
  assert(err.message.includes("الحل:"), "suggestion in message");
});

test("preview blocks invalid file", () => {
  const preview = buildImportPreview({
    type: "benefits",
    filename: "bad.csv",
    content: "author_name\nالبخاري",
  });
  assert(preview.ok === true, "preview returns");
  assert(preview.canImport === false, "cannot import invalid");
  assert((preview.stats?.rejectedRows ?? 0) > 0, "rejected rows counted");
});

test("preview accepts valid benefits CSV", () => {
  const preview = buildImportPreview({
    type: "benefits",
    filename: "good.csv",
    content: "benefit,author\nفائدة نافعة,ابن القيم",
  });
  assert(preview.canImport === true, "can import valid benefits");
  assert(preview.stats?.totalRows === 1, "one row");
  assert(preview.encoding, "encoding detected");
});

test("duplicate detection in preview", () => {
  const preview = buildImportPreview({
    type: "benefits",
    filename: "dup.csv",
    content: "text\nنفس الفائدة\nنفس الفائدة",
  });
  assert(preview.stats?.duplicateRows === 1, "one duplicate");
});

test("batch size tiers", () => {
  assert(resolveImportBatchSize(500) === 100, "small file batch 100");
  assert(resolveImportBatchSize(1500) === 250, "medium file batch 250");
  assert(resolveImportBatchSize(12000) === 500, "large file batch 500");
  assert(resolveUploadBatchSize(60000) === 5000, "upload batch for huge files");
});

test("validateAllRows uses schema for benefits faidah alias", () => {
  const { allValid } = validateAllRows("benefits", [{ faidah: "فائدة", author: "x" }]);
  assert(allValid, "faidah alias validates");
});

test("validateAllRowsWithSchema rejects empty adhkar count", () => {
  const { allValid } = validateAllRowsWithSchema("adhkar", [
    { text: "سبحان الله", category: "صباح", source: "مسلم", count: 0 },
  ]);
  assert(!allValid, "invalid count rejected");
});

test("10k row parse performance smoke", () => {
  const lines = ["text,author_name"];
  for (let i = 0; i < 10_000; i++) lines.push(`فائدة ${i},مؤلف`);
  const started = Date.now();
  const parsed = parseUniversalCsv(lines.join("\n"));
  const ms = Date.now() - started;
  assert(parsed.rowCount === 10_000, `10k rows parsed (${parsed.rowCount})`);
  assert(ms < 15_000, `10k parse under 15s (${ms}ms)`);
});

test("JSON file parse via universal parser", () => {
  const parsed = parseUniversalFile('[{"text":"فائدة"}]', "data.json");
  assert(parsed.format === "json", "json format");
  assert(parsed.rows[0].text === "فائدة", "json row");
});

test("retryImportJob rejects non-terminal job", async () => {
  const result = await retryImportJob("00000000-0000-4000-8000-000000000000");
  assert(result.ok === false, "missing job fails");
});

test("fawaid_500.csv validates with universal engine", () => {
  const path = join(root, "data/imports/fawaid_500.csv");
  if (!existsSync(path)) {
    console.log("⊘ skip fawaid_500.csv (file missing in CI)");
    passed++;
    return;
  }
  const content = readFileSync(path, "utf8");
  const preview = buildImportPreview({ type: "benefits", filename: "fawaid_500.csv", content });
  assert(preview.canImport === true, `fawaid_500 preview: ${preview.validationErrors?.[0] || ""}`);
});

test("dedupe benefits by text", () => {
  const { unique, duplicates } = dedupeRows(
    [{ text: "a" }, { text: "a" }, { text: "b" }],
    "benefits",
  );
  assert(unique.length === 2 && duplicates.length === 1, "dedupe works");
});

test("alias map covers hadith fields", () => {
  const map = getAliasMap("hadith");
  assert(map["المتن"] === "text", "hadith Arabic alias");
  assert(map["source"] === "source", "hadith source alias");
});

console.log(`\nUniversal Import Engine: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
