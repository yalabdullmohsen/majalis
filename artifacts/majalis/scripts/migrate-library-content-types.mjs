#!/usr/bin/env node
/**
 * Classify existing library_items by content_type and emit migration report.
 * Non-destructive — only outputs classification plan (use --apply for JSON patch file).
 *
 * Usage:
 *   node scripts/migrate-library-content-types.mjs
 *   node scripts/migrate-library-content-types.mjs --write-report
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CATALOG_PATH = join(ROOT, "src/data/library-catalog.json");
const REPORT_PATH = join(ROOT, "reports/library-content-type-migration.json");

const LEGACY_TYPE_MAP = {
  كتاب: "book",
  متن: "book",
  شروح: "book",
  موسوعة: "book",
  مقال: "article",
  تفريغ: "article",
  ملخص: "article",
  صوت: "book",
  مرئي: "book",
};

function classify(row) {
  if (row.content_type && ["book", "article", "research"].includes(row.content_type)) {
    return row.content_type;
  }
  const legacy = String(row.type || row.item_type || "").trim();
  if (legacy && LEGACY_TYPE_MAP[legacy]) return LEGACY_TYPE_MAP[legacy];
  const blob = `${row.title || ""} ${row.description || ""}`.toLowerCase();
  if (/رسالة|ماجستير|دكتورah|thesis|dissertation/.test(blob)) return "research";
  if (/مقال|تفريغ|ملخص/.test(blob)) return "article";
  if (legacy === "مقال") return "article";
  if (legacy) return "book";
  return null;
}

function main() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const catalogItems = Array.isArray(catalog) ? catalog : catalog.books || catalog.items || [];

  const report = {
    generatedAt: new Date().toISOString(),
    catalog: { total: catalogItems.length, book: catalogItems.length, article: 0, research: 0, unclassified: 0 },
    database: { note: "Run against Supabase in production; this script classifies local catalog + sample rows." },
    samples: [],
    unclassified: [],
    needsManualReview: [],
    summary: { books: 0, articles: 0, research: 0, unclassified: 0 },
  };

  for (const row of catalogItems) {
    const ct = classify({ ...row, type: row.type || "كتاب" });
    const entry = { id: row.id, title: row.title, type: row.type, content_type: ct };
    report.samples.push(entry);
    if (ct === "book") report.summary.books++;
    else if (ct === "article") report.summary.articles++;
    else if (ct === "research") report.summary.research++;
    else {
      report.summary.unclassified++;
      report.unclassified.push(entry);
    }
  }

  // Simulate mixed DB rows from import templates
  const sampleDb = [
    { title: "مقال في التربية", type: "مقال" },
    { title: "شرح القواعد الأربع", type: "كتاب" },
    { title: "تفريغ درس", type: "تفريغ" },
    { title: "رسالة ماجستير", type: "كتاب", description: "رسالة ماجستير في الفقه" },
    { title: "", type: "" },
  ];

  for (const row of sampleDb) {
    const ct = classify(row);
    const entry = { ...row, content_type: ct };
    if (!ct) {
      report.unclassified.push(entry);
      report.needsManualReview.push(entry);
      report.summary.unclassified++;
    } else if (row.description?.includes("رسالة") && ct !== "research") {
      report.needsManualReview.push({ ...entry, reason: "possible research misclassified as " + ct });
    }
  }

  report.summary.books += report.catalog.book;

  if (process.argv.includes("--write-report")) {
    mkdirSync(join(ROOT, "reports"), { recursive: true });
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
    console.log(`Report written: ${REPORT_PATH}`);
  }

  console.log("=== Library Content Type Migration Report ===\n");
  console.log(`Catalog books: ${report.catalog.total}`);
  console.log(`Classified as book: ${report.summary.books}`);
  console.log(`Classified as article: ${report.summary.articles}`);
  console.log(`Classified as research: ${report.summary.research}`);
  console.log(`Unclassified (need manual review): ${report.summary.unclassified + report.needsManualReview.length}`);
  console.log("\nNo data deleted. Apply SQL: supabase/library_content_types_v1.sql");
}

main();
